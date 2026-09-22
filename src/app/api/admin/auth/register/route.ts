import { validateAdminLoginAttempt } from "@/lib/admin-login-attempts";
import {
  acceptInvitationAndCreateAdmin,
  findAdminInvitationByTokenHash,
  hashInvitationToken,
  isUsableInvitation,
} from "@/lib/admin-invitations";
import { parseAdminRegistrationPayload } from "@/lib/admin-invitation-input";
import { hashAdminPassword } from "@/lib/admin-users";
import { setAdminSessionCookie } from "@/lib/admin-session-cookie";

const REGISTRATION_ERROR = "This invitation is unavailable";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return unavailableResponse();
  }

  const registration = parseAdminRegistrationPayload(payload);
  if (!registration) return unavailableResponse();

  try {
    const registered = await validateAdminLoginAttempt(
      registration.email,
      request.headers.get("x-forwarded-for"),
      async () => {
        const tokenHash = await hashInvitationToken(registration.token);
        const invitation = await findAdminInvitationByTokenHash(tokenHash);
        if (!invitation) return false;
        if (!(await isUsableInvitation(invitation, registration.token, registration.email))) {
          return false;
        }
        const credentials = await hashAdminPassword(registration.password);
        return acceptInvitationAndCreateAdmin(invitation, credentials);
      },
    );
    if (!registered) return unavailableResponse();

    await setAdminSessionCookie(registration.email);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin registration failed", error);
    return unavailableResponse();
  }
}

function unavailableResponse(): Response {
  return Response.json({ error: REGISTRATION_ERROR }, { status: 400 });
}
