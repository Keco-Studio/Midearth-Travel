import type { RenderedBookingEmail } from "./booking-confirmation-template.ts";

export type SendBookingEmailInput = {
  paymentId: string;
  to: string;
  message: RenderedBookingEmail;
};

export type ResendBookingEmailEnvironment = Partial<Record<string, string | undefined>>;

export type ResendBookingEmailConfig = {
  apiKey: string;
  from: string;
  replyTo?: string;
};

const RESEND_EMAILS_URL = "https://api.resend.com/emails";

function requiredValue(environment: ResendBookingEmailEnvironment, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  if (/replace/i.test(value)) throw new Error(`${name} contains a placeholder`);
  return value;
}

function isValidEmailAddress(value: string): boolean {
  if (value.length > 254 || /[\r\n]/.test(value)) return false;
  const address = value.includes("<") || value.includes(">")
    ? value.match(/^[^<>]+<([^<>]+)>$/)?.[1]?.trim()
    : value;
  if (!address) return false;
  const match = address.match(/^[^\s@]+@([^\s@.]+(?:\.[^\s@.]+)+)$/);
  if (!match) return false;
  const localPart = address.slice(0, address.lastIndexOf("@"));
  return localPart.length > 0 && !localPart.startsWith(".") && !localPart.endsWith(".") && !localPart.includes("..")
    && match[1].split(".").every((label) => !label.startsWith("-") && !label.endsWith("-"));
}

function validateAddress(value: string, label: string): string {
  const trimmed = value.trim();
  if (!isValidEmailAddress(trimmed)) throw new Error(`${label} must be a valid email address`);
  return trimmed;
}

export function getResendBookingEmailConfig(
  environment: ResendBookingEmailEnvironment,
): ResendBookingEmailConfig {
  const apiKey = requiredValue(environment, "RESEND_API_KEY");
  const from = validateAddress(requiredValue(environment, "BOOKING_EMAIL_FROM"), "BOOKING_EMAIL_FROM");
  const configuredReplyTo = environment.BOOKING_EMAIL_REPLY_TO?.trim();
  const replyTo = configuredReplyTo ? validateAddress(configuredReplyTo, "BOOKING_EMAIL_REPLY_TO") : undefined;

  return { apiKey, from, ...(replyTo ? { replyTo } : {}) };
}

export async function sendBookingEmailWithEnvironment(
  input: SendBookingEmailInput,
  environment: ResendBookingEmailEnvironment,
  fetchImplementation: typeof fetch = globalThis.fetch,
): Promise<{ id: string }> {
  const config = getResendBookingEmailConfig(environment);
  const paymentId = input.paymentId.trim();
  if (!paymentId) throw new Error("paymentId is required");
  const to = validateAddress(input.to, "recipient");

  const payload = {
    from: config.from,
    to: [to],
    ...(config.replyTo ? { reply_to: config.replyTo } : {}),
    subject: input.message.subject,
    html: input.message.html,
    text: input.message.text,
  };

  let response: Response;
  try {
    response = await fetchImplementation(RESEND_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `booking-confirmation-${paymentId}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Unable to send Resend booking email");
  }

  if (!response.ok) throw new Error(`Resend booking email failed (${response.status})`);

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Resend booking email returned an invalid response");
  }

  if (
    typeof responseBody !== "object" ||
    responseBody === null ||
    !("id" in responseBody) ||
    typeof responseBody.id !== "string" ||
    !responseBody.id.trim()
  ) {
    throw new Error("Resend booking email returned an invalid response");
  }

  return { id: responseBody.id };
}
