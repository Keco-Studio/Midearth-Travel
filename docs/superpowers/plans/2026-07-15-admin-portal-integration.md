# Admin Portal Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the existing MidEarth Travel public website and current CMS as one `midearth-travel` Next.js application, with the CMS available at `/admin` through an `Admin Portal` navigation item.

**Architecture:** Keep the public root layout unchanged and add a nested `/admin` layout that owns Ant Design providers and route-specific CMS CSS. Copy the current CMS implementation into the corresponding `midearth-travel/src` directories, but make its mapper consume the public application's canonical `src/data/tours.ts` and `src/data/site.ts` directly instead of retaining synchronized snapshots. Preserve `travel-cms` as an untouched backup.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 5, Ant Design Pro Components, Tiptap 3, Node test runner, ESLint

---

### Task 1: Add A Failing Integration Contract

**Files:**
- Create: `scripts/verify-admin-integration.mjs`

- [ ] **Step 1: Read the repository-specific Next.js routing and CSS guidance**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md
sed -n '1,240p' node_modules/next/dist/docs/01-app/01-getting-started/11-css.md
```

Expected: the local Next.js 16 documentation confirms nested layouts and route-level stylesheet imports.

- [ ] **Step 2: Create the integration verification script**

Create `scripts/verify-admin-integration.mjs` with:

```js
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const requiredFiles = [
  "src/app/admin/layout.tsx",
  "src/app/admin/page.tsx",
  "src/app/admin/admin.css",
  "src/components/admin-shell.tsx",
  "src/components/antd-app-provider.tsx",
  "src/components/rich-text-editor.tsx",
  "src/components/tour-editor.tsx",
  "src/data/cms-seed.ts",
  "src/lib/admin-state.ts",
  "src/theme/mid-earth-theme.ts",
  "src/types/cms.ts",
  "test/admin-state.test.ts",
];

