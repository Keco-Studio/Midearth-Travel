import assert from "node:assert/strict";
import test from "node:test";
import {
  createInvitationToken,
  hashInvitationToken,
  isUsableInvitation,
  replaceAdminInvitation,
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

test("creates an invitation after Supabase accepts an empty delete response", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const methods: string[] = [];
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  globalThis.fetch = async (_input, init) => {
    methods.push(init?.method ?? "GET");
    return methods.length === 1
      ? new Response(null, { status: 204 })
      : new Response(null, { status: 201 });
  };

  try {
    await replaceAdminInvitation({
      email: "new.admin@midearthtravel.ca",
      tokenHash: "a".repeat(43),
      invitedBy: "owner@midearthtravel.ca",
      expiresAt: new Date("2026-09-29T00:00:00.000Z"),
    });
    assert.deepEqual(methods, ["DELETE", "POST"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  }
});
