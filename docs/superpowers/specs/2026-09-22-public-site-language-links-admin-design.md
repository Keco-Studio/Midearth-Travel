# Public Site Language, Links, and Admin Access Design

## Purpose

Restore working English/Chinese switching, make every public navigation target
resolvable, prevent incomplete tour records from degrading into a 404, and
restrict the CMS to an unlisted route protected by an initial administrator
account.

## Scope

This work changes public presentation and administrative access. It does not
translate client-owned content, create invitations, or change tour inventory.
Where Chinese content has not yet been supplied, the English content remains a
deliberate fallback instead of fabricated translation.

## Bilingual Content

The existing `LangProvider` remains the single client-side language selection.
It persists the selection in browser storage and updates the document language.
The provider will also complete initialization before exposing the saved choice,
so a route transition cannot render an older language selection.

Tour records already store paired English/Chinese fields. The public listing
and detail surfaces will consistently choose the Chinese field when selected
and populated, otherwise the English field.

Homepage CMS modules will use paired `...En` / `...Zh` string fields for
visitor-visible copy. This includes navigation labels, hero copy and cards,
featured-tour heading, Where to Go headings, services headings, testimonials,
the final contact CTA, quote request content, and footer copy. Existing stored
records retain their current fields; a normalization layer adds the new fields
with the current English value as the English fallback and an empty Chinese
value. The admin editor shows both values. Fields unrelated to visitor copy,
such as URLs, image paths, and phone destinations, remain shared.

Static UI labels that are not CMS content use an internal bilingual dictionary.
This covers actions, filter labels, empty states, tour detail headings, and
booking labels. The CMS interface itself remains English.

## Footer and Routes

The footer will receive the same live `DestinationCategory[]` instance as the
Where to Go grid. Its Tours column is generated from those six categories, in
their configured order, and uses `getCategoryHref(category)`. This establishes
one source for labels, Chinese labels, ordering, and destinations:

| Category | Route |
| --- | --- |
| North America | `/routes/north-america` |
| Asia | `/routes/asia` |
| Europe | `/routes/europe` |
| Sun Destinations | `/routes/sun-destinations` |
| Bus Tours | `/tours/category/bus-tours` |
| Vacation Packages | `/tours/category/vacation-packages` |

The service links continue to use their published CMS configuration. A route
integrity helper validates internal destinations against supported public route
patterns before rendering. Invalid or empty links are omitted and reported,
rather than producing an avoidable 404.

## Booking and Missing Information

`Book this tour` must always be actionable. For payable tours it continues to
offer Stripe Checkout. The enquiry action is a fully encoded email containing
the selected tour title, code, and page URL; telephone remains the secondary
fallback. Both use the configured contact destination.

Incomplete records are not silently sent to a nonexistent detail route. A
tour-content audit identifies published records that have an image but lack
the minimum customer detail needed for a useful page: a title, duration,
description or itinerary, and a contact path. The audit returns a structured
list with slug, title, image, and missing fields. The public card directs those
records to a contact enquiry with the tour context instead of a 404. An
administrative report/download exposes the list for Panda to forward to the
client; it does not invent any missing itinerary or marketing copy.

## Admin Portal Access

The public Navbar and mobile drawer will no longer render an Admin Portal link.
The portal remains accessible only at `/admin`.

The first release uses one deployment-configured account:

- `ADMIN_INITIAL_EMAIL`
- `ADMIN_INITIAL_PASSWORD`
- `ADMIN_SESSION_SECRET`

An `/admin/login` form posts credentials to a Route Handler. Successful login
sets an HttpOnly, `Secure` in production, `SameSite=Lax` signed session cookie
with a bounded expiry. Signature verification and expiration checks are kept
in a server-only auth module using the Web Crypto API. No password, secret, or
session token is shipped to the client. Logout clears the cookie.

The `/admin` page redirects unauthenticated visitors to `/admin/login`, and
every `/api/admin/**` handler rejects unauthenticated requests with HTTP 401.
This is necessary because hiding the link alone is not access control. The
existing Supabase service role key remains server-only. Initial credentials are
documented in `.env.example`, but no real credentials are committed.

Invitation registration is intentionally not implemented in this release. The
authentication interface separates credential validation from session issuance,
so an invite-backed user lookup can later replace the fixed-account validator
without changing public routes or CMS clients.

## Error Handling

- Missing Chinese copy falls back to English.
- An unavailable contact email falls back to the configured phone destination.
- Invalid footer links do not render; the audit names them for correction.
- Missing initial-admin environment variables fail closed, with a server-side
  configuration error rather than granting access.
- Failed login uses a generic credential error and does not disclose whether
  the email or password was wrong.

## Verification

Tests will be written first for:

1. language field selection and English fallback;
2. category-derived Footer mappings for all six categories;
3. supported versus invalid internal links;
4. complete/incomplete tour-content audit results and contact fallback;
5. signed admin session validation, expiry, and missing-config failure;
6. login/API/page access behavior and the absence of public Admin links.

After focused tests pass, run the full Node test suite, ESLint, and the Next.js
production build. Browser checks will confirm language switching, all six
Footer routes, valid booking action, incomplete-tour fallback, login redirect,
and authenticated admin access.
