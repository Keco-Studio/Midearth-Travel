const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_TRACKED_KEYS = 10_000;

type AttemptWindow = {
  failedAttempts: number;
  startedAt: number;
};

type CredentialValidator = () => Promise<boolean>;

type AdminLoginAttemptLimiterOptions = Readonly<{
  maxTrackedKeys?: number;
}>;

export type AdminLoginAttemptLimiter = Readonly<{
  validate: (
    email: string,
    source: string,
    validateCredentials: CredentialValidator,
    now?: number,
  ) => Promise<boolean>;
}>;

/** Creates an in-memory limiter; capacity and attempt windows are per process instance. */
export function createAdminLoginAttemptLimiter(
  options: AdminLoginAttemptLimiterOptions = {},
): AdminLoginAttemptLimiter {
  const maxTrackedKeys = options.maxTrackedKeys ?? DEFAULT_MAX_TRACKED_KEYS;
  if (!Number.isSafeInteger(maxTrackedKeys) || maxTrackedKeys < 1) {
    throw new RangeError("maxTrackedKeys must be a positive safe integer");
  }

  const attempts = new Map<string, AttemptWindow>();
  const pendingAttempts = new Map<string, Promise<void>>();

  return {
    async validate(email, source, validateCredentials, now = Date.now()) {
      const key = createAttemptKey(email, source);
      if (!pendingAttempts.has(key) && pendingAttempts.size >= maxTrackedKeys) {
        return false;
      }

      const previousAttempt = pendingAttempts.get(key) ?? Promise.resolve();
      let releaseAttempt = () => {};
      const currentAttempt = new Promise<void>((resolve) => {
        releaseAttempt = resolve;
      });
      const pendingTail = previousAttempt.then(() => currentAttempt);
      pendingAttempts.set(key, pendingTail);

      await previousAttempt;

      try {
        pruneExpiredAttempts(attempts, now);
        const existingWindow = attempts.get(key);
        const activeWindow =
          existingWindow && now - existingWindow.startedAt < ATTEMPT_WINDOW_MS
            ? existingWindow
            : null;

        if (activeWindow && activeWindow.failedAttempts >= MAX_FAILED_ATTEMPTS) return false;
        if (!activeWindow && !canTrackNewAttempt(attempts, maxTrackedKeys)) {
          return false;
        }

        const credentialsAreValid = await validateCredentials();
        if (credentialsAreValid) {
          attempts.delete(key);
          return true;
        }

        if (activeWindow) {
          activeWindow.failedAttempts += 1;
        } else {
          if (!evictOldestUnblockedAttemptIfFull(attempts, maxTrackedKeys)) {
            return false;
          }
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

function pruneExpiredAttempts(attempts: Map<string, AttemptWindow>, now: number): void {
  for (const [key, attempt] of attempts) {
    if (now - attempt.startedAt >= ATTEMPT_WINDOW_MS) {
      attempts.delete(key);
    }
  }
}

function canTrackNewAttempt(
  attempts: Map<string, AttemptWindow>,
  maxTrackedKeys: number,
): boolean {
  return (
    attempts.size < maxTrackedKeys ||
    [...attempts.values()].some(
      (attempt) => attempt.failedAttempts < MAX_FAILED_ATTEMPTS,
    )
  );
}

function evictOldestUnblockedAttemptIfFull(
  attempts: Map<string, AttemptWindow>,
  maxTrackedKeys: number,
): boolean {
  if (attempts.size < maxTrackedKeys) return true;

  for (const [key, attempt] of attempts) {
    if (attempt.failedAttempts < MAX_FAILED_ATTEMPTS) {
      attempts.delete(key);
      return true;
    }
  }

  return false;
}

function createAttemptKey(email: string, source: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  return `${normalizedEmail}\0${source}`;
}
