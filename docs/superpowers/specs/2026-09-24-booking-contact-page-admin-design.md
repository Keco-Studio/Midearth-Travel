# Booking And Contact Page Admin Design

## Goal

Add separate Booking Page and Contact Us CMS workspaces so administrators can edit every public-facing label, explanatory text, and background image without changing application code.

## Architecture

The two page configurations are fixed Home Module records. They reuse the existing Supabase `home_modules` row, image upload API, draft/publish workflow, and `HomeModuleEditor`; no new table or upload path is introduced. The admin router exposes them as top-level workspaces, while public page routes load their published module data.

## Content Model

`bookingPage` owns its background image and all labels used by the booking form and review/payment workflow in English and Chinese. `contactPage` owns its background image plus all visible Contact Us form labels, headings, helper text, submit text, and success/error copy in both languages. Empty background values fall back to the published homepage Hero `backgroundImage`, then the current static coast image.

## Navigation

The CMS sidebar lists `Homepage Content`, `Booking Page`, `Contact Us`, then `Tour Library`. The existing Bookings and Payments operational workspaces remain unchanged and continue to manage customer records rather than page content.

## Verification

Unit tests cover the fixed module registry, top-level route parsing and ordering, and public fallback resolution. TypeScript, ESLint, and focused test groups must pass.
