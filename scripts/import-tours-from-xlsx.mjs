import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import XLSX from "xlsx";
import { mapExcelRowsToTourRecords } from "../src/lib/tour-import-mapper.ts";
import { toTourRow } from "../src/lib/tour-content.ts";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, key };
}

async function upsertTourRows(rows) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/tours?on_conflict=slug`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase upsert failed (${response.status}): ${body}`);
  }

  return response.json();
}

function readWorkbookRows(workbookPath) {
  const workbook = XLSX.readFile(workbookPath);
  const sheetName = workbook.SheetNames.includes("Sheet1")
    ? "Sheet1"
    : workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
}

async function main() {
  const projectDir = process.cwd();
  loadEnvFile(resolve(projectDir, ".env.local"));

  const workbookPath =
    process.argv[2] ??
    "/mnt/c/Users/Administrator/Desktop/Midearth_All_Tour_Products_Website_Import_2026-09-01.xlsx";

  if (!existsSync(workbookPath)) {
    throw new Error(`Workbook not found: ${workbookPath}`);
  }

  const excelRows = readWorkbookRows(workbookPath);
  const records = mapExcelRowsToTourRecords(excelRows);

  if (records.length === 0) {
    throw new Error("No tour records were parsed from the workbook.");
  }

  const rows = records.map(toTourRow);
  const saved = await upsertTourRows(rows);

  console.log(`Imported ${saved.length} tours from ${workbookPath}`);
  for (const row of saved.sort((a, b) => a.slug.localeCompare(b.slug))) {
    console.log(`- ${row.data.code} ${row.slug} (${row.status})`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
