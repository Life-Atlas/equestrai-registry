import Stripe from "stripe";
import { getStripe } from "./checkout";

export function constructEvent(body: string, signature: string): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  return stripe.webhooks.constructEvent(body, signature, secret);
}

export interface PaymentCompletedData {
  applicationId: string;
  paymentId: string;
  amountCents: number;
}

export function extractPaymentData(
  event: Stripe.Event,
): PaymentCompletedData | null {
  if (event.type !== "checkout.session.completed") return null;

  const session = event.data.object as Stripe.Checkout.Session;
  const applicationId = session.metadata?.application_id;
  if (!applicationId) return null;

  return {
    applicationId,
    paymentId: session.payment_intent as string,
    amountCents: session.amount_total ?? 0,
  };
}
