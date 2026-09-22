import { isValidAdminEmail, normalizeAdminEmail } from "./admin-users.ts";

const ADMIN_PASSWORD_MIN_LENGTH = 12;
const ADMIN_PASSWORD_MAX_LENGTH = 256;
const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type AdminInvitationPayload = Readonly<{ email: string }>;

export type AdminRegistrationPayload = Readonly<{
  email: string;
  password: string;
  token: string;
}>;

export function parseAdminInvitationPayload(value: unknown): AdminInvitationPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const email = (value as { email?: unknown }).email;
  if (typeof email !== "string" || !isValidAdminEmail(email)) return null;
  return { email: normalizeAdminEmail(email) };
}

export function parseAdminRegistrationPayload(value: unknown): AdminRegistrationPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as { email?: unknown; password?: unknown; token?: unknown };
  if (
    typeof payload.email !== "string" ||
    typeof payload.password !== "string" ||
    typeof payload.token !== "string" ||
    !isValidAdminEmail(payload.email) ||
    payload.password.length < ADMIN_PASSWORD_MIN_LENGTH ||
    payload.password.length > ADMIN_PASSWORD_MAX_LENGTH ||
    !INVITATION_TOKEN_PATTERN.test(payload.token)
  ) {
    return null;
  }
  return { email: normalizeAdminEmail(payload.email), password: payload.password, token: payload.token };
}
