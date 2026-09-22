const DIRECT_LOGIN_SOURCE = "direct";

type AdminLoginSourceEnvironment = Partial<
  Record<"ADMIN_TRUST_PROXY_HEADERS", string | undefined>
>;

export function resolveAdminLoginSource(
  forwardedFor: string | null,
  environment: AdminLoginSourceEnvironment,
): string {
  if (environment.ADMIN_TRUST_PROXY_HEADERS !== "true") {
    return DIRECT_LOGIN_SOURCE;
  }

  return forwardedFor?.split(",", 1)[0]?.trim() || DIRECT_LOGIN_SOURCE;
}
