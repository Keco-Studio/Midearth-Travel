# Public Site Language, Links, and Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide reliable bilingual public content, category-derived Footer routes, actionable booking and missing-content reporting, and a route-only authenticated Admin Portal.

**Architecture:** Keep language choice in `LangProvider`; resolve all English/Chinese content through small pure helpers so client components can rerender without server navigation. Derive Footer tours from the existing `DestinationCategory` model. Keep content auditing and admin authentication in server-safe libraries, with an HMAC-signed HttpOnly session cookie protecting both `/admin` and `/api/admin/**`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Node test runner, Web Crypto API, Supabase REST clients, Ant Design.

**Spec:** `docs/superpowers/specs/2026-09-22-public-site-language-links-admin-design.md`

## Global Constraints

- Use the asynchronous `cookies()` API required by Next.js 16.
- Do not add a client-visible credential, session secret, or external authentication dependency.
- Do not invent Chinese translations for customer-owned tourism content; use English fallback when Chinese is blank.
- The six Where to Go categories are the only Footer tour links and retain their configured order.
- Existing CMS rows must remain readable without database migrations.
- Create every behavior test before its production implementation and observe it fail.

---

### Task 1: Bilingual CMS Content Resolution

**Files:**
- Create: `src/lib/localized-content.ts`
- Create: `test/localized-content.test.ts`
- Modify: `src/context/lang-context.tsx`
- Modify: `src/data/cms-seed.ts`
- Modify: `src/lib/home-content.ts`
- Modify: `src/components/navbar.tsx`
- Modify: `src/components/hero.tsx`
- Modify: `src/components/category-grid.tsx`
- Modify: `src/components/tours-section.tsx`
- Modify: `src/components/about-section.tsx`
- Modify: `src/components/testimonials-section.tsx`
- Modify: `src/components/final-cta.tsx`
- Modify: `src/components/newsletter.tsx`
- Modify: `src/components/footer.tsx`
- Modify: `src/components/listing/tour-listing.tsx`
- Modify: `src/components/tour/tour-detail.tsx`

**Interfaces:**
- Produces `getLocalizedContent(data, key, lang, fallback): string`, which reads `${key}Zh` for `zh`, `${key}En` for `en`, and then follows the specified fallback order.
- Produces `getLocalizedStaticText(lang, key): string` for fixed UI labels.
- Produces `getLocalizedTourValue(lang, localized, fallback): string` and list equivalent shared by cards and detail pages.
- Consumes existing `ContentData`, `Lang`, `Tour`, and `TourRecord` types without changing their persisted shape.

- [ ] **Step 1: Write failing localization tests**

```ts
test("uses the selected Chinese CMS value and falls back to English", () => {
  assert.equal(
    getLocalizedContent({ titleEn: "Where to Go", titleZh: "目的地" }, "title", "zh", "Fallback"),
    "目的地",
  );
  assert.equal(
    getLocalizedContent({ titleEn: "Where to Go", titleZh: "" }, "title", "zh", "Fallback"),
    "Where to Go",
  );
});
```

Add assertions that a legacy CMS record containing only `title` normalizes to `titleEn: title` and remains publishable.

- [ ] **Step 2: Run the localization tests to verify they fail**

Run: `npm test -- test/localized-content.test.ts`

Expected: FAIL because `src/lib/localized-content.ts` does not exist.

- [ ] **Step 3: Implement localization and legacy normalization**

Create the pure helper module. Extend each visible CMS string field in `homeModuleSeeds` to `keyEn` and `keyZh`, preserve media/URL/shared contact fields, and migrate legacy data during `mergeHomeModuleRows` / `canonicalizeHomeModule` before validation. Update public components to request localized values using `useLang()`. Keep `LangProvider` hydration-safe by starting in English and synchronizing stored language inside `useEffect` before rendering language-dependent UI.

- [ ] **Step 4: Run focused content tests**

Run: `npm test -- test/localized-content.test.ts test/home-content.test.ts test/tour-content.test.ts`

Expected: PASS with the legacy normalization and Chinese fallback assertions green.

- [ ] **Step 5: Commit the localized-content task**

```bash
git add src/lib/localized-content.ts src/context/lang-context.tsx src/data/cms-seed.ts src/lib/home-content.ts src/components test/localized-content.test.ts test/home-content.test.ts
git commit -m "feat: localize public CMS content"
```

### Task 2: Derive Footer Tours from Where to Go Categories

**Files:**
- Modify: `src/lib/footer-links.ts`
- Modify: `src/components/footer.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/tours/page.tsx`
- Modify: `src/app/tours/category/[slug]/page.tsx`
- Modify: `src/app/routes/[slug]/page.tsx`
- Modify: `test/footer-links.test.ts`
- Create: `test/public-route-integrity.test.ts`

