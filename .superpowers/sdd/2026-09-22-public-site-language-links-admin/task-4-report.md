# Task 4 Report: Route-only Admin Login and API Authorization

## Delivered

- Removed the desktop and drawer Admin Portal links from the public Navbar. `/admin` remains the unlisted portal route.
- Added deployment-configured initial admin credentials with explicit fail-closed validation for `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD`, and `ADMIN_SESSION_SECRET`. `.env.example` contains placeholders only.
- Added an eight-hour signed session using Web Crypto HMAC SHA-256, issue and expiry timestamps, base64url encoding, and constant-time byte comparison. Credential comparisons use fixed-length Web Crypto digests and evaluate both email and password.
- Added a server-only Next adapter using awaited Next 16 `cookies()`, an HttpOnly `SameSite=Lax` cookie that is secure in production, typed route authorization errors, page redirects, and JSON 401 responses.
- Added `/admin/login`, `POST /api/admin/auth/login`, `POST /api/admin/auth/logout`, a generic invalid-credential response, and a CMS logout action.
- Protected every exported method in all 12 pre-existing `src/app/api/admin/**/route.ts` files before request parsing, parameter use, or Supabase-backed calls. The two auth endpoints are intentionally exempt.
- Protected `/admin` before its preload calls, so anonymous requests redirect to `/admin/login` without touching private data sources.
- Hardened configuration validation to reject blank or invalid email addresses, reserved example addresses, checked-in placeholder values, passwords with fewer than 12 non-padding characters, and session secrets with fewer than 32 non-padding characters.
- Bounded login email and password fields in both the client form and server payload parser.
- Added a five-failure, 15-minute fixed-window login limiter keyed by normalized email plus a server-selected source. It uses the stable `direct` source by default and only selects the first `x-forwarded-for` address when the server-only `ADMIN_TRUST_PROXY_HEADERS` value is exactly `true`. Expired windows are pruned, active and pending unique keys are each capped at 10,000, and overflow evicts the oldest inserted active window deterministically or fails closed while pending work is full. Blocked attempts do not run credential verification, and successful authentication resets the key. The in-memory state is intentionally per server instance because no shared limiter is available; production hosting should also enforce an infrastructure-level limit when multiple instances are used.

## TDD Evidence

1. RED: `npm test -- test/admin-auth.test.ts` failed with `ERR_MODULE_NOT_FOUND` for the not-yet-created session module.
2. GREEN: the same command passed all 10 auth and source-guard tests after implementation.
3. Security follow-up RED: `npx tsx --test test/admin-auth.test.ts` failed because weak and placeholder configuration was accepted; the new login security suite failed with `ERR_MODULE_NOT_FOUND` before its bounded-input and limiter modules existed.
4. Security follow-up GREEN: `npx tsx --test test/admin-auth.test.ts test/admin-login-security.test.ts` passed all 17 tests after the hardening implementation.
5. Security review round 2 RED: the auth suite reported `Missing expected exception` for padded/whitespace-only password and secret values; the login security suite first failed with `ERR_MODULE_NOT_FOUND` for the not-yet-created source policy, then showed the oldest active limiter window was not evicted (`0 !== 1`), stale records displaced an active window (`1 !== 0`), and an excess concurrent unique key reached credential validation (`1 !== 0`).
6. Security review round 2 GREEN: `npx tsx --test test/admin-auth.test.ts test/admin-login-security.test.ts` passed all 21 tests after trimmed-length validation, trusted-proxy source selection, stale-window pruning, deterministic bounded eviction, and pending-key admission control were implemented.

The tests cover valid verification, token tampering, exact expiry, future issue time, missing and insecure configuration, both credential fields, bounded login input, attempt-window keying and expiry, blocked-verifier behavior, success reset, public-link removal, page guard ordering, all 12 API route files, and secure cookie/source requirements.

## Verification

- `npm test -- test/admin-auth.test.ts`: passed, 10 tests.
- `npx tsx --test test/admin-auth.test.ts test/admin-state.test.ts test/home-module-global-actions.test.ts`: passed, 24 tests. `tsx` is required because the existing admin-state dependency graph uses the `@/` alias that the package's plain Node command does not resolve.
- `npx tsc --noEmit`: passed.
- Changed-file ESLint: passed.
- Production build with build-only placeholder admin values: passed and emitted `/admin`, `/admin/login`, both auth endpoints, and all admin APIs. Existing Next configuration/worktree-root warnings and unavailable local Supabase fallback logs were emitted.
- `git diff --check`: passed.

### Security Follow-up Verification

- `npx tsx --test test/admin-auth.test.ts test/admin-login-security.test.ts`: passed, 17 tests.
- `npx tsc --noEmit`: passed.
- Changed-file ESLint: passed.
- `git diff --check`: passed.

### Security Review Round 2 Verification

- `npx tsx --test test/admin-auth.test.ts test/admin-login-security.test.ts`: passed, 21 tests.
- `npx tsc --noEmit`: passed.
- Changed-file ESLint: passed.
- `npx tsx --test test/*.test.ts`: ran 157 tests; 155 passed and the same two unrelated tour-editor assertions failed.
- `git diff --check`: passed.

## Existing Repository Failures

- Full `npm run lint` still fails on two files outside Task 4: `src/components/tours-workspace.tsx` (`react-hooks/set-state-in-effect`) and `src/lib/office-address-sync.ts` (`@next/next/no-assign-module-variable`).
- `npx tsx --test test/*.test.ts` runs 157 tests: 155 pass and two unrelated pre-existing tour-editor assertions fail. One expects `onFinish={onUpdate}` in `tour-editor.tsx`; the other expects `region` to remain a required editor field.
