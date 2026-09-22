# Admin Invitations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CMS logout button with an account avatar menu and enable invite-only administrator registration without changing public access.

**Architecture:** Keep the signed session cookie and deployment-configured owner account. Add server-only Supabase persistence for invited users and one-time invitations; login accepts the owner or an invited user. An authenticated administrator creates a seven-day registration URL and registration consumes it before starting the existing session.

**Tech Stack:** Next.js 16 App Router, TypeScript, Web Crypto API, Supabase REST API, Ant Design, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-22-admin-invitations-design.md`

## Global Constraints

- Keep `/admin` unlisted and do not add public self-registration.
- Preserve `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `ADMIN_SESSION_SECRET`, and signed HttpOnly `SameSite=Lax` sessions with their existing expiry.
- Persist only PBKDF2-SHA-256 password hashes/salts and SHA-256 invitation-token hashes. Never log or return raw passwords, raw stored tokens, hashes, or cookies.
- Tokens bind to normalized email, expire after seven days, and are accepted once.
- Do not add email delivery. Return a copyable registration URL to the authenticated inviter.
- Authorize handlers before request parsing or data access.
- Write and run each test red before production code, then green.

---

### Task 1: Credential and Invitation Domain

**Files:**
- Create: `src/lib/admin-users.ts`
- Create: `src/lib/admin-invitations.ts`
- Modify: `src/lib/admin-session.ts`
- Modify: `src/lib/admin-auth.ts`
- Test: `test/admin-users.test.ts`
- Test: `test/admin-invitations.test.ts`

**Interfaces:**
- Produce `normalizeAdminEmail`, `hashAdminPassword`, `verifyAdminPassword`, `createInvitationToken`, `hashInvitationToken`, `isUsableInvitation`, `findAdminUser`, `replaceAdminInvitation`, and `acceptInvitationAndCreateAdmin`.
- Extend `validateAdminCredentials(email, password)` to check the configured account first, then an invited user.

- [ ] Write a failing password test proving that the same password verifies with the returned salt/hash and a different password fails.
- [ ] Run `npx tsx --test test/admin-users.test.ts`; expect failure because the domain functions do not exist.
- [ ] Implement a normalized email helper and Web Crypto PBKDF2-SHA-256 password derivation with a random 16-byte salt, fixed high iteration count, Base64URL encoding, malformed-input rejection, and constant-time verification.
- [ ] Run `npx tsx --test test/admin-users.test.ts`; expect pass.
- [ ] Write a failing invitation test for a matching unexpired token, a mismatched email, an expired record, and an accepted record.
- [ ] Run `npx tsx --test test/admin-invitations.test.ts`; expect failure because invitation functions do not exist.
- [ ] Implement 32 random-byte Base64URL tokens and SHA-256 token hashing. Define `AdminInvitation` with normalized email, token hash, created/expiry timestamps, inviter email, and nullable accepted timestamp.
- [ ] Implement server-only Supabase REST boundaries for user lookup, invitation replace-by-email, token-hash lookup, and compare-and-set invitation acceptance. Initial credentials remain a private, constant-time path in `admin-session.ts`; persisted-user credential verification runs only after it fails.
- [ ] Run `npx tsx --test test/admin-users.test.ts test/admin-invitations.test.ts test/admin-auth.test.ts`; expect pass.
- [ ] Commit `src/lib/admin-users.ts`, `src/lib/admin-invitations.ts`, auth changes, and tests with message `feat: add invited administrator credentials`.

### Task 2: Tables and Route Handlers

**Files:**
- Create: `supabase/migrations/202609220003_admin_invitations.sql`
- Create: `src/app/api/admin/auth/invitations/route.ts`
- Create: `src/app/api/admin/auth/register/route.ts`
- Modify: `src/app/api/admin/auth/login/route.ts`
- Modify: `src/app/api/admin/auth/logout/route.ts`
- Test: `test/admin-invitation-routes.test.ts`
- Modify: `test/admin-auth.test.ts`

**Interfaces:**
- `POST /api/admin/auth/invitations` accepts only an invited email and returns `{ registrationUrl: string }`.
- `POST /api/admin/auth/register` accepts `email`, `password`, and `token`; it returns `{ ok: true }` only after user creation and session issuance.

