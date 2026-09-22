const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_HASH_BYTES = 32;
const ADMIN_PASSWORD_MIN_LENGTH = 12;
const ADMIN_PASSWORD_MAX_LENGTH = 256;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const textEncoder = new TextEncoder();

export type PasswordCredentials = Readonly<{ salt: string; hash: string }>;

export type AdminUser = Readonly<{
  email: string;
  passwordSalt: string;
  passwordHash: string;
  invitedBy: string;
  createdAt: string;
}>;

type AdminUserRow = {
  email: string;
  password_salt: string;
  password_hash: string;
  invited_by: string;
  created_at: string;
};

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidAdminEmail(email: string): boolean {
  const normalized = normalizeAdminEmail(email);
  return normalized.length > 0 && normalized.length <= 254 && EMAIL_PATTERN.test(normalized);
}

export async function hashAdminPassword(password: string): Promise<PasswordCredentials> {
  assertPassword(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt);
  return { salt: encodeBase64Url(salt), hash: encodeBase64Url(hash) };
}

export async function verifyAdminPassword(
  password: string,
  salt: string,
  hash: string,
): Promise<boolean> {
  try {
    assertPassword(password);
    const expected = decodeBase64Url(hash);
    if (expected.byteLength !== PBKDF2_HASH_BYTES) return false;
    const actual = await derivePassword(password, decodeBase64Url(salt));
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function findAdminUser(email: string): Promise<AdminUser | null> {
  const normalized = normalizeAdminEmail(email);
  if (!isValidAdminEmail(normalized)) return null;

  const config = getConfig();
  if (!config) return null;

  const rows = await request<AdminUserRow[]>(
    `/rest/v1/admin_users?select=*&email=eq.${encodeURIComponent(normalized)}&limit=1`,
    config,
  );
  const row = rows[0];
  return row
    ? {
        email: row.email,
        passwordSalt: row.password_salt,
        passwordHash: row.password_hash,
        invitedBy: row.invited_by,
        createdAt: row.created_at,
      }
    : null;
}

export async function hasAdminUser(email: string): Promise<boolean> {
  return Boolean(await findAdminUser(email));
}

async function derivePassword(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new Uint8Array(salt),
      iterations: PBKDF2_ITERATIONS,
    },
    key,
    PBKDF2_HASH_BYTES * 8,
  );
  return new Uint8Array(bits);
}

function assertPassword(password: string): void {
  if (
    typeof password !== "string" ||
    password.length < ADMIN_PASSWORD_MIN_LENGTH ||
    password.length > ADMIN_PASSWORD_MAX_LENGTH
  ) {
    throw new TypeError("Administrator password is invalid");
  }
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  const length = Math.max(left.byteLength, right.byteLength);
  let difference = left.byteLength ^ right.byteLength;
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
    throw new TypeError("Invalid base64url");
  }
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

type SupabaseConfig = { url: string; key: string };

function getConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  return url && key ? { url, key } : null;
}

async function request<T>(path: string, config: SupabaseConfig): Promise<T> {
  const response = await fetch(`${config.url}${path}`, {
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error((await response.text()) || "Supabase request failed");
  return response.json() as Promise<T>;
}
