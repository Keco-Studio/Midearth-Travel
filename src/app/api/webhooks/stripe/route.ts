import type Stripe from "stripe";
import { deliverPaidBookingConfirmation } from "@/lib/booking-confirmation-delivery";
import { sendBookingEmail } from "@/lib/resend-booking-email";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { processVerifiedStripeEvent } from "@/lib/stripe-webhook-processing";
import { loadBookingById } from "@/lib/supabase-bookings";
import { loadPublishedHomeModulesStrict } from "@/lib/supabase-home-content";
import {
  hasWebhookEvent,
  markConfirmationEmailSent,
  recordConfirmationEmailError,
  recordWebhookEvent,
  updatePaymentOrderFromStripe,
} from "@/lib/supabase-payments";
import { loadPublishedToursStrict } from "@/lib/supabase-tours";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      getStripeWebhookSecret(),
    );
  } catch {
    console.error("Stripe webhook signature verification failed");
    return Response.json({ error: "Invalid webhook" }, { status: 400 });
  }
  try {
    await processVerifiedStripeEvent(event, new URL(request.url).origin, {
      hasWebhookEvent,
      updatePaymentOrderFromStripe,
      deliverPaidBookingConfirmation: (payment, siteOrigin) =>
        deliverPaidBookingConfirmation(payment, siteOrigin, {
          loadBookingById,
          loadPublishedTours: loadPublishedToursStrict,
          loadPublishedHomeModules: loadPublishedHomeModulesStrict,
          sendBookingEmail,
          markConfirmationEmailSent,
          recordConfirmationEmailError,
        }),
      recordWebhookEvent,
    });
    return Response.json({ received: true });
  } catch {
    console.error("Stripe webhook processing failed");
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
