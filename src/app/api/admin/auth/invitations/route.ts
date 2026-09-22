import { assertAdminRequest, requireAdminSession } from "@/lib/admin-auth";
import { hasAdminUser } from "@/lib/admin-users";
import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiry,
  replaceAdminInvitation,
} from "@/lib/admin-invitations";
import { parseAdminInvitationPayload } from "@/lib/admin-invitation-input";

const INVITATION_ERROR = "Unable to create invitation";

export async function POST(request: Request) {
  const unauthorized = await assertAdminRequest();
  if (unauthorized) return unauthorized;

  try {
    const input = parseAdminInvitationPayload(await request.json());
    if (!input || (await hasAdminUser(input.email))) {
      return Response.json({ error: INVITATION_ERROR }, { status: 400 });
    }

    const session = await requireAdminSession("route");
    const token = createInvitationToken();
    await replaceAdminInvitation({
      email: input.email,
      tokenHash: await hashInvitationToken(token),
      invitedBy: session.email,
      expiresAt: invitationExpiry(),
    });

    const url = new URL("/admin/register", request.url);
    url.searchParams.set("token", token);
    return Response.json({ registrationUrl: url.toString() });
  } catch (error) {
    console.error("Admin invitation creation failed", error);
    return Response.json({ error: INVITATION_ERROR }, { status: 400 });
  }
}
