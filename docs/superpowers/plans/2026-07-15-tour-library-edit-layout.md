# Tour Library Edit Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conservatively refine the Tour Library Edit form layout and styling without changing its content, field order, validation, or interactions.

**Architecture:** Keep `TourEditor` as the sole owner of the form and add only presentation-specific class hooks and wrappers. Keep all styling scoped under `.cms-tour-editor` in the existing admin stylesheet, with source-contract tests guarding section order, handlers, responsive hooks, and CSS scoping.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, Ant Design 5, CSS, Node.js test runner.

---

## File Map

- Create `test/tour-editor-layout.test.ts`: source-level regression contract for layout hooks, section order, existing handlers, scoped CSS, and responsive rules.
- Modify `src/components/tour-editor.tsx`: add presentational wrappers and class hooks only; preserve all state and handlers.
- Modify `src/app/admin/admin.css`: implement the approved bands, wayfinding marker, equal price columns, compact switch rows, and responsive behavior.

`src/components/tour-editor.tsx` and `src/app/admin/admin.css` already contain user-owned uncommitted work. Do not revert it, and do not automatically commit either file because a whole-file commit would mix unrelated changes.

### Task 1: Lock the content and interaction contract

**Files:**
- Create: `test/tour-editor-layout.test.ts`
- Read: `src/components/tour-editor.tsx`

- [ ] **Step 1: Write the failing structure contract**

Create `test/tour-editor-layout.test.ts` with the following content:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editorSource = readFileSync(
  new URL("../src/components/tour-editor.tsx", import.meta.url),
  "utf8",
);

const sectionTitles = [
  "Tour information",
  "Schedule and highlights",
  "Pricing",
  "Tour descriptions",
  "Media and PDF",
  "Publishing and categories",
];

test("tour editor preserves its section order and interaction handlers", () => {
  let previousIndex = -1;

  for (const title of sectionTitles) {
    const index = editorSource.indexOf(`title="${title}"`);
    assert.ok(index > previousIndex, `${title} must remain in its existing order`);
    previousIndex = index;
  }

  for (const contract of [
    "onFinish={onUpdate}",
    "beforeUpload={handleImageSelection}",
    "onClick={removeImage}",
    "beforeUpload={handlePdfSelection}",
    "onClick={removePdf}",
    "onClick={onCancel}",
    'htmlType="submit"',
  ]) {
    assert.ok(editorSource.includes(contract), `missing interaction contract: ${contract}`);
  }
});

test("tour editor exposes only presentational layout hooks", () => {
  for (const className of [
    "cms-tour-editor-form",
    "cms-tour-editor-section-heading",
    "cms-tour-editor-section-marker",
    "cms-tour-editor-section-body",
    "cms-tour-editor-price-grid",
    "cms-tour-editor-media-grid",
    "cms-tour-editor-publishing-grid",
    "cms-tour-editor-publishing-controls",
    "cms-tour-editor-toggle",
  ]) {
    assert.ok(editorSource.includes(className), `missing layout hook: ${className}`);
  }
});
```

- [ ] **Step 2: Run the test and confirm the new hook test fails**

Run: `npm test -- test/tour-editor-layout.test.ts`

Expected: the section and handler contract passes; `tour editor exposes only presentational layout hooks` fails first on `cms-tour-editor-form`.

### Task 2: Add presentation-only structure

**Files:**
- Modify: `src/components/tour-editor.tsx:96-330`
- Test: `test/tour-editor-layout.test.ts`

- [ ] **Step 1: Add the form and grid class hooks**

Add the presentation hooks with these exact attribute-only diffs; do not change children, field order, props, or handlers:

```diff
 <Form<TourRecord>
+  className="cms-tour-editor-form"
   form={form}

-<Row gutter={[16, 0]}>
+<Row gutter={[16, 0]} className="cms-tour-editor-price-grid">

-<Row gutter={[24, 16]} align="top">
+<Row gutter={[24, 16]} align="top" className="cms-tour-editor-media-grid">

-<Row gutter={[16, 8]}>
+<Row gutter={[16, 8]} className="cms-tour-editor-publishing-grid">

