import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    stripeInstance = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  }
  return stripeInstance;
}

export interface CreateCheckoutParams {
  applicationId: string;
  feeCents: number;
  description: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutParams,
): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: params.description,
            metadata: { application_id: params.applicationId },
          },
          unit_amount: params.feeCents,
        },
        quantity: 1,
      },
    ],
    metadata: { application_id: params.applicationId },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return { sessionId: session.id, url: session.url! };
}