**Interfaces:**
- Produces `getCategoryFooterLinks(categories, lang): FooterLink[]` using `getCategoryHref` and each category's localized title.
- Produces `isSupportedPublicHref(href): boolean` for only `/`, `/#...`, `/tours`, `/tours/category/<slug>`, `/tours/<slug>`, `/routes/<slug>`, `/services/<slug>`, `mailto:`, `tel:`, and `https:` destinations.
- `Footer` consumes `categories?: DestinationCategory[]` and no longer reads editable tour links.

- [ ] **Step 1: Write failing link-mapping tests**

```ts
test("derives all six Footer tour links from Where to Go categories", () => {
  assert.deepEqual(
    getCategoryFooterLinks(destinationCategorySeeds, "en").map(({ label, href }) => ({ label, href })),
    [
      { label: "North America", href: "/routes/north-america" },
      { label: "Asia", href: "/routes/asia" },
      { label: "Europe", href: "/routes/europe" },
      { label: "Sun Destinations", href: "/routes/sun-destinations" },
      { label: "Bus Tours", href: "/tours/category/bus-tours" },
      { label: "Vacation Packages", href: "/tours/category/vacation-packages" },
    ],
  );
});
```

Add supported/unsupported href table tests, including a rejected `/tours/custom` link.

- [ ] **Step 2: Run link-mapping tests to verify they fail**

Run: `npm test -- test/footer-links.test.ts test/public-route-integrity.test.ts`

Expected: FAIL because category-derived link and route-integrity helpers do not exist.

- [ ] **Step 3: Implement category Footer and route validation**

Replace seeded tour links with a category mapper, retaining service link parsing only after `isSupportedPublicHref` filtering. Pass live `categories` from every server page that renders `Footer`, including the homepage, listings, details, service pages, and payment pages as needed. Update Footer heading/labels through Task 1 localization helpers.

- [ ] **Step 4: Run focused route tests**

Run: `npm test -- test/footer-links.test.ts test/public-route-integrity.test.ts test/destination-categories.test.ts`

Expected: PASS; exactly six Footer tour targets match Where to Go links.

- [ ] **Step 5: Commit the Footer task**

```bash
git add src/lib/footer-links.ts src/components/footer.tsx src/app test/footer-links.test.ts test/public-route-integrity.test.ts
git commit -m "fix: derive footer tours from destination categories"
```

### Task 3: Tour Completeness Audit and Booking Fallback

**Files:**
- Create: `src/lib/tour-content-audit.ts`
- Create: `test/tour-content-audit.test.ts`
- Modify: `src/data/tours.ts`
- Modify: `src/components/tour-card.tsx`
- Modify: `src/components/listing/tour-listing-card.tsx`
- Modify: `src/components/tour/tour-detail.tsx`
- Modify: `src/components/admin-shell.tsx`
- Modify: `src/app/admin/page.tsx`

**Interfaces:**
- Produces `auditTourContent(tours: readonly Tour[]): TourContentIssue[]` where `TourContentIssue` is `{ slug; title; image; missing: TourContentField[] }`.
- Produces `isTourDetailReady(tour): boolean` from title, duration, description-or-itinerary, image, and configured contact availability.
- Extends `getBookingMailto(tour, recipient, pageUrl?)` to return a correctly URL-encoded tour-context email.
- Tour cards consume `getTourPublicHref(tour, recipient)` and route incomplete items to the contact fallback.

- [ ] **Step 1: Write failing audit and booking tests**

```ts
test("reports image-backed tours missing a customer-ready description", () => {
  assert.deepEqual(auditTourContent([{ ...tour, description: "", itinerary: [], image: "/tour.jpg" }]), [
    { slug: tour.slug, title: tour.title, image: "/tour.jpg", missing: ["descriptionOrItinerary"] },
  ]);
});

test("encodes title, code, and page URL in booking email", () => {
  assert.match(getBookingMailto(tour, "info@example.com", "https://site.test/tours/a"), /subject=Booking%20request/);
  assert.match(getBookingMailto(tour, "info@example.com", "https://site.test/tours/a"), /body=/);
});
```

Also assert a content-ready tour retains `/tours/<slug>` and an incomplete one does not.

- [ ] **Step 2: Run tour audit tests to verify they fail**

Run: `npm test -- test/tour-content-audit.test.ts`

Expected: FAIL because audit and fallback functions do not exist.

- [ ] **Step 3: Implement the pure audit and consume it at the UI boundary**

Create the audit helper without network calls. Build mailto URLs with `URLSearchParams`; use configured email first and `tel:` as visible fallback. In cards use the pure readiness helper to select the contact mailto route rather than a missing detail route. Add an AdminShell report table/download action populated from server-loaded published tours, showing only missing fields, not invented content. Keep Stripe checkout unchanged for tours with explicit fares.

- [ ] **Step 4: Run audit and existing tour tests**

Run: `npm test -- test/tour-content-audit.test.ts test/tour-content.test.ts test/travel-data-mapper.test.ts`

Expected: PASS; audit identifies incomplete image-backed records and all booking links are usable.

- [ ] **Step 5: Commit the audit task**

