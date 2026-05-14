import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateStaffAction,
  generateRegistrationNumber,
} from "@/lib/staff-actions";
import type { ApplicationStatus, UserRole } from "@/lib/constants";

const STAFF_ROLES: UserRole[] = ["staff", "admin", "board"];

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

  if (!profile || !STAFF_ROLES.includes(profile.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { applicationId, targetStatus } = body as {
    applicationId: string;
    targetStatus: ApplicationStatus;
  };

  if (!applicationId || !targetStatus) {
    return NextResponse.json(
      { error: "applicationId and targetStatus required" },
      { status: 400 },
    );
  }

  const { data: app } = await supabase
    .from("applications")
    .select("id, status, application_type, form_data, tenant_id")
    .eq("id", applicationId)
    .single();

  if (!app) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }

  const result = validateStaffAction(
    app.status as ApplicationStatus,
    targetStatus,
    profile.role as string,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    status: targetStatus,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };

  if (targetStatus === "approved") {
    const { count } = await supabase
      .from("horses")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", app.tenant_id);

    const nextSeq = (count ?? 0) + 1;

    const { data: tenant } = await supabase
      .from("tenants")
      .select("short_name")
      .eq("id", app.tenant_id as string)
      .single();

    const prefix = tenant?.short_name ?? "REG";
    const regNumber = generateRegistrationNumber(
      prefix,
      nextSeq,
      new Date().getFullYear(),
    );

    const formData = (app.form_data ?? {}) as Record<string, string | null>;

    const { error: horseError } = await supabase.from("horses").insert({
      tenant_id: app.tenant_id,
      name: formData.horse_name,
      sex: formData.sex,
      breed_type: formData.breed_type,
      color: formData.color || null,
      date_of_birth: formData.date_of_birth || null,
      microchip_number: formData.microchip_number || null,
      registration_number: regNumber,
      status: "registered",
    });

    if (horseError) {
      return NextResponse.json(
        { error: "Failed to create horse record" },
        { status: 500 },
      );
    }
  }

  const { error: updateError } = await supabase
    .from("applications")
    .update(updateData)
    .eq("id", applicationId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }

  await supabase.from("audit_log").insert({
    tenant_id: app.tenant_id,
    actor_id: user.id,
    action: `application_${targetStatus}`,
    entity_type: "application",
    entity_id: applicationId,
    details: { from: app.status, to: targetStatus },
  });

  return NextResponse.json({ status: targetStatus });
}
