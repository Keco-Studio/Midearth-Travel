const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

type AttemptWindow = {
  failedAttempts: number;
  startedAt: number;
};

type CredentialValidator = () => Promise<boolean>;

export type AdminLoginAttemptLimiter = Readonly<{
  validate: (
    email: string,
    forwardedFor: string | null,
    validateCredentials: CredentialValidator,
    now?: number,
  ) => Promise<boolean>;
}>;

export function createAdminLoginAttemptLimiter(): AdminLoginAttemptLimiter {
  const attempts = new Map<string, AttemptWindow>();
  const pendingAttempts = new Map<string, Promise<void>>();

  return {
    async validate(email, forwardedFor, validateCredentials, now = Date.now()) {
      const key = createAttemptKey(email, forwardedFor);
      const previousAttempt = pendingAttempts.get(key) ?? Promise.resolve();
      let releaseAttempt = () => {};
      const currentAttempt = new Promise<void>((resolve) => {
        releaseAttempt = resolve;
      });
      const pendingTail = previousAttempt.then(() => currentAttempt);
      pendingAttempts.set(key, pendingTail);

      await previousAttempt;

      try {
        const existingWindow = attempts.get(key);
        const activeWindow =
          existingWindow && now - existingWindow.startedAt < ATTEMPT_WINDOW_MS
            ? existingWindow
            : null;

        if (activeWindow?.failedAttempts === MAX_FAILED_ATTEMPTS) return false;

        const credentialsAreValid = await validateCredentials();
        if (credentialsAreValid) {
          attempts.delete(key);
          return true;
        }

        if (activeWindow) {
          activeWindow.failedAttempts += 1;
        } else {
          attempts.set(key, { failedAttempts: 1, startedAt: now });
        }
        return false;
      } finally {
        releaseAttempt();
        if (pendingAttempts.get(key) === pendingTail) pendingAttempts.delete(key);
      }
    },
  };
}

function createAttemptKey(email: string, forwardedFor: string | null): string {
  const normalizedEmail = email.trim().toLowerCase();
  const clientIp = forwardedFor?.split(",", 1)[0]?.trim() || "unknown";
  return `${normalizedEmail}\0${clientIp}`;
}
