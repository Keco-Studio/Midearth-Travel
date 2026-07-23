# Supabase Homepage Content Design

## Goal

Make every existing homepage module field persist in Supabase, allow image fields to upload real files to Supabase Storage, and render the published module data on the public homepage.

## Architecture

Use one `home_modules` table with JSONB columns for `fields`, `draft_data`, and `published_data`. This matches the existing fixed module registry while allowing each module to keep its own data shape. The browser talks only to Next.js Route Handlers; those handlers call Supabase REST and Storage with the configured server environment.

The existing seed modules remain the fixed registry and fallback content. The first admin read inserts any missing seed rows. Reads merge stored rows over seeds, so missing or malformed rows cannot remove a required homepage section.

## Editing Flow

1. The admin loads seed content immediately and replaces it with Supabase content after `/api/admin/home-modules` responds.
2. Editing changes local state and marks the module dirty.
3. `Save Draft` writes the full module data to `draft_data`, increments `draft_version`, and leaves `published_data` unchanged.
4. `Publish` copies the saved draft into `published_data`, increments `published_version`, and clears `draft_version`.
5. The public homepage reads only `published_data`; failed or unavailable Supabase reads fall back to seed content.

## Image Flow

Image selection keeps the existing file type and 5 MB validation. Valid files upload through `/api/admin/home-modules/upload` to the public `homepage-media` bucket. The returned public URL becomes the module field value and is persisted with the rest of the draft. Upload failures keep the previous value and show an admin error.

## Rendering

`src/app/page.tsx` loads all published module records once and passes each module's data into the existing section components. Existing text, links, visibility toggles, and image fields become props. Static data that is not represented by a module field remains unchanged.

## Database And Access

The migration creates the table, indexes it by module order, enables RLS, and creates read/write policies for the currently unauthenticated admin. It also creates the public Storage bucket and matching object policies. This preserves the current open admin behavior; authentication and restrictive write policies are a separate security task.

## Error Handling And Tests

Pure mapping tests cover row conversion, fixed-registry merging, field access, upload paths, and remote image previews. Route failures return structured errors. The admin shows success/error messages, and the public homepage degrades to seed content instead of failing the page.