-<Col xs={24} md={12} lg={8}>
+<Col xs={24} md={12} lg={8} className="cms-tour-editor-publishing-controls">
```

The final `Col` diff applies only to the column that contains the existing Status and Order items, not to `ToggleField`.

- [ ] **Step 2: Add the section heading wrapper and decorative marker**

Replace only the `EditorSection` return markup with:

```tsx
return (
  <section className="cms-tour-editor-section">
    <div className="cms-tour-editor-section-heading">
      <span className="cms-tour-editor-section-marker" aria-hidden="true" />
      <Typography.Title level={5}>{title}</Typography.Title>
    </div>
    <div className="cms-tour-editor-section-body">{children}</div>
  </section>
);
```

- [ ] **Step 3: Add the compact toggle class without changing the switch**

Update the existing toggle `Form.Item` only:

```tsx
<Form.Item
  name={name}
  label={label}
  valuePropName="checked"
  className="cms-tour-editor-toggle"
>
  <Switch checkedChildren="Yes" unCheckedChildren="No" />
</Form.Item>
```

- [ ] **Step 4: Run the structure contract**

Run: `npm test -- test/tour-editor-layout.test.ts`

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Check that only presentation markup changed**

Run: `git diff -- src/components/tour-editor.tsx`

Expected: the existing Tour Type autocomplete diff remains; new changes consist only of the class hooks, section wrapper, and decorative `aria-hidden` marker described above. Do not stage or commit this file because it contains pre-existing user changes.

### Task 3: Implement the scoped visual layout test-first

**Files:**
- Modify: `test/tour-editor-layout.test.ts`
- Modify: `src/app/admin/admin.css:359-546`

- [ ] **Step 1: Add the failing scoped CSS contract**

Append to `test/tour-editor-layout.test.ts`:

```ts
const adminCss = readFileSync(
  new URL("../src/app/admin/admin.css", import.meta.url),
  "utf8",
);

test("tour editor styles are scoped and responsive", () => {
  for (const selector of [
    ".cms-tour-editor-form",
    ".cms-tour-editor-section-heading",
    ".cms-tour-editor-section-marker",
    ".cms-tour-editor-price-grid",
    ".cms-tour-editor-toggle",
    ".cms-tour-editor-publishing-controls",
  ]) {
    assert.ok(adminCss.includes(selector), `missing editor selector: ${selector}`);
  }

  assert.match(adminCss, /@media \(min-width: 1200px\)/);
  assert.match(adminCss, /@media \(max-width: 575px\)/);
  assert.match(adminCss, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(adminCss, /background:\s*#c8953f/);
});
```

- [ ] **Step 2: Run the contract and confirm it fails on the first new selector**

Run: `npm test -- test/tour-editor-layout.test.ts`

Expected: 2 tests pass and `tour editor styles are scoped and responsive` fails on `.cms-tour-editor-form`.

- [ ] **Step 3: Replace the existing tour editor section/action CSS with the approved layout**

Preserve the rich-text rules and replace only the editor container, section, field asset, toggle, pricing, and action rules with the following declarations. Every Ant Design override remains below `.cms-tour-editor`:

```css
.cms-tour-editor {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 8px 0 40px;
}

.cms-tour-editor .cms-tour-editor-form {
  display: grid;
  gap: 16px;
}

.cms-tour-editor .cms-tour-editor-section {
  padding: 24px 24px 8px;
  border-block: 1px solid #e4ded1;
  background: rgba(255, 255, 255, 0.58);
}

.cms-tour-editor .cms-tour-editor-section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.cms-tour-editor .cms-tour-editor-section-heading > .ant-typography {
  margin: 0;
  color: #12312b;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
}

.cms-tour-editor .cms-tour-editor-section-marker {
  width: 3px;
  height: 18px;
  flex: 0 0 auto;
  border-radius: 2px;
  background: #c8953f;
}

.cms-tour-editor .cms-tour-editor-section-body > :last-child,
.cms-tour-editor .cms-tour-editor-section-body > :last-child .ant-form-item:last-child {
  margin-bottom: 0;
}

.cms-tour-editor .cms-tour-editor-media-grid {
  align-items: stretch;
}

.cms-tour-editor .cms-tour-editor-image-preview {
  width: 100%;
}

.cms-tour-editor .cms-tour-editor-toggle.ant-form-item {
  margin-bottom: 8px;
}

.cms-tour-editor .cms-tour-editor-toggle .ant-form-item-row {
  min-height: 48px;
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #efe9dd;
  border-radius: 6px;
  background: #fffaf1;
}

.cms-tour-editor .cms-tour-editor-toggle .ant-form-item-label {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  padding: 0 12px 0 0;
  text-align: left;
  white-space: normal;
}

.cms-tour-editor .cms-tour-editor-toggle .ant-form-item-label > label {
  height: auto;
  color: #4a4438;
  white-space: normal;
}

.cms-tour-editor .cms-tour-editor-toggle .ant-form-item-control {
  flex: 0 0 auto;
  width: auto;
  min-width: max-content;
}

.cms-tour-editor .cms-tour-editor-publishing-controls {
  padding-top: 0;
}

.cms-tour-editor .cms-tour-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}

@media (min-width: 1200px) {
  .cms-tour-editor .cms-tour-editor-price-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    margin-inline: 0 !important;
    gap: 16px;
  }

  .cms-tour-editor .cms-tour-editor-price-grid > .ant-col {
    width: auto;
    max-width: none;
    padding-inline: 0 !important;
  }
}

