# Homepage Nav Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh homepage/nav copy, hero service cards, and mobile responsiveness for Midearth Travel.

**Architecture:** Use existing React components and CSS/CSS modules. Add one static verification script under `scripts/` to assert requested visible copy and key CSS selectors.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Tailwind CSS v4.

## Global Constraints

- Code, variables, interfaces, API names, and comments must be in English.
- Preserve unrelated user changes.
- Prefer existing project patterns over new abstractions.
- Read local Next docs before changing code because this project uses Next.js 16.

---

### Task 1: Static Verification

**Files:**
- Create: `scripts/verify-homepage-refresh.mjs`
- Modify: `package.json`

**Steps:**
- [ ] Add a Node script that reads the relevant component/CSS files and asserts requested copy and CSS markers.
- [ ] Add `verify:homepage` to `package.json`.
- [ ] Run `npm run verify:homepage` and confirm it fails before implementation because the old copy is still present.

### Task 2: Homepage And Nav Changes

**Files:**
- Modify: `src/components/hero.tsx`
- Modify: `src/components/hero.module.css`
- Modify: `src/components/navbar.tsx`
- Modify: `src/components/tours-section.tsx`
- Modify: `src/components/category-grid.tsx`
- Modify: `src/components/explore-by-month-section.tsx`
- Modify: `src/components/listing/popular-by-month.tsx`
- Modify: `src/components/listing/browse-sections.module.css`
- Modify: `src/components/about-section.tsx`
- Modify: `src/components/about-section.module.css`
- Modify: `src/app/globals.css`

**Steps:**
- [ ] Update hero card data and visual states.
- [ ] Update nav label/link behavior and mobile header visibility.
- [ ] Update section copy using consistent title/subtitle structure.
- [ ] Tune mobile hero cards and monthly destination cards for full visibility.
- [ ] Run `npm run verify:homepage`, `npm run lint`, and `npm run build`.
