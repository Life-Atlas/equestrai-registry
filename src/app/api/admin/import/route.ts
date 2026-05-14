import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  parseCSVRow,
  validateImportRow,
  findDuplicates,
  type ImportResult,
} from "@/lib/legacy-import";
import type { UserRole } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role as UserRole) !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json();
  const { csvData, dryRun = true } = body as {
    csvData: string;
    dryRun?: boolean;
  };

  if (!csvData) {
    return NextResponse.json({ error: "csvData required" }, { status: 400 });
  }

  const lines = csvData.split("\n").filter((l: string) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json(
      { error: "CSV must have header + at least 1 row" },
      { status: 400 },
    );
  }

  const headers = lines[0].split(",");
  const rows = lines.slice(1).map((line: string) => {
    const values = line.split(",");
    return parseCSVRow(headers, values);
  });

  const allErrors = rows.flatMap((row, i) => validateImportRow(row, i + 2));

  const { data: existingHorses } = await supabase
    .from("horses")
    .select("name, microchip_number")
    .eq("tenant_id", profile.tenant_id);

  const existingNames = new Set(
    (existingHorses ?? []).map((h: { name: string }) => h.name.toLowerCase()),
  );
  const existingChips = new Set(
    (existingHorses ?? [])
      .map((h: { microchip_number: string | null }) => h.microchip_number)
      .filter(Boolean) as string[],
  );

  const duplicates = findDuplicates(rows, existingNames, existingChips);

  const result: ImportResult = {
    total: rows.length,
    imported: 0,
    skipped: 0,
    errors: allErrors,
    duplicates,
  };

  if (dryRun || allErrors.length > 0) {
    result.skipped = rows.length;
    return NextResponse.json({ result, dryRun: true });
  }

  for (const row of rows) {
    if (existingNames.has(row.name.toLowerCase())) {
      result.skipped++;
      continue;
    }

    const { error: insertError } = await supabase.from("horses").insert({
      tenant_id: profile.tenant_id,
      name: row.name,
      sex: row.sex || null,
      breed_type: row.breed || null,
      color: row.color || null,
      date_of_birth: row.date_of_birth || null,
      microchip_number: row.microchip || null,
      registration_number: row.registration_number || null,
      status: "registered",
    });

    if (insertError) {
      result.errors.push({
        row: result.imported + result.skipped + 2,
        field: "insert",
        message: insertError.message,
      });
      result.skipped++;
    } else {
      result.imported++;
    }
  }

  await supabase.from("audit_log").insert({
    tenant_id: profile.tenant_id,
    actor_id: user.id,
    action: "legacy_import",
    entity_type: "horse",
    entity_id: null,
    details: {
      total: result.total,
      imported: result.imported,
      skipped: result.skipped,
      errorCount: result.errors.length,
    },
  });

  return NextResponse.json({ result, dryRun: false });
}
