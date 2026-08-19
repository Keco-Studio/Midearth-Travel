import { randomUUID } from "node:crypto";
import { getTourBySlug } from "@/data/tours";
import {
  getFareAmountInCents,
  normalizeCurrency,
  validateCheckoutInput,
} from "@/lib/payment-domain";
import { getStripe } from "@/lib/stripe";
import {
  attachStripeSession,
  createPaymentOrder,
} from "@/lib/supabase-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = validateCheckoutInput(await request.json());
    const tour = getTourBySlug(input.tourSlug);
    if (!tour) return Response.json({ error: "Tour not found" }, { status: 400 });
    const fare = tour.fares?.find(
      (candidate) => candidate.label.toLowerCase() === input.fareLabel.toLowerCase(),
    );
    if (!fare) return Response.json({ error: "Fare not found" }, { status: 400 });

    const amountCents = getFareAmountInCents(fare.price);
    const currency = normalizeCurrency("CAD");
    const paymentId = `pay_${randomUUID()}`;
    const reference = `PAY-${new Date().getUTCFullYear()}-${paymentId.slice(-8).toUpperCase()}`;
    const stripe = getStripe();
    await createPaymentOrder({
      id: paymentId,
      reference,
      bookingId: input.bookingId,
      tourSlug: tour.slug,
      fareLabel: fare.label,
      paymentType: input.paymentType,
      customerEmail: input.customerEmail,
      amountCents,
      currency,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: input.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountCents,
            product_data: {
              name: `${tour.title} — ${fare.label}`,
              description: `${input.paymentType} payment for ${tour.title}`,
            },
          },
        },
      ],
      metadata: {
        paymentId,
        paymentReference: reference,
        tourSlug: tour.slug,
        fareLabel: fare.label,
        paymentType: input.paymentType,
      },
      success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/payment/cancel?payment_id=${encodeURIComponent(paymentId)}`,
    });
    if (!session.url) throw new Error("Stripe did not return a Checkout URL");
    await attachStripeSession(paymentId, session.id);
    return Response.json({ url: session.url, paymentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout";
    const status = /required|valid|not found|only CAD/i.test(message) ? 400 : /not configured/i.test(message) ? 503 : 500;
    console.error("Checkout session creation failed", error);
    return Response.json({ error: status === 500 ? "Unable to start checkout" : message }, { status });
  }
}
