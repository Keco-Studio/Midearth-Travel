import { isValidAdminEmail, normalizeAdminEmail, type PasswordCredentials } from "./admin-users.ts";

const INVITATION_TOKEN_BYTES = 32;
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const textEncoder = new TextEncoder();

export type AdminInvitation = Readonly<{
  id: string;
  email: string;
  tokenHash: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}>;

type AdminInvitationRow = {
  id: string;
  email: string;
  token_hash: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
};

export function createInvitationToken(): string {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(INVITATION_TOKEN_BYTES)));
}

export async function hashInvitationToken(token: string): Promise<string> {
  if (!isValidInvitationToken(token)) throw new TypeError("Invalid invitation token");
  return encodeBase64Url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", textEncoder.encode(token))),
  );
}

export async function isUsableInvitation(
  invitation: AdminInvitation | null,
  token: string,
  email: string,
  now: Date = new Date(),
): Promise<boolean> {
  if (!invitation || invitation.acceptedAt || !isValidAdminEmail(email)) return false;
  if (!Number.isFinite(now.getTime()) || new Date(invitation.expiresAt).getTime() <= now.getTime()) {
    return false;
  }
  try {
    return (
      invitation.email === normalizeAdminEmail(email) &&
      (await hashInvitationToken(token)) === invitation.tokenHash
    );
  } catch {
    return false;
  }
}

export function invitationExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + INVITATION_TTL_MS);
}

export async function findAdminInvitationByTokenHash(
  tokenHash: string,
): Promise<AdminInvitation | null> {
  const rows = await request<AdminInvitationRow[]>(
    `/rest/v1/admin_invitations?select=*&token_hash=eq.${encodeURIComponent(tokenHash)}&limit=1`,
  );
  return rows[0] ? rowToInvitation(rows[0]) : null;
}

export async function replaceAdminInvitation(input: {
  email: string;
  tokenHash: string;
  invitedBy: string;
  expiresAt: Date;
}): Promise<void> {
  const email = normalizeAdminEmail(input.email);
  const invitedBy = normalizeAdminEmail(input.invitedBy);
  if (!isValidAdminEmail(email) || !isValidAdminEmail(invitedBy) || !Number.isFinite(input.expiresAt.getTime())) {
    throw new TypeError("Invalid invitation");
  }

  await request<unknown[]>(`/rest/v1/admin_invitations?email=eq.${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
  await request<unknown[]>("/rest/v1/admin_invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{
      id: crypto.randomUUID(),
      email,
      token_hash: input.tokenHash,
      invited_by: invitedBy,
      expires_at: input.expiresAt.toISOString(),
    }]),
  });
}

export async function acceptInvitationAndCreateAdmin(
  invitation: AdminInvitation,
  credentials: PasswordCredentials,
): Promise<boolean> {
  const result = await request<boolean | boolean[]>("/rest/v1/rpc/accept_admin_invitation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invitation_id: invitation.id,
      invited_email: invitation.email,
      password_salt: credentials.salt,
      password_hash: credentials.hash,
    }),
  });
  return Array.isArray(result) ? result[0] === true : result === true;
}

function rowToInvitation(row: AdminInvitationRow): AdminInvitation {
  return {
    id: row.id,
    email: normalizeAdminEmail(row.email),
    tokenHash: row.token_hash,
    invitedBy: normalizeAdminEmail(row.invited_by),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
  };
}

function isValidInvitationToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!url || !key) throw new Error("Supabase is not configured");

  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...init.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error((await response.text()) || "Supabase request failed");
  const body = await response.text();
  return (body ? JSON.parse(body) : undefined) as T;
}
