import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspaceSource = readFileSync(
  new URL("../src/components/tours-workspace.tsx", import.meta.url),
  "utf8",
);
const adminCss = readFileSync(
  new URL("../src/app/admin/admin.css", import.meta.url),
  "utf8",
);

test("Tour Library wraps its wide table with a top horizontal scrollbar", () => {
  assert.match(workspaceSource, /import \{ SyncedHorizontalScroller \}/);
  assert.match(
    workspaceSource,
    /<SyncedHorizontalScroller[\s\S]*?<ProTable<TourRecord>[\s\S]*?<\/SyncedHorizontalScroller>/,
  );
});

test("the top scrollbar synchronizes with the Ant Design table and resizes", () => {
  const scrollerSource = readFileSync(
    new URL("../src/components/synced-horizontal-scroller.tsx", import.meta.url),
    "utf8",
  );

  assert.match(scrollerSource, /\.ant-table-content/);
  assert.match(scrollerSource, /ResizeObserver/);
  assert.match(scrollerSource, /MutationObserver/);
  assert.match(scrollerSource, /scrollLeft/);
  assert.match(scrollerSource, /addEventListener\("scroll"/);
});

test("the mirrored scrollbar is styled as a horizontal overflow control", () => {
  assert.match(
    adminCss,
    /\.cms-synced-horizontal-scrollbar\s*\{[\s\S]*?overflow-x:\s*auto;/,
  );
  assert.match(adminCss, /\.cms-synced-horizontal-scrollbar\[hidden\]/);
});

test("the top scrollbar sits inside the Tour Library card surface", () => {
  assert.match(
    adminCss,
    /\.cms-synced-horizontal-scroll\s*\{[^}]*background:\s*#fff;/,
  );
  assert.match(
    adminCss,
    /\.cms-synced-horizontal-scrollbar\s*\{[^}]*width:\s*calc\(100% - 60px\);[^}]*margin:\s*12px 30px 8px;/,
  );
});
