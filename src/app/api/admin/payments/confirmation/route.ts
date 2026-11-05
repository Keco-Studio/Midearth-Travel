import { assertAdminRequest } from "@/lib/admin-auth";
import { deliverPaidBookingConfirmation } from "@/lib/booking-confirmation-delivery";
import { sendBookingEmail } from "@/lib/resend-booking-email";
import { loadBookingById } from "@/lib/supabase-bookings";
import { loadPublishedHomeModulesStrict } from "@/lib/supabase-home-content";
import {
  loadPaymentOrderForConfirmation,
  markConfirmationEmailSent,
  recordConfirmationEmailError,
} from "@/lib/supabase-payments";
import { loadPublishedToursStrict } from "@/lib/supabase-tours";

export async function POST(request: Request) {
  const unauthorized = await assertAdminRequest();
  if (unauthorized) return unauthorized;

  try {
    const payload = (await request.json()) as { paymentId?: string };
    const paymentId = payload.paymentId?.trim();
    if (!paymentId || paymentId.length > 200) {
      return Response.json({ error: "A valid payment id is required" }, { status: 400 });
    }

    const payment = await loadPaymentOrderForConfirmation(paymentId);
    if (!payment) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }
    const alreadySent = payment.confirmationEmailSentAt !== null;
    await deliverPaidBookingConfirmation(payment, new URL(request.url).origin, {
      loadBookingById,
      loadPublishedTours: loadPublishedToursStrict,
      loadPublishedHomeModules: loadPublishedHomeModulesStrict,
      sendBookingEmail,
      markConfirmationEmailSent,
      recordConfirmationEmailError,
    });
    return Response.json({ sent: !alreadySent });
  } catch {
    return Response.json({ error: "Unable to send confirmation email" }, { status: 500 });
  }
}
