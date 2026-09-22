import { validateAdminLoginAttempt } from "@/lib/admin-login-attempts";
import { parseAdminLoginPayload } from "@/lib/admin-login-input";
import {
  AdminAuthConfigurationError,
  validateAdminCredentials,
} from "@/lib/admin-auth";
import { setAdminSessionCookie } from "@/lib/admin-session-cookie";

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

    await setAdminSessionCookie(login.email);

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
