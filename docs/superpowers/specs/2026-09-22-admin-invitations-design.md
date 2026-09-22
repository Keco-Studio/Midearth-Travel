# Admin Avatar and Invitation Design

## Purpose

Replace the always-visible logout control in the CMS header with an account
avatar menu, and add invite-only administrator registration. The public site
continues to expose neither the CMS route nor a registration route.

## Scope

This work changes only CMS authentication and the authenticated CMS header.
It preserves the initial deployment-configured administrator and existing
signed session cookie format. It does not add email delivery, password reset,
role tiers, or public self-registration.

## User Experience

The right side of the CMS header shows a compact circular avatar containing
the current administrator email's first letter. Clicking it opens a menu with:

1. the signed-in email address;
2. `Invite administrator`, opening an authenticated invite form;
3. `Log out`, clearing the existing session cookie.

The invitation form accepts an email address and, after a successful request,
shows a one-time registration URL with a copy action. The CMS does not attempt
to send the link itself. This keeps the workflow usable without introducing an
email provider or an unverified sender identity.

The registration screen is accessible only through `/admin/register?token=…`.
It asks for the invited email address and a password. It never renders a link
to itself from the public site or normal login page. Successful registration
creates an administrator account, starts a session, and opens `/admin`.

## Data Model

Two Supabase tables are added.

`admin_users` stores administrators created through invitations:

| Column | Purpose |
| --- | --- |
| `email` | normalized lowercase primary key |
| `password_salt` | random per-user salt, Base64URL encoded |
| `password_hash` | PBKDF2-SHA-256 result, Base64URL encoded |
| `created_at` | creation timestamp |
| `invited_by` | normalized email of the inviter |

`admin_invitations` stores only a hash of an invitation token:

| Column | Purpose |
| --- | --- |
| `id` | server-generated identifier |
| `email` | normalized invited email |
| `token_hash` | SHA-256 hash of the raw token, never the raw token |
| `invited_by` | normalized email of the inviter |
| `created_at` | creation timestamp |
| `expires_at` | seven-day expiry timestamp |
| `accepted_at` | set once registration succeeds |

Both tables use row-level security with no browser write access. CMS route
handlers use the server-only Supabase credentials already used by this project.

## Authentication and Registration

`ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` remain the permanent
bootstrap owner account. Login first performs the existing constant-time
comparison against those credentials. If it does not match, it checks a
registered administrator record and verifies its PBKDF2 hash in constant
time. Both successful paths issue the existing signed, HttpOnly, bounded
session cookie containing the normalized email.

Invitation tokens contain 32 random bytes and are delivered only in the
registration URL returned to the already authenticated inviter. The database
stores a SHA-256 token hash. Registration validates all of the following in a
single server-side flow:

1. a well-formed, bounded token and email;
2. the token hash exists;
3. the invitation is unexpired and has not been accepted;
4. the registration email equals the invited email after normalization;
5. no administrator already exists with that email;
6. the password meets the existing minimum length and bounded input limit.

Only after those checks does the server create the user, mark the invitation
accepted, and issue a session. The registration handler is also protected by
the same source/email login rate limiter. Invitations are one-time, and a new
invite replaces any active invite for the same email.

Every authenticated administrator, including the configured initial owner,
may create invitations. There is no admin deletion or role management in this
increment; extending `admin_users` later with role and disabled columns does
not change the session contract.

## Routes and Components

New protected APIs:

| Route | Operation | Behavior |
| --- | --- | --- |
| `/api/admin/auth/invitations` | `POST` | requires an admin session, creates/replaces an invitation, returns the registration URL |
| `/api/admin/auth/register` | `POST` | validates a one-time invitation, creates a user, and sets the session cookie |

New pages/components:

- `/admin/invite`: authenticated invite form and copyable result link;
- `/admin/register`: token-based registration form;
- `AdminAccountMenu`: avatar/dropdown in `AdminShell`, replacing the text
  logout button.

The registration page does not load CMS data. An absent, invalid, expired, or
used token returns a generic unavailable-invitation state; it does not expose
which validation condition failed.

## Error Handling and Security

- Existing anonymous `/admin` redirects and `/api/admin/**` 401 behavior stay
  in force; the new invite API is included in that protection.
- Invitation requests reject malformed emails, existing registered emails, and
  unsafe oversized input without issuing a token.
- Login and registration errors are generic, preventing email and invitation
  enumeration.
- Raw passwords, raw invitation tokens, password hashes, and session tokens
  are never returned by APIs or logged.
- Password derivation uses PBKDF2-SHA-256 with a random per-user salt and a
  fixed high iteration count, verified with constant-time byte comparison.
- The existing session expiry, secure cookie attributes, and logout endpoint
  are unchanged.

## Verification

Tests are written first for:

1. secure password hash creation and verification;
2. invitation token generation, hashing, expiry, one-time consumption, and
   exact-email matching;
3. registered-user credentials alongside the initial configured owner;
4. handler authorization before request parsing or data access;
5. the absence of public registration navigation and the presence of an
   account avatar menu with logout and invite actions;
6. registration failure behavior for used, expired, unknown, and malformed
   invitations.

Focused tests, the full Node test suite, TypeScript checking, ESLint, and a
Next.js production build are run after implementation. Browser verification
checks avatar menu operation, invitation-link copying, invite-only
registration, login, and logout.
