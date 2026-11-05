import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { findAllChildrenKeys } from "rc-table/lib/utils/expandUtil.js";

const workspaceSource = readFileSync(
  new URL("../src/components/bookings-workspace.tsx", import.meta.url),
  "utf8",
);

test("booking child counts are not treated as nested table rows", () => {
  const configuredColumn = workspaceSource.match(
    /<ProTable<BookingRecord>[\s\S]*?expandable=\{\{\s*childrenColumnName:\s*"([^"]+)"\s*\}\}/,
  )?.[1];
  const childrenColumnName = configuredColumn ?? "children";
  const booking = { id: "booking-1", children: 2 };

  assert.deepEqual(
    findAllChildrenKeys([booking], (record) => record.id, childrenColumnName),
    ["booking-1"],
  );
});
