import type Stripe from "stripe";
import { getPaymentStatusForCheckoutEvent } from "./payment-domain.ts";
import type { InternalPaymentStatus } from "./payment-domain.ts";
import type { PaymentOrderDeliveryRecord } from "./supabase-payments.ts";

type PaymentUpdateInput = {
  sessionId: string;
  status: InternalPaymentStatus;
  paymentIntentId?: string | null;
};

export type StripeWebhookProcessingDependencies = {
  hasWebhookEvent: (eventId: string) => Promise<boolean>;
  updatePaymentOrderFromStripe: (
    input: PaymentUpdateInput,
  ) => Promise<PaymentOrderDeliveryRecord | null>;
  deliverPaidBookingConfirmation: (
    payment: PaymentOrderDeliveryRecord,
    siteOrigin: string,
  ) => Promise<void>;
  recordWebhookEvent: (
    eventId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ) => Promise<boolean>;
};

export async function processVerifiedStripeEvent(
  event: Stripe.Event,
  siteOrigin: string,
  dependencies: StripeWebhookProcessingDependencies,
): Promise<void> {
  if (await dependencies.hasWebhookEvent(event.id)) return;

  const object = event.data.object as unknown as { id?: string };
  const session = event.data.object as Stripe.Checkout.Session;
  const status = getPaymentStatusForCheckoutEvent(
    event.type,
    session.payment_status,
  );

  if (status) {
    const payment = await dependencies.updatePaymentOrderFromStripe({
      sessionId: session.id,
      status,
      paymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    });
    if (status === "paid") {
      if (!payment) {
        throw new Error(`Payment order not found for Stripe session: ${session.id}`);
      }
      await dependencies.deliverPaidBookingConfirmation(payment, siteOrigin);
    }
  }

  await dependencies.recordWebhookEvent(
    event.id,
    event.type,
    { objectId: object.id ?? null },
  );
}
