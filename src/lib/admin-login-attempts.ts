import "server-only";

import { createAdminLoginAttemptLimiter } from "@/lib/admin-login-attempt-limiter";

// This in-memory limiter is intentionally per server instance. Deployments that
// need cross-instance enforcement must also configure rate limiting at the host.
const adminLoginAttemptLimiter = createAdminLoginAttemptLimiter();

export function validateAdminLoginAttempt(
  email: string,
  forwardedFor: string | null,
  validateCredentials: () => Promise<boolean>,
): Promise<boolean> {
  return adminLoginAttemptLimiter.validate(email, forwardedFor, validateCredentials);
}
