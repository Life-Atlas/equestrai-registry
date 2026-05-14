import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe/checkout";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
    .select("*, applicant:profiles!applications_applicant_id_fkey(email)")
    .eq("id", applicationId)
    .eq("applicant_id", user.id)
    .single();

  if (!app) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }

  const { data: feeRow } = await supabase
    .from("fee_schedules")
    .select("fee_cents, description")
    .eq("application_type", app.application_type)
    .eq("membership_type", "member")
    .is("age_bracket", null)
    .eq("tenant_id", app.tenant_id)
    .single();

  const feeCents = feeRow?.fee_cents ?? 0;

  if (feeCents === 0) {
    await supabase
      .from("applications")
      .update({ payment_status: "paid", status: "submitted" })
      .eq("id", applicationId);

    return NextResponse.json({ url: `/applications/${applicationId}` });
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";

  const { url } = await createCheckoutSession({
    applicationId,
    feeCents,
    description: feeRow?.description ?? `Application ${app.application_type}`,
    customerEmail: user.email ?? "",
    successUrl: `${origin}/applications/${applicationId}?payment=success`,
    cancelUrl: `${origin}/applications/${applicationId}?payment=cancelled`,
  });

  return NextResponse.json({ url });
}