```bash
git add src/lib/tour-content-audit.ts src/data/tours.ts src/components/tour-card.tsx src/components/listing/tour-listing-card.tsx src/components/tour/tour-detail.tsx src/components/admin-shell.tsx src/app/admin/page.tsx test/tour-content-audit.test.ts
git commit -m "fix: provide tour booking and content audit fallback"
```

### Task 4: Route-only Admin Login and API Authorization

**Files:**
- Create: `src/lib/admin-auth.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/api/admin/auth/login/route.ts`
- Create: `src/app/api/admin/auth/logout/route.ts`
- Create: `src/components/admin-login-form.tsx`
- Create: `test/admin-auth.test.ts`
- Modify: `.env.example`
- Modify: `src/components/navbar.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: every `src/app/api/admin/**/route.ts`
- Modify: `src/components/admin-shell.tsx`

**Interfaces:**
- Produces `requireAdminSession(): Promise<void>` which redirects for pages or throws a typed authorization error for route handlers.
- Produces `assertAdminRequest(): Promise<Response | null>` returning a 401 JSON response when no valid session exists.
- Produces `createAdminSession(email, now)` and `verifyAdminSession(token, now)` using `ADMIN_SESSION_SECRET` and expiration timestamp.
- `POST /api/admin/auth/login` accepts `{ email, password }`, validates timing-safely against server environment variables, and sets `midearth-admin-session` as an HttpOnly cookie.

- [ ] **Step 1: Write failing auth tests**

```ts
test("rejects a tampered or expired signed session", async () => {
  const token = await createAdminSession("admin@example.com", new Date("2026-09-22T00:00:00Z"), testConfig);
  assert.equal(await verifyAdminSession(`${token}x`, new Date("2026-09-22T01:00:00Z"), testConfig), null);
  assert.equal(await verifyAdminSession(token, new Date("2026-10-23T00:00:00Z"), testConfig), null);
});
```

Add source-level assertions that Navbar contains no `/admin` link and every existing admin route imports the authorization guard.

- [ ] **Step 2: Run auth tests to verify they fail**

Run: `npm test -- test/admin-auth.test.ts`

Expected: FAIL because server auth helpers and login routes do not exist.

- [ ] **Step 3: Implement server-only auth and apply the guard**

Use Web Crypto HMAC SHA-256, constant-time byte comparison, an issue time and expiry in the signed payload, and explicit environment validation. Add the login form and post route; set `httpOnly`, `sameSite: "lax"`, `path: "/"`, `secure: process.env.NODE_ENV === "production"`, and bounded `maxAge`. Redirect anonymous `/admin` visitors to `/admin/login`; guard every existing admin API handler before reading request bodies or calling Supabase. Add logout control inside AdminShell. Remove desktop and drawer Admin Portal links. Add the three environment variable names, with non-secret explanatory placeholders only, to `.env.example`.

- [ ] **Step 4: Run authorization tests**

Run: `npm test -- test/admin-auth.test.ts test/admin-state.test.ts test/home-module-global-actions.test.ts`

Expected: PASS; missing config and anonymous/tampered sessions are rejected, while a valid test session verifies.

- [ ] **Step 5: Commit the admin auth task**

```bash
git add src/lib/admin-auth.ts src/app/admin src/app/api/admin src/components/admin-login-form.tsx src/components/admin-shell.tsx src/components/navbar.tsx .env.example test/admin-auth.test.ts
git commit -m "feat: protect route-only admin portal"
```

### Task 5: Browser and Release Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-09-22-public-site-language-links-admin.md`

**Interfaces:**
- Documents deployment configuration for `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD`, and `ADMIN_SESSION_SECRET`.
- Documents Panda's content-audit export workflow and the English fallback rule.

- [x] **Step 1: Add failing documentation-check assertions**

```ts
test("documents required initial admin environment variables", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  assert.match(readme, /ADMIN_INITIAL_EMAIL/);
  assert.match(readme, /ADMIN_SESSION_SECRET/);
});
```

- [x] **Step 2: Run the documentation check to verify it fails**

Run: `npm test -- test/admin-auth.test.ts`

Expected: FAIL because the README does not mention the new configuration.

- [x] **Step 3: Document operating behavior and manually verify the browser workflow**

Add a concise README section covering environment configuration, unlisted `/admin` access, and tour-content audit export. Start the Next dev server and verify: language selection persists after navigation; English fallback appears only for blank Chinese content; each of the six Footer links returns a non-404 listing; booking opens an encoded contact action; incomplete tour cards use contact fallback; `/admin` redirects before login; valid credentials allow CMS load; an anonymous `/api/admin/tours` call receives 401.

- [x] **Step 4: Run release verification**

Run: `npm test && npm run lint && npm run build`

Expected: all commands exit 0 with no test failures, lint errors, or build errors.

- [x] **Step 5: Commit verification documentation**

```bash
git add README.md docs/superpowers/plans/2026-09-22-public-site-language-links-admin.md test/admin-auth.test.ts
git commit -m "docs: document bilingual admin operations"
```