for (const path of requiredFiles) {
  if (!existsSync(path)) failures.push(`missing ${path}`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const requiredDependencies = [
  "@ant-design/icons",
  "@ant-design/nextjs-registry",
  "@ant-design/pro-components",
  "@ant-design/v5-patch-for-react-19",
  "@tiptap/extension-link",
  "@tiptap/extension-underline",
  "@tiptap/react",
  "@tiptap/starter-kit",
  "antd",
  "sanitize-html",
];

for (const dependency of requiredDependencies) {
  if (!packageJson.dependencies?.[dependency]) {
    failures.push(`missing dependency ${dependency}`);
  }
}

function readIfPresent(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const navbar = readIfPresent("src/components/navbar.tsx");
const adminLayout = readIfPresent("src/app/admin/layout.tsx");
const adminPage = readIfPresent("src/app/admin/page.tsx");
const adminCss = readIfPresent("src/app/admin/admin.css");
const mapper = readIfPresent("src/lib/travel-data-mapper.ts");

if (!navbar.includes('label: "Admin Portal"') || !navbar.includes('href: "/admin"')) {
  failures.push("navbar does not expose Admin Portal at /admin");
}
if (!navbar.includes('item.key === "admin"') || !navbar.includes('pathname.startsWith("/admin")')) {
  failures.push("navbar does not mark the admin route active");
}
if (!adminLayout.includes("<AntdAppProvider>") || !adminLayout.includes('className="cms-root"')) {
  failures.push("admin layout does not isolate the CMS provider and root");
}
if (!adminPage.includes("<AdminShell />")) {
  failures.push("admin page does not render AdminShell");
}
if (!adminCss.includes(".cms-root,") || /^\s*\*\s*\{/m.test(adminCss)) {
  failures.push("admin stylesheet does not scope its universal reset");
}
if (!mapper.includes('"../data/tours.ts"') || !mapper.includes('"../data/site.ts"')) {
  failures.push("CMS mapper does not use canonical public travel data");
}
if (mapper.includes("travel-site")) {
  failures.push("CMS mapper still uses a duplicated travel-site snapshot");
}

if (failures.length) {
  console.error("Admin integration verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Admin integration verification passed.");
```

- [ ] **Step 3: Run the contract and verify it fails**

Run: `node scripts/verify-admin-integration.mjs`

Expected: FAIL with missing `/admin` files, CMS dependencies, and navbar integration.

### Task 2: Migrate The Current CMS Implementation And Tests

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/admin-shell.tsx`
- Create: `src/components/antd-app-provider.tsx`
- Create: `src/components/asset-preview.tsx`
- Create: `src/components/bookings-workspace.tsx`
- Create: `src/components/cms-home-module-menu.css`
- Create: `src/components/cms-menu-items.tsx`
- Create: `src/components/home-module-editor.tsx`
- Create: `src/components/payments-workspace.tsx`
- Create: `src/components/rich-text-editor.tsx`
- Create: `src/components/settings-panel.tsx`
- Create: `src/components/status-tag.tsx`
- Create: `src/components/tour-editor.tsx`
- Create: `src/components/tours-workspace.tsx`
- Create: `src/data/cms-seed.ts`
- Create: `src/lib/admin-state.ts`
- Create: `src/lib/content-rules.ts`
- Create: `src/lib/inline-image-upload.ts`
- Create: `src/lib/layout-routes.ts`
- Create: `src/lib/module-editor.ts`
- Create: `src/lib/rich-text-content.ts`
- Create: `src/lib/rich-text-selection.ts`
- Create: `src/lib/sidebar-navigation.ts`
- Create: `src/lib/tour-editor-state.ts`
- Create: `src/lib/tour-type-state.ts`
- Create: `src/lib/travel-data-mapper.ts`
- Create: `src/lib/workspace-view-models.ts`
- Create: `src/theme/mid-earth-theme.ts`
- Create: `src/types/cms.ts`
- Create: `test/*.test.ts`

- [ ] **Step 1: Install the exact CMS dependencies and add test scripts**

Run:

```bash
npm install @ant-design/icons@^6.3.2 @ant-design/nextjs-registry@^1.3.0 @ant-design/pro-components@^2.8.10 @ant-design/v5-patch-for-react-19@^1.0.3 @tiptap/extension-link@^3.27.4 @tiptap/extension-underline@^3.27.4 @tiptap/react@^3.27.4 @tiptap/starter-kit@^3.27.4 antd@^5.29.3 sanitize-html@2.17.0
npm install --save-dev @types/sanitize-html@^2.16.1
```

Then add these scripts to `package.json`:

```json
"test": "node --experimental-strip-types --test",
"verify:admin": "node scripts/verify-admin-integration.mjs"
```

Expected: `package.json` and `package-lock.json` contain all CMS dependencies without changing the existing Next.js or React versions.

- [ ] **Step 2: Copy the current CMS implementation mechanically**

Copy the listed component, library, theme, type, seed, and test files from the sibling `../travel-cms` paths into the exact destinations above. Use the current working-tree files, including uncommitted CMS changes. Do not copy `travel-cms/src/app/layout.tsx`, `travel-cms/src/app/page.tsx`, `travel-cms/src/app/globals.css`, `travel-cms/src/data/travel-site`, build output, or generated TypeScript metadata.

Expected: the backup repository is byte-for-byte unchanged, and the copied CMS files match its current working-tree versions before integration-specific edits.

- [ ] **Step 3: Point the CMS mapper at canonical public data**

Change the first two imports in `src/lib/travel-data-mapper.ts` to:

```ts
import { site } from "../data/site.ts";
import { tours } from "../data/tours.ts";
```

Change the data import in `test/travel-data-mapper.test.ts` to:

```ts
import { tours } from "../src/data/tours.ts";
```

Expected: no migrated runtime or test file imports `src/data/travel-site`.

- [ ] **Step 4: Run the CMS unit tests**

Run: `npm test`

Expected: all migrated Node tests pass.

- [ ] **Step 5: Commit the CMS migration**

```bash
git add package.json package-lock.json \
  src/components/admin-shell.tsx \
  src/components/antd-app-provider.tsx \
  src/components/asset-preview.tsx \
  src/components/bookings-workspace.tsx \
  src/components/cms-home-module-menu.css \
  src/components/cms-menu-items.tsx \
  src/components/home-module-editor.tsx \
  src/components/payments-workspace.tsx \
  src/components/rich-text-editor.tsx \
  src/components/settings-panel.tsx \
  src/components/status-tag.tsx \
  src/components/tour-editor.tsx \
  src/components/tours-workspace.tsx \
  src/data/cms-seed.ts \
  src/lib/admin-state.ts \
  src/lib/content-rules.ts \
  src/lib/inline-image-upload.ts \
  src/lib/layout-routes.ts \
  src/lib/module-editor.ts \
  src/lib/rich-text-content.ts \
  src/lib/rich-text-selection.ts \
  src/lib/sidebar-navigation.ts \
  src/lib/tour-editor-state.ts \
  src/lib/tour-type-state.ts \
  src/lib/travel-data-mapper.ts \
  src/lib/workspace-view-models.ts \
  src/theme/mid-earth-theme.ts \
  src/types/cms.ts \
  test/*.test.ts
git commit -m "feat: migrate CMS implementation into travel app"
```

### Task 3: Add The Isolated Admin Route

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/admin.css`

- [ ] **Step 1: Add the admin page**

Create `src/app/admin/page.tsx`:

```tsx
import { AdminShell } from "@/components/admin-shell";

export default function AdminPage() {
  return <AdminShell />;
}
```

- [ ] **Step 2: Add the nested admin layout and provider**

Create `src/app/admin/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { AntdAppProvider } from "@/components/antd-app-provider";
import "./admin.css";

export const metadata: Metadata = {
  title: "Midearth CMS",
  description: "Content management workspace for MidEarth Travel.",
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AntdAppProvider>
      <div className="cms-root">{children}</div>
    </AntdAppProvider>
  );
}
```

- [ ] **Step 3: Migrate and scope the CMS stylesheet**

Copy the current `../travel-cms/src/app/globals.css` to `src/app/admin/admin.css`. Replace its opening generic rules with:

```css
.cms-root,
.cms-root * {
  box-sizing: border-box;
}

.cms-root {
  min-height: 100vh;
  margin: 0;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

Keep the existing `.ant-*` and `.cms-*` rules unchanged so Ant Design portals, messages, and tooltips retain their CMS styling.

- [ ] **Step 4: Run the integration contract and confirm only navigation remains**

Run: `npm run verify:admin`

Expected: FAIL only for the missing `Admin Portal` navbar entry and active-state behavior.

- [ ] **Step 5: Commit the admin route**

```bash
git add src/app/admin scripts/verify-admin-integration.mjs
git commit -m "feat: add isolated admin route"
```

### Task 4: Connect Public Navigation To The Admin Portal

**Files:**
- Modify: `src/components/navbar.tsx`

- [ ] **Step 1: Add the desktop navigation item**

Append this item to the `nav` array in `Navbar`:

```ts
{ key: "admin", label: "Admin Portal", href: "/admin" },
```

Add this branch at the start of `isActive`:

```ts
if (item.key === "admin") {
  return pathname.startsWith("/admin");
}
```

- [ ] **Step 2: Render the same navigation model in the mobile drawer**

Replace the four hard-coded drawer links with:

```tsx
{nav.map((item) => (
  <Link
    key={item.key}
    className="drawer-link"
    href={item.href}
    onClick={() => setDrawerOpen(false)}
  >
    {item.label}
  </Link>
))}
```

Expected: `Admin Portal` appears in both desktop and mobile navigation, and the existing four mobile links retain their labels and destinations.

- [ ] **Step 3: Run both public and admin static verification**

Run:

```bash
npm run verify:homepage
npm run verify:admin
```

Expected: both commands PASS.

- [ ] **Step 4: Commit navigation integration**

```bash
git add src/components/navbar.tsx
git commit -m "feat: link public navigation to admin portal"
```

### Task 5: Verify The Combined Application End To End

**Files:**
- Modify only if verification reveals an integration defect in files already listed above.

- [ ] **Step 1: Confirm the preserved CMS repository was not modified by the migration**

Run `git -C ../travel-cms status --short` and compare it with the status recorded before implementation.

Expected: the same pre-existing modified, deleted, and untracked CMS files remain; no new migration edits appear there.

- [ ] **Step 2: Run focused and full checks**

Run:

```bash
npm test
npm run verify:homepage
npm run verify:admin
npm run lint
npm run build
rg -n "\.\./travel-cms|data/travel-site" src test scripts
```

Expected: tests, verification, lint, and production build PASS. The final `rg` command returns no matches.

- [ ] **Step 3: Start the production-like development server**

Run: `npm run dev -- --hostname 0.0.0.0 --port 3000`

Expected: Next.js reports a ready local server. If port 3000 is occupied, rerun with the next available port.

- [ ] **Step 4: Check public and admin HTTP responses**

Run:

```bash
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/admin
```

Expected: both responses return HTTP 200.

- [ ] **Step 5: Inspect desktop and mobile behavior**

Open the running site at desktop and mobile widths. Confirm the desktop navigation contains `Admin Portal`, the mobile drawer contains the same entry and closes after selection, `/admin` fills the viewport without the public navbar, CMS menus and editors render, and returning to `/` restores the public site's typography and layout.

- [ ] **Step 6: Commit any verification-only corrections**

If verification required corrections, stage only the integration files changed in this plan and commit:

```bash
git commit -m "fix: complete admin portal integration"
```

If no corrections were required, do not create an empty commit.
