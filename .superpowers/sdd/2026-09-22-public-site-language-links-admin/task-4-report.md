# Task 4 Report: Route-only Admin Login and API Authorization

## Delivered

- Removed the desktop and drawer Admin Portal links from the public Navbar. `/admin` remains the unlisted portal route.
- Added deployment-configured initial admin credentials with explicit fail-closed validation for `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD`, and `ADMIN_SESSION_SECRET`. `.env.example` contains placeholders only.
- Added an eight-hour signed session using Web Crypto HMAC SHA-256, issue and expiry timestamps, base64url encoding, and constant-time byte comparison. Credential comparisons use fixed-length Web Crypto digests and evaluate both email and password.
- Added a server-only Next adapter using awaited Next 16 `cookies()`, an HttpOnly `SameSite=Lax` cookie that is secure in production, typed route authorization errors, page redirects, and JSON 401 responses.
- Added `/admin/login`, `POST /api/admin/auth/login`, `POST /api/admin/auth/logout`, a generic invalid-credential response, and a CMS logout action.
- Protected every exported method in all 12 pre-existing `src/app/api/admin/**/route.ts` files before request parsing, parameter use, or Supabase-backed calls. The two auth endpoints are intentionally exempt.
- Protected `/admin` before its preload calls, so anonymous requests redirect to `/admin/login` without touching private data sources.

## TDD Evidence

1. RED: `npm test -- test/admin-auth.test.ts` failed with `ERR_MODULE_NOT_FOUND` for the not-yet-created session module.
2. GREEN: the same command passed all 10 auth and source-guard tests after implementation.

The tests cover valid verification, token tampering, exact expiry, future issue time, missing configuration, both credential fields, public-link removal, page guard ordering, all 12 API route files, and secure cookie/source requirements.

## Verification

- `npm test -- test/admin-auth.test.ts`: passed, 10 tests.
- `npx tsx --test test/admin-auth.test.ts test/admin-state.test.ts test/home-module-global-actions.test.ts`: passed, 24 tests. `tsx` is required because the existing admin-state dependency graph uses the `@/` alias that the package's plain Node command does not resolve.
- `npx tsc --noEmit`: passed.
- Changed-file ESLint: passed.
- Production build with build-only placeholder admin values: passed and emitted `/admin`, `/admin/login`, both auth endpoints, and all admin APIs. Existing Next configuration/worktree-root warnings and unavailable local Supabase fallback logs were emitted.
- `git diff --check`: passed.

## Existing Repository Failures

- Full `npm run lint` still fails on two files outside Task 4: `src/components/tours-workspace.tsx` (`react-hooks/set-state-in-effect`) and `src/lib/office-address-sync.ts` (`@next/next/no-assign-module-variable`).
- `npx tsx --test test/*.test.ts` runs 146 tests: 144 pass and two unrelated pre-existing tour-editor assertions fail. One expects `onFinish={onUpdate}` in `tour-editor.tsx`; the other expects `region` to remain a required editor field.
