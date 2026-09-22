import assert from "node:assert/strict";
import test from "node:test";
import {
  createInvitationToken,
  hashInvitationToken,
  isUsableInvitation,
} from "../src/lib/admin-invitations.ts";

test("accepts only a matching unexpired unused invitation", async () => {
  const token = createInvitationToken();
  const invitation = {
    id: "a4ca31b8-f645-4fd7-b5ae-7c4f060d2386",
    email: "new.admin@midearthtravel.ca",
    tokenHash: await hashInvitationToken(token),
    invitedBy: "owner@midearthtravel.ca",
    createdAt: "2026-09-22T00:00:00.000Z",
    expiresAt: "2026-09-29T00:00:00.000Z",
    acceptedAt: null,
  };
  const now = new Date("2026-09-22T01:00:00.000Z");

  assert.equal(
    await isUsableInvitation(invitation, token, "new.admin@midearthtravel.ca", now),
    true,
  );
  assert.equal(
    await isUsableInvitation(invitation, token, "other@midearthtravel.ca", now),
    false,
  );
  assert.equal(
    await isUsableInvitation({ ...invitation, acceptedAt: now.toISOString() }, token, invitation.email, now),
    false,
  );
  assert.equal(
    await isUsableInvitation({ ...invitation, expiresAt: now.toISOString() }, token, invitation.email, now),
    false,
  );
});
