# Admin Portal Integration Design

## Goal

Merge the current `travel-cms` experience into `midearth-travel` so the public website and CMS run as one Next.js application and one deployment. The CMS is available at `/admin`, reached from a new `Admin Portal` item in the public navigation.

The original `travel-cms` directory remains unchanged as a backup. The merged application must not import or load source files from that directory at runtime.

## Scope

- Keep all existing public website routes and behavior.
- Add a public `/admin` route with no authentication in this iteration.
- Add `Admin Portal` to both the desktop navigation and mobile drawer.
- Preserve the CMS interface and current client-side state behavior.
- Merge the CMS runtime and development dependencies into `midearth-travel`.
- Move the CMS components, state helpers, types, theme, seed data, and tests needed by the integrated application into `midearth-travel`.
- Keep public website and CMS styling visually isolated.

Authentication, persistent storage, API integration, CMS-generated public layouts, and removal of the original `travel-cms` directory are outside this scope.

## Architecture

`midearth-travel` remains the only runnable and deployable application. Its existing root layout continues to own document markup, public metadata, fonts, and the language provider.

The new `src/app/admin` route owns the CMS entry point:

- `src/app/admin/page.tsx` renders the existing `AdminShell`.
- `src/app/admin/layout.tsx` provides CMS metadata, the Ant Design application provider, and a CMS root container.
- CMS-specific global selectors are loaded only by the admin route and are scoped to CMS or Ant Design class names. Broad `html`, `body`, and universal rules from the standalone CMS are removed or narrowed so they cannot reset the public website.

CMS implementation files are copied into the matching `midearth-travel/src` ownership areas. Existing import aliases remain valid, minimizing behavioral changes. Files with potential ownership ambiguity should retain explicit CMS naming.

## Navigation

The public navbar receives a fifth item:

- Label: `Admin Portal`
- Destination: `/admin`
- Active state: active when the pathname starts with `/admin`

The item appears in the desktop navigation and mobile drawer. Navigation uses Next.js `Link`, so moving between the public site and CMS remains client-side where supported.

The public navbar is not rendered inside the CMS. Returning to the public website remains available through normal browser navigation in this iteration; adding a dedicated CMS return action is outside scope.

## CMS Behavior

The integrated CMS preserves its current workspace state model, editors, menu behavior, seed data, and notifications. Internal CMS sidebar selections continue to be handled by `AdminShell` state rather than creating new application routes. The browser URL therefore remains `/admin` while the user moves among current CMS workspaces.

No authentication check, redirect, middleware, or role model is added. Anyone who can reach the deployed site can open `/admin` until access control is implemented separately.

## Styling And Providers

The public root layout keeps `LangProvider`. The admin layout nests `AntdAppProvider` beneath it; the language context is harmless for CMS code and avoids conditional provider logic in the root layout.

CMS CSS is separated from the public global stylesheet. Generic standalone resets are narrowed to the CMS root, while existing `.cms-*` and `.ant-*` selectors remain available to the admin UI. This prevents public typography, spacing, and component styles from changing after visiting `/admin`.

Ant Design overlays such as messages and tooltips may render through document-level portals. Their framework selectors remain global so those overlays retain correct styling.

## Dependencies And Assets

The CMS dependencies from `travel-cms/package.json` are added to `midearth-travel/package.json` while retaining the existing shared Next.js and React versions. The lockfile is regenerated through the package manager.

CMS assets already present in `midearth-travel/public` are reused. Any CMS-only asset referenced by migrated code is copied into the matching public path. Duplicate files are not recopied unless their contents differ.

## Error Handling

The admin route uses the existing CMS loading state while client-only Pro Layout content mounts. Existing Ant Design messages continue to report draft, publish, and preview actions.

The integration does not add server data fetching, so it introduces no new network error state. Build-time missing imports, missing assets, and provider errors are treated as integration failures and must be resolved before completion.

## Verification

Verification must cover:

- Existing CMS unit tests migrated into `midearth-travel`.
- Existing public-site lint and build commands.
- CMS language/content checks where applicable.
- A production build proving `/admin` and public routes compile together.
- Browser checks at desktop and mobile widths for `Admin Portal`, `/admin` rendering, mobile drawer navigation, and public/CMS style isolation.
- Confirmation that the merged application does not reference files under `../travel-cms`.

## Delivery Boundary

Only `midearth-travel` becomes the combined runnable application. `travel-cms` remains in the workspace as a preserved backup and source reference, with its current uncommitted work untouched.
