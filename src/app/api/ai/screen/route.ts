import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { screenApplication, type ScreeningInput } from "@/lib/ai-screening";
import type { UserRole } from "@/lib/constants";

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
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { applicationId } = body;

  if (!applicationId) {
    return NextResponse.json(
      { error: "applicationId required" },
      { status: 400 },
    );
  }

  const { data: app } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (!app) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }

  const formData = (app.form_data ?? {}) as Record<string, string | null>;

  const input: ScreeningInput = {
    application_type: app.application_type,
    horse_name: formData.horse_name ?? "",
    sex: formData.sex ?? "",
    breed_type: formData.breed_type as ScreeningInput["breed_type"],
    sire_name: formData.sire_name ?? null,
    dam_name: formData.dam_name ?? null,
    sire_id: formData.sire_id ?? null,
    dam_id: formData.dam_id ?? null,
    date_of_birth: formData.date_of_birth ?? null,
    microchip_number: formData.microchip_number ?? null,
    color: formData.color ?? null,
    marking_photos: (formData.marking_photos as unknown as string[]) ?? [],
    transfer_to_email: formData.transfer_to_email ?? null,
  };

  const result = screenApplication(input);

  await supabase
    .from("applications")
    .update({
      ai_confidence: result.confidence,
      ai_flags: result.flags,
    })
    .eq("id", applicationId);

  await supabase.from("audit_log").insert({
    tenant_id: app.tenant_id,
    actor_id: user.id,
    action: "ai_screening",
    entity_type: "application",
    entity_id: applicationId,
    details: {
      confidence: result.confidence,
      flagCount: result.flags.length,
      autoApprovable: result.autoApprovable,
    },
  });

  return NextResponse.json(result);
}
