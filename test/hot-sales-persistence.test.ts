import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminShell = readFileSync(
  new URL("../src/components/admin-shell.tsx", import.meta.url),
  "utf8",
);
const homeRoute = readFileSync(
  new URL("../src/app/api/admin/home-modules/[id]/route.ts", import.meta.url),
  "utf8",
);
const tourRoute = readFileSync(
  new URL("../src/app/api/admin/tours/[slug]/route.ts", import.meta.url),
  "utf8",
);
const toursWorkspace = readFileSync(
  new URL("../src/components/tours-workspace.tsx", import.meta.url),
  "utf8",
);
const tourPersistence = readFileSync(
  new URL("../src/lib/supabase-tours.ts", import.meta.url),
  "utf8",
);
const homePersistence = readFileSync(
  new URL("../src/lib/supabase-home-content.ts", import.meta.url),
  "utf8",
);
const migration = readFileSync(
  new URL(
    "../supabase/migrations/202611260001_hot_sales_transactions.sql",
    import.meta.url,
  ),
  "utf8",
);

test("Homepage Hot Sales saves and publishes with optimistic revision checks", () => {
  assert.match(adminShell, /expectedUpdatedAt:\s*activeModule\.updatedAt/g);
  assert.match(homeRoute, /expectedUpdatedAt/);
  assert.match(homeRoute, /HotSalesConflictError/);
  assert.match(homeRoute, /HotSalesConflictError[\s\S]{0,180}\? 409/);
});

test("Hot Sales linked writes use one database transaction RPC", () => {
  assert.match(homePersistence, /rpc\/persist_hot_sales_state/);
  assert.match(homeRoute, /publishHotSalesModule/);
  assert.match(tourRoute, /saveTourAndSyncHomepageSelections/);
  assert.doesNotMatch(tourRoute, /await saveTour\(/);

  assert.match(migration, /create or replace function public\.persist_hot_sales_state/i);
  assert.match(migration, /for update/i);
  assert.match(migration, /HOT_SALES_CONFLICT/);
  assert.match(migration, /insert into public\.home_modules/i);
  assert.match(migration, /insert into public\.tours/i);
});

test("linked Tour saves reject stale editor revisions", () => {
  assert.doesNotMatch(
    toursWorkspace,
    /validation\.value,[\s\S]{0,100}updatedAt:\s*new Date\(\)\.toISOString\(\)/,
  );
  assert.match(homePersistence, /expected_updated_at:\s*expectedTourUpdatedAt/);
  assert.match(migration, /HOT_SALES_TOUR_CONFLICT/);
  assert.match(migration, /tour_row ->> 'expected_updated_at'/);
});

test("Hot Sales publishing and Tour ordering update only their owned fields", () => {
  assert.match(homePersistence, /createHotSalesTourPatches/);
  assert.doesNotMatch(homePersistence, /nextTours\.map\(toTourRow\)/);
  assert.match(migration, /tour_row ->> 'kind'\s*=\s*'promotion'/);
  assert.match(migration, /data\s*=\s*[^;]*\|\|\s*coalesce\(tour_row -> 'data'/i);
  assert.match(tourPersistence, /rpc\/persist_tour_order/);
  assert.match(migration, /create or replace function public\.persist_tour_order/i);
  assert.match(migration, /jsonb_set\([^;]*\{displayOrder\}/i);
});

test("Hot Sales transaction RPC is restricted to the server service role", () => {
  assert.match(homePersistence, /getSupabaseServiceConfig/);
  assert.match(
    migration,
    /grant execute on function public\.persist_hot_sales_state\(jsonb, jsonb, timestamptz\)\s+to service_role/i,
  );
  assert.doesNotMatch(
    migration,
    /grant execute on function public\.persist_hot_sales_state\(jsonb, jsonb, timestamptz\)\s+to[^;]*(?:anon|authenticated)/i,
  );
});

test("missing Hot Sales storage is migrated from live Tour Library records", () => {
  assert.match(homePersistence, /createHotSalesContentFromTours/);
  assert.match(homePersistence, /loadAdminTours/);
});
