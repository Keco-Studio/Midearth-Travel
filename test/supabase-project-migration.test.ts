import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_TABLES,
  rewriteStorageUrls,
} from "../scripts/migrate-supabase-project.mjs";

test("covers every application table during a Supabase project migration", () => {
  assert.deepEqual(APP_TABLES, [
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
  ]);
});

test("rewrites only nested public Storage URLs from the source project", () => {
  const sourceUrl = "https://source.supabase.co";
  const targetUrl = "https://target.supabase.co";
  const result = rewriteStorageUrls(
    {
      image: "https://source.supabase.co/storage/v1/object/public/homepage-media/hero.jpg",
      nested: [
        { pdf: "https://source.supabase.co/storage/v1/object/public/tour-media/files/guide.pdf" },
        "https://example.com/unchanged.jpg",
      ],
    },
    sourceUrl,
    targetUrl,
  );

  assert.deepEqual(result, {
    image: "https://target.supabase.co/storage/v1/object/public/homepage-media/hero.jpg",
    nested: [
      { pdf: "https://target.supabase.co/storage/v1/object/public/tour-media/files/guide.pdf" },
      "https://example.com/unchanged.jpg",
    ],
  });
});
