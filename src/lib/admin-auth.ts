import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAdminAuthConfig,
  verifyAdminSession,
} from "@/lib/admin-session";

export {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  AdminAuthConfigurationError,
  createAdminSession,
  getAdminAuthConfig,
  validateAdminCredentials,
  verifyAdminSession,
} from "@/lib/admin-session";
export type { AdminAuthConfig, AdminSession } from "@/lib/admin-session";

export const ADMIN_SESSION_COOKIE_NAME = "midearth-admin-session";

export class AdminAuthorizationError extends Error {
  constructor() {
    super("Admin authorization required");
    this.name = "AdminAuthorizationError";
  }
}

export async function requireAdminSession(
  context: "page" | "route" = "page",
): Promise<void> {
  const config = getAdminAuthConfig();
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminSession(token, new Date(), config) : null;

  if (session) return;
  if (context === "route") throw new AdminAuthorizationError();
  redirect("/admin/login");
}

export async function assertAdminRequest(): Promise<Response | null> {
  try {
    await requireAdminSession("route");
    return null;
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
