import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Tour media storage permits PDF uploads up to the editor limit", () => {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/202609240001_allow_tour_pdfs.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /file_size_limit\s*=\s*20971520/);
  assert.match(migration, /'application\/pdf'/);
});
