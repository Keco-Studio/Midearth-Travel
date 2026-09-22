export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const ADMIN_SESSION_MAX_AGE_MS = ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
const ADMIN_EMAIL_MAX_LENGTH = 254;
const ADMIN_PASSWORD_MIN_LENGTH = 12;
const ADMIN_SESSION_SECRET_MIN_LENGTH = 32;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EXAMPLE_EMAIL_DOMAIN_PATTERN = /@example\.(?:com|net|org)$/i;
const PLACEHOLDER_PATTERN = /(?:^|[_\s-])(?:example|placeholder|change[_\s-]?me|replace[_\s-]?(?:me|with))(?:$|[_\s-])/i;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export type AdminAuthConfig = Readonly<{
  initialEmail: string;
  initialPassword: string;
  sessionSecret: string;
}>;

export type AdminSession = Readonly<{
  email: string;
  issuedAt: number;
  expiresAt: number;
}>;

type SessionPayload = {
  email: string;
  iat: number;
  exp: number;
};

export class AdminAuthConfigurationError extends Error {
  constructor(invalidVariables: string[]) {
    super(`Invalid or missing admin authentication configuration: ${invalidVariables.join(", ")}`);
    this.name = "AdminAuthConfigurationError";
  }
}

export function getAdminAuthConfig(
  environment: Partial<Record<string, string | undefined>> = process.env,
): AdminAuthConfig {
  return validateConfig({
    initialEmail: environment.ADMIN_INITIAL_EMAIL ?? "",
    initialPassword: environment.ADMIN_INITIAL_PASSWORD ?? "",
    sessionSecret: environment.ADMIN_SESSION_SECRET ?? "",
  });
}

export async function validateAdminCredentials(
  email: string,
  password: string,
  config: AdminAuthConfig = getAdminAuthConfig(),
): Promise<boolean> {
  const resolvedConfig = validateConfig(config);
  const [providedEmail, expectedEmail, providedPassword, expectedPassword] =
    await Promise.all([
      hashCredential(email),
      hashCredential(resolvedConfig.initialEmail),
      hashCredential(password),
      hashCredential(resolvedConfig.initialPassword),
    ]);

  const emailMatches = constantTimeEqual(providedEmail, expectedEmail);
  const passwordMatches = constantTimeEqual(providedPassword, expectedPassword);
  return (Number(emailMatches) & Number(passwordMatches)) === 1;
}

export async function createAdminSession(
  email: string,
  now: Date = new Date(),
  config: AdminAuthConfig = getAdminAuthConfig(),
): Promise<string> {
  const resolvedConfig = validateConfig(config);
  const issuedAt = now.getTime();

  if (!email || !Number.isFinite(issuedAt)) {
    throw new TypeError("A valid admin email and issue time are required");
  }

  const payload = encodeBase64Url(
    textEncoder.encode(
      JSON.stringify({
        email,
        iat: issuedAt,
        exp: issuedAt + ADMIN_SESSION_MAX_AGE_MS,
      } satisfies SessionPayload),
    ),
  );
  const signature = await sign(payload, resolvedConfig.sessionSecret);

  return `${payload}.${encodeBase64Url(signature)}`;
}

export async function verifyAdminSession(
  token: string,
  now: Date = new Date(),
  config: AdminAuthConfig = getAdminAuthConfig(),
): Promise<AdminSession | null> {
  const resolvedConfig = validateConfig(config);
  const nowTimestamp = now.getTime();

  if (!Number.isFinite(nowTimestamp)) return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  try {
    const signature = decodeBase64Url(parts[1]);
    if (signature.byteLength !== 32) return null;

    const expectedSignature = await sign(parts[0], resolvedConfig.sessionSecret);
    if (!constantTimeEqual(signature, expectedSignature)) return null;

    const payload = JSON.parse(
      textDecoder.decode(decodeBase64Url(parts[0])),
    ) as Partial<SessionPayload>;
    const { email, iat, exp } = payload;

    if (
      typeof email !== "string" ||
      !email ||
      typeof iat !== "number" ||
      typeof exp !== "number" ||
      !Number.isSafeInteger(iat) ||
      !Number.isSafeInteger(exp) ||
      exp - iat !== ADMIN_SESSION_MAX_AGE_MS ||
      iat > nowTimestamp ||
      exp <= nowTimestamp
    ) {
      return null;
    }

    return {
      email,
      issuedAt: iat,
      expiresAt: exp,
    };
  } catch {
    return null;
  }
}

function validateConfig(config: AdminAuthConfig): AdminAuthConfig {
  const initialEmail = config.initialEmail.trim();
  const initialPassword = config.initialPassword.trim();
  const sessionSecret = config.sessionSecret.trim();
  const invalidVariables = [
    [
      "ADMIN_INITIAL_EMAIL",
      !isValidAdminEmail(initialEmail) || isPlaceholder(initialEmail),
    ],
    [
      "ADMIN_INITIAL_PASSWORD",
      initialPassword.length < ADMIN_PASSWORD_MIN_LENGTH ||
        isPlaceholder(config.initialPassword),
    ],
    [
      "ADMIN_SESSION_SECRET",
      sessionSecret.length < ADMIN_SESSION_SECRET_MIN_LENGTH ||
        isPlaceholder(config.sessionSecret),
    ],
  ]
    .filter(([, invalid]) => invalid)
    .map(([name]) => name as string);

  if (invalidVariables.length > 0) {
    throw new AdminAuthConfigurationError(invalidVariables);
  }

  return {
    initialEmail,
    initialPassword: config.initialPassword,
    sessionSecret: config.sessionSecret,
  };
}

function isValidAdminEmail(value: string): boolean {
  return (
    value.length <= ADMIN_EMAIL_MAX_LENGTH &&
    EMAIL_PATTERN.test(value) &&
    !EXAMPLE_EMAIL_DOMAIN_PATTERN.test(value)
  );
}

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERN.test(value.trim());
}

async function hashCredential(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", textEncoder.encode(value)),
  );
}

async function sign(value: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, textEncoder.encode(value)),
  );
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
    throw new TypeError("Invalid base64url value");
  }

  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
