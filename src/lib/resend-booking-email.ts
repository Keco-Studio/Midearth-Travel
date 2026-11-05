import "server-only";
import {
  sendBookingEmailWithEnvironment,
  type SendBookingEmailInput,
} from "./resend-booking-email-core.ts";

export function sendBookingEmail(input: SendBookingEmailInput): Promise<{ id: string }> {
  return sendBookingEmailWithEnvironment(input, process.env);
}
