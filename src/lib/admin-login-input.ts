export const ADMIN_LOGIN_EMAIL_MAX_LENGTH = 254;
export const ADMIN_LOGIN_PASSWORD_MAX_LENGTH = 256;

export type AdminLoginPayload = Readonly<{
  email: string;
  password: string;
}>;

export function parseAdminLoginPayload(value: unknown): AdminLoginPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const payload = value as { email?: unknown; password?: unknown };
  if (
    typeof payload.email !== "string" ||
    typeof payload.password !== "string" ||
    payload.email.length === 0 ||
    payload.email.length > ADMIN_LOGIN_EMAIL_MAX_LENGTH ||
    payload.password.length === 0 ||
    payload.password.length > ADMIN_LOGIN_PASSWORD_MAX_LENGTH
  ) {
    return null;
  }

  return { email: payload.email, password: payload.password };
}
