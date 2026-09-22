import { cookies } from "next/headers";
import { validateAdminLoginAttempt } from "@/lib/admin-login-attempts";
import { parseAdminLoginPayload } from "@/lib/admin-login-input";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  AdminAuthConfigurationError,
  createAdminSession,
  validateAdminCredentials,
} from "@/lib/admin-auth";

const INVALID_CREDENTIALS = "Invalid email or password";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return invalidCredentialsResponse();
  }

  const login = parseAdminLoginPayload(payload);
  if (!login) return invalidCredentialsResponse();

  try {
    const isValid = await validateAdminLoginAttempt(
      login.email,
      request.headers.get("x-forwarded-for"),
      () => validateAdminCredentials(login.email, login.password),
    );
    if (!isValid) return invalidCredentialsResponse();

    const token = await createAdminSession(login.email);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthConfigurationError) {
      console.error("Admin authentication is not configured", error);
    } else {
      console.error("Admin login failed", error);
    }
    return Response.json(
      { error: "Admin authentication is unavailable" },
      { status: 500 },
    );
  }
}

function invalidCredentialsResponse(): Response {
  return Response.json({ error: INVALID_CREDENTIALS }, { status: 401 });
}