@media (max-width: 575px) {
  .cms-tour-editor {
    padding-top: 0;
  }

  .cms-tour-editor .cms-tour-editor-form {
    gap: 12px;
  }

  .cms-tour-editor .cms-tour-editor-section {
    padding: 18px 16px 4px;
  }

  .cms-tour-editor .cms-tour-editor-section-heading {
    margin-bottom: 16px;
  }

  .cms-tour-editor .cms-tour-editor-actions .ant-btn {
    flex: 1 1 0;
  }
}
```

Retain the existing `.cms-tour-editor-description`, rich-text editor, image internals, file row, inline image, and mobile rich-text rules. Remove the superseded direct-child title selector and duplicate old editor/action/mobile section declarations.

- [ ] **Step 4: Run the focused contract**

Run: `npm test -- test/tour-editor-layout.test.ts`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 5: Check CSS specificity and diff integrity**

Run: `git diff --check && git diff -- src/app/admin/admin.css`

Expected: no whitespace errors; selectors remain scoped to the Tour Editor except existing shared rich-text rules. Do not stage or commit this file because it contains pre-existing user changes.

### Task 4: Verify behavior, build, and responsive rendering

**Files:**
- Verify: `src/components/tour-editor.tsx`
- Verify: `src/app/admin/admin.css`
- Verify: `test/tour-editor-layout.test.ts`

- [ ] **Step 1: Run all automated checks**

Run: `npm test`

Expected: all Node tests pass.

Run: `npm run lint`

Expected: ESLint exits 0 with no errors.

Run: `npm run build`

Expected: Next.js 16.2.9 production build completes successfully with `/admin` generated.

- [ ] **Step 2: Start the local application**

Run: `npm run dev`

Expected: Next.js reports a local URL and keeps the server running for review.

- [ ] **Step 3: Inspect responsive layout at representative widths**

Open `/admin`, select Tour Library, and edit a tour. Inspect approximately 1440px, 900px, and 390px viewport widths.

Expected:

- sections remain in the original order and read as restrained content bands;
- headings use the single gold marker and no added copy;
- price inputs form five equal columns only at wide desktop widths;
- English/Chinese field pairs collapse according to existing Ant breakpoints;
- switch labels and controls never overlap;
- media, rich-text editors, and actions do not clip horizontally;
- mobile actions share the row evenly.

If no browser automation is available in the environment, report that screenshot automation was unavailable and leave the running local URL for user inspection; do not claim screenshot verification.

- [ ] **Step 4: Smoke-test unchanged interactions**

Expected:

- clearing a required English title produces the existing validation message;
- Tour Type accepts an existing option and a custom value;
- choosing/removing an image updates the preview as before;
- choosing/removing a PDF updates the filename row as before;
- category switches and Status remain operable;
- Cancel returns to the Tour Library table;
- Update persists and returns to the table with the existing success message.

- [ ] **Step 5: Review the final diff without committing user-owned changes**

Run: `git diff --check && git status --short && git diff -- test/tour-editor-layout.test.ts src/components/tour-editor.tsx src/app/admin/admin.css`

Expected: only the new layout test and approved presentation changes are new; pre-existing Tour Type changes remain intact. Leave implementation files uncommitted unless the user explicitly requests a commit strategy for the overlapping changes.
