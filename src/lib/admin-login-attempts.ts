import "server-only";

import { createAdminLoginAttemptLimiter } from "@/lib/admin-login-attempt-limiter";
import { resolveAdminLoginSource } from "@/lib/admin-login-source";

// This in-memory limiter is intentionally per server instance. Deployments that
// need cross-instance enforcement must also configure rate limiting at the host.
const adminLoginAttemptLimiter = createAdminLoginAttemptLimiter();

export function validateAdminLoginAttempt(
  email: string,
  forwardedFor: string | null,
  validateCredentials: () => Promise<boolean>,
): Promise<boolean> {
  const source = resolveAdminLoginSource(forwardedFor, {
    ADMIN_TRUST_PROXY_HEADERS: process.env.ADMIN_TRUST_PROXY_HEADERS,
  });
  return adminLoginAttemptLimiter.validate(email, source, validateCredentials);
}
