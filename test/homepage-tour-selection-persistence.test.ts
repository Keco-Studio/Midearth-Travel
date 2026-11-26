import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const migrationPath = new URL(
  "../supabase/migrations/202611260002_homepage_tour_selection_sync.sql",
  import.meta.url,
);

test("linked Homepage selections use one service-role transaction", () => {
  const migration = readFileSync(migrationPath, "utf8");
  const persistence = read("../src/lib/supabase-home-content.ts");

  assert.match(migration, /persist_linked_homepage_tour_state/i);
  assert.match(migration, /order by[^;]*module_id/i);
  assert.match(migration, /order by[^;]*slug/i);
  assert.match(migration, /data\s*=\s*target\.data\s*\|\|\s*coalesce\([^;]*'data'/i);
  assert.match(
    migration,
    /grant execute[^;]*persist_linked_homepage_tour_state[^;]*to service_role/i,
  );
  assert.doesNotMatch(
    migration,
    /grant execute[^;]*persist_linked_homepage_tour_state[^;]*to[^;]*(?:anon|authenticated)/i,
  );
  assert.match(persistence, /rpc\/persist_linked_homepage_tour_state/);
  assert.match(persistence, /getSupabaseServiceConfig/);
});

test("complete Tour writes compare revisions before replacing the row", () => {
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(migration, /tour_operation ->> 'expected_updated_at'/i);
  assert.match(migration, /HOMEPAGE_SELECTION_TOUR_CONFLICT/);
  assert.match(migration, /data\s*=\s*excluded\.data/i);
  assert.match(
    migration,
    /not found\s+and\s+tour_operation ->> 'kind'\s*<>\s*'tour'/i,
  );
});

test("linked Homepage routes require revisions and map conflicts to 409", () => {
  const homeRoute = read("../src/app/api/admin/home-modules/[id]/route.ts");
  const tourRoute = read("../src/app/api/admin/tours/[slug]/route.ts");

  assert.match(homeRoute, /HomepageTourSelectionConflictError[\s\S]{0,140}409/);
  assert.match(homeRoute, /saveLinkedSelectionModuleDraft/);
  assert.match(homeRoute, /publishLinkedSelectionModule/);
  assert.match(tourRoute, /saveTourAndSyncHomepageSelections/);
  assert.match(tourRoute, /linkedModules/);
  assert.doesNotMatch(tourRoute, /saveTourAndSyncHotSales/);
});

test("Tour Library merges every linked Homepage module returned by a save", () => {
  const workspace = read("../src/components/tours-workspace.tsx");
  const shell = read("../src/components/admin-shell.tsx");

  assert.match(workspace, /linkedModules: HomeModuleRecord\[\]/);
  assert.match(workspace, /onLinkedModulesChange\?\.\(result\.linkedModules\)/);
  assert.doesNotMatch(workspace, /onHotSalesModuleChange/);
  assert.match(shell, /mergeLoadedHomeModules\(current, modules\)/);
});