- [ ] Write failing tests asserting invitation creation calls `assertAdminRequest()` before `request.json()`, and registration references `hashInvitationToken` instead of storing the raw token.
- [ ] Run `npx tsx --test test/admin-invitation-routes.test.ts`; expect failure because routes do not exist.
- [ ] Add `admin_users` with normalized email primary key, salt/hash, inviter, and timestamp. Add `admin_invitations` with UUID key, unique email, unique token hash, inviter, timestamps, and nullable `accepted_at`. Enable RLS on both without browser policies.
- [ ] Implement a shared session-cookie setter used by login and registration. Retain `httpOnly`, `sameSite: "lax"`, root path, production `secure`, and `ADMIN_SESSION_MAX_AGE_SECONDS`.
- [ ] Implement invitation POST: authorize, parse bounded email, reject an existing user, generate/token-hash/store a seven-day invitation replacing the same email's unused invitation, then return an absolute `/admin/register?token=...` URL. The raw token exists only in memory and response.
- [ ] Implement registration POST: parse bounded values, rate-limit by requested email/source, look up hashed token, enforce token state and exact normalized email, create PBKDF2 credentials, atomically mark invitation accepted, create user, and set the session. All failures return one generic unavailable-invitation response.
- [ ] Make normal login accept either initial or persisted credentials while retaining generic invalid-credential and rate-limit behavior.
- [ ] Run `npx tsx --test test/admin-invitation-routes.test.ts test/admin-auth.test.ts test/admin-login-security.test.ts`; expect pass.
- [ ] Commit migration, route handlers, and tests with message `feat: add invite-only administrator registration`.

### Task 3: Invitation and Registration Screens

**Files:**
- Create: `src/app/admin/invite/page.tsx`
- Create: `src/app/admin/register/page.tsx`
- Create: `src/components/admin-invite-form.tsx`
- Create: `src/components/admin-registration-form.tsx`
- Modify: `src/app/admin/admin.css`
- Test: `test/admin-invitation-pages.test.ts`

**Interfaces:**
- The invite form consumes `{ registrationUrl }` and exposes a copy action.
- The registration form posts to the registration endpoint and redirects to `/admin` after success.

- [ ] Write failing tests that `/admin/invite` invokes `requireAdminSession()` and ordinary login has no `/admin/register` link.
- [ ] Run `npx tsx --test test/admin-invitation-pages.test.ts`; expect failure because new page files do not exist.
- [ ] Implement a protected invite page and a compact one-email form. On success, show the read-only URL and use `navigator.clipboard.writeText` from a copy button. Do not log token values.
- [ ] Implement a registration page that reads `token` from `useSearchParams`, never displays it, asks for email/password/password confirmation, and gives every rejected token a generic unavailable-invitation message. On success use `router.replace("/admin")` and `router.refresh()`.
- [ ] Use the existing CMS login visual language: restrained card, fixed 8px corners, no decorative gradients, and error alerts.
- [ ] Run `npx tsx --test test/admin-invitation-pages.test.ts`; expect pass.
- [ ] Commit screens and styles with message `feat: add administrator invitation screens`.

### Task 4: Account Menu and CMS Session Identity

**Files:**
- Create: `src/components/admin-account-menu.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/components/admin-shell.tsx`
- Test: `test/admin-account-menu.test.ts`

**Interfaces:**
- `requireAdminSession()` returns `AdminSession` instead of `void`.
- `AdminPage` passes the session email into `AdminShell`.
- `AdminAccountMenu` accepts `email: string`, opens `/admin/invite`, and invokes the existing logout endpoint.

- [ ] Write failing tests that `AdminShell` renders `AdminAccountMenu` and does not include the standalone `Log out` button; verify menu source includes `/admin/invite` and `/api/admin/auth/logout`.
- [ ] Run `npx tsx --test test/admin-account-menu.test.ts`; expect failure because no account menu exists.
- [ ] Return the verified session from `requireAdminSession`, without changing redirects/401 responses. Pass `session.email` through `AdminPage` to the shell.
- [ ] Implement `AdminAccountMenu` with an Ant Design Avatar inside a Dropdown. The avatar displays the uppercased first email character. Menu rows show email, `Invite administrator`, and `Log out`. Preserve logout loading/error behavior, accessible labels, redirect, and refresh.
- [ ] Replace the existing PageContainer logout button with the account menu.
- [ ] Run `npx tsx --test test/admin-account-menu.test.ts test/admin-auth.test.ts`; expect pass.
- [ ] Commit account-menu changes with message `feat: add admin account menu`.

### Task 5: Documentation and Verification

**Files:**
- Modify: `README.md`
- Modify: only files that fail feature tests and are proven defective.

- [ ] Update README to describe migration `202609220003_admin_invitations.sql`, invitation-only registration, link-copy/send responsibility, seven-day expiry, and the continuing bootstrap owner account. Remove the statement that invitations are unavailable.
- [ ] Run focused validation: `npx tsx --test test/admin-auth.test.ts test/admin-login-security.test.ts test/admin-users.test.ts test/admin-invitations.test.ts test/admin-invitation-routes.test.ts test/admin-invitation-pages.test.ts test/admin-account-menu.test.ts`.
- [ ] Run full validation: `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Report any pre-existing unrelated failure by file without altering it.
- [ ] Start `npm run dev` and verify anonymous redirect, bootstrap login, avatar menu, invite link copying, successful one-time registration, failed repeat registration, invited-user login, and logout.
- [ ] Commit README plus any required verification repair with message `docs: document administrator invitations` or `fix: verify admin invitation flow`.
