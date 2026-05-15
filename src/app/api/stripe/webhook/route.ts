import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { constructEvent, extractPaymentData } from "@/lib/stripe/webhook";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event;
  try {
    event = constructEvent(body, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const paymentData = extractPaymentData(event);
  if (!paymentData) {
    return NextResponse.json({ received: true });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    db: { schema: "equestrai" },
  });

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      payment_status: "paid",
      payment_id: paymentData.paymentId,
      fee_cents: paymentData.amountCents,
      status: "submitted",
    })
    .eq("id", paymentData.applicationId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
