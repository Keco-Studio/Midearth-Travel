import { pathToFileURL } from "node:url";

export const APP_TABLES = [
  "home_modules",
  "tours",
  "destination_categories",
  "homepage_services",
  "homepage_testimonials",
  "global_settings",
  "bookings",
  "payment_orders",
  "payment_webhook_events",
  "admin_users",
  "admin_invitations",
];

const PAGE_SIZE = 500;
const UPSERT_BATCH_SIZE = 100;

export function rewriteStorageUrls(value, sourceUrl, targetUrl) {
  if (typeof value === "string") return value.replaceAll(sourceUrl, targetUrl);
  if (Array.isArray(value)) return value.map((entry) => rewriteStorageUrls(entry, sourceUrl, targetUrl));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        rewriteStorageUrls(entry, sourceUrl, targetUrl),
      ]),
    );
  }
  return value;
}

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value.replace(/\/$/, "");
}

function createClient(url, serviceKey) {
  return {
    url,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  };
}

async function request(client, path, init = {}) {
  const response = await fetch(`${client.url}${path}`, {
    ...init,
    headers: { ...client.headers, ...init.headers },
  });
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed (${response.status}): ${await response.text()}`);
  }
  return response;
}

async function getTableCount(client, table) {
  const response = await request(client, `/rest/v1/${table}?select=*&limit=1`, {
    headers: { Prefer: "count=exact" },
  });
  const range = response.headers.get("content-range");
  const total = range?.split("/")[1];
  return total && total !== "*" ? Number(total) : (await response.json()).length;
}

async function getAllRows(client, table) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const response = await request(
      client,
      `/rest/v1/${table}?select=*&limit=${PAGE_SIZE}&offset=${offset}`,
    );
    const page = await response.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function upsertRows(client, table, rows) {
  for (let offset = 0; offset < rows.length; offset += UPSERT_BATCH_SIZE) {
    await request(client, `/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows.slice(offset, offset + UPSERT_BATCH_SIZE)),
    });
  }
}

async function listBuckets(client) {
  return (await request(client, "/storage/v1/bucket")).json();
}

async function ensureBucket(client, bucket) {
  const buckets = await listBuckets(client);
  if (buckets.some((entry) => entry.id === bucket.id)) return;

  await request(client, "/storage/v1/bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      file_size_limit: bucket.file_size_limit,
      allowed_mime_types: bucket.allowed_mime_types,
    }),
  });
}

async function listObjects(client, bucketId, prefix = "") {
  const objects = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const response = await request(client, `/storage/v1/object/list/${encodeURIComponent(bucketId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit: PAGE_SIZE, offset }),
    });
    const entries = await response.json();

    for (const entry of entries) {
      const path = `${prefix}${entry.name}`;
      if (entry.id && entry.metadata) {
        objects.push({ path, contentType: entry.metadata.mimetype });
      } else {
        objects.push(...(await listObjects(client, bucketId, `${path}/`)));
      }
    }

    if (entries.length < PAGE_SIZE) return objects;
  }
}

function encodeObjectPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function copyObject(source, target, bucketId, object) {
  const path = encodeObjectPath(object.path);
  const download = await request(source, `/storage/v1/object/${encodeURIComponent(bucketId)}/${path}`);
  await request(target, `/storage/v1/object/${encodeURIComponent(bucketId)}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": object.contentType || "application/octet-stream",
      "x-upsert": "true",
    },
    body: await download.arrayBuffer(),
  });
}

async function getStorageManifest(client) {
  const buckets = await listBuckets(client);
  const entries = [];
  for (const bucket of buckets) {
    entries.push({ bucket, objects: await listObjects(client, bucket.id) });
  }
  return entries;
}

async function logCounts(source, target, manifest) {
  let matches = true;
  for (const table of APP_TABLES) {
    const [sourceCount, targetCount] = await Promise.all([
      getTableCount(source, table),
      getTableCount(target, table),
    ]);
    console.log(`table ${table}: source=${sourceCount} target=${targetCount}`);
    matches &&= sourceCount === targetCount;
  }

  for (const { bucket, objects } of manifest) {
    const targetObjects = await listObjects(target, bucket.id);
    console.log(`bucket ${bucket.id}: source=${objects.length} target=${targetObjects.length}`);
    matches &&= objects.length === targetObjects.length;
  }

  return matches;
}

async function run() {
  const sourceUrl = requireEnvironment("SOURCE_SUPABASE_URL");
  const targetUrl = requireEnvironment("TARGET_SUPABASE_URL");
  if (sourceUrl === targetUrl) throw new Error("Source and target Supabase URLs must differ.");

  const source = createClient(sourceUrl, requireEnvironment("SOURCE_SUPABASE_SERVICE_ROLE_KEY"));
  const target = createClient(targetUrl, requireEnvironment("TARGET_SUPABASE_SERVICE_ROLE_KEY"));
  const apply = process.argv.includes("--apply");
  const manifest = await getStorageManifest(source);

  if (!apply) {
    console.log("Migration dry run. No data will be written.");
    await logCounts(source, target, manifest);
    return;
  }

  for (const table of APP_TABLES) {
    const sourceRows = await getAllRows(source, table);
    await upsertRows(
      target,
      table,
      sourceRows.map((row) => rewriteStorageUrls(row, sourceUrl, targetUrl)),
    );
    console.log(`copied table ${table}: ${sourceRows.length} rows`);
  }

  for (const { bucket, objects } of manifest) {
    await ensureBucket(target, bucket);
    for (const [index, object] of objects.entries()) {
      console.log(`copying bucket ${bucket.id}: object ${index + 1}/${objects.length}`);
      await copyObject(source, target, bucket.id, object);
      console.log(`copied bucket ${bucket.id}: object ${index + 1}/${objects.length}`);
    }
    console.log(`copied bucket ${bucket.id}: ${objects.length} objects`);
  }

  if (!(await logCounts(source, target, manifest))) {
    throw new Error("Migration verification failed: source and target counts differ.");
  }
  console.log("Migration verification succeeded.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : "Supabase migration failed.");
    process.exitCode = 1;
  });
}
