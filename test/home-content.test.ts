import assert from "node:assert/strict";
import test from "node:test";
import { homeModuleSeeds } from "../src/data/cms-seed.ts";
import {
  canonicalizeHomeModule,
  createDraftHomeModuleRow,
  createPublishedHomeModuleRow,
  getBooleanContent,
  getStringContent,
  mergeHomeModuleRows,
  toHomeModuleRow,
  type HomeModuleRow,
} from "../src/lib/home-content.ts";

const heroSeed = homeModuleSeeds.find((module) => module.id === "hero");

if (!heroSeed) {
  throw new Error("Hero seed is required for tests");
}

const storedHero: HomeModuleRow = {
  id: "hero",
  module_index: 2,
  name: "Hero",
  description: "Stored hero",
  status: "draft",
  published_version: 3,
  draft_version: 4,
  fields: heroSeed.fields,
  published_data: {
    ...heroSeed.data,
    titleMainEn: "Published title",
  },
  draft_data: {
    ...heroSeed.data,
    titleMainEn: "Draft title",
  },
  updated_at: "2026-07-23T10:00:00.000Z",
};

test("merges stored rows over the fixed seed registry", () => {
  const modules = mergeHomeModuleRows([storedHero], "published");
  const hero = modules.find((module) => module.id === "hero");

  assert.equal(modules.length, homeModuleSeeds.length);
  assert.equal(modules[0].id, "navbar");
  assert.equal(hero?.description, heroSeed.description);
  assert.equal(hero?.data.titleMainEn, "Published title");
});

test("uses draft data for the admin view without changing published data", () => {
  const draftHero = mergeHomeModuleRows([storedHero], "draft").find(
    (module) => module.id === "hero",
  );
  const publishedHero = mergeHomeModuleRows([storedHero], "published").find(
    (module) => module.id === "hero",
  );

  assert.equal(draftHero?.data.titleMainEn, "Draft title");
  assert.equal(publishedHero?.data.titleMainEn, "Published title");
});

test("serializes seed modules into initial Supabase rows", () => {
  const row = toHomeModuleRow(heroSeed);

  assert.equal(row.id, "hero");
  assert.deepEqual(row.draft_data, heroSeed.data);
  assert.deepEqual(row.published_data, heroSeed.data);
  assert.equal(row.module_index, 2);
});

test("keeps monthly destination data as one editor-managed field", () => {
  const exploreByMonth = homeModuleSeeds.find(
    (module) => module.id === "exploreByMonth",
  )!;
  const fieldKeys = exploreByMonth.fields.map((field) => field.key);

  assert.ok(fieldKeys.includes("monthsData"));
  assert.ok(!fieldKeys.includes("monthsDataEn"));
  assert.ok(!fieldKeys.includes("monthsDataZh"));
});

test("reads typed values and falls back when stored data has the wrong type", () => {
  const data = {
    title: "Stored title",
    visible: true,
    invalidTitle: false,
    invalidVisible: "yes",
  };

  assert.equal(getStringContent(data, "title", "Fallback"), "Stored title");
  assert.equal(getStringContent(data, "invalidTitle", "Fallback"), "Fallback");
  assert.equal(getBooleanContent(data, "visible", false), true);
  assert.equal(getBooleanContent(data, "invalidVisible", false), false);
});

test("saving a draft preserves the published homepage data", () => {
  const editedModule = {
    ...heroSeed,
    data: {
      ...heroSeed.data,
      titleMainEn: "New draft title",
    },
  };
  const row = createDraftHomeModuleRow(storedHero, editedModule, "2026-07-23T11:00:00.000Z");

  assert.equal(row.status, "draft");
  assert.equal(row.draft_version, 5);
  assert.equal(row.draft_data?.titleMainEn, "New draft title");
  assert.equal(row.published_data.titleMainEn, "Published title");
});

test("publishing promotes the saved draft and increments the published version", () => {
  const row = createPublishedHomeModuleRow(storedHero, "2026-07-23T12:00:00.000Z");

  assert.equal(row.status, "published");
  assert.equal(row.published_version, 4);
  assert.equal(row.draft_version, null);
  assert.equal(row.published_data.titleMainEn, "Draft title");
  assert.equal(row.draft_data?.titleMainEn, "Draft title");
});

test("canonicalizes saved modules against the fixed seed schema", () => {
  const candidate = {
    ...heroSeed,
    name: "Client controlled name",
    fields: [
      ...heroSeed.fields,
      { key: "script", label: "Script", type: "text" as const },
    ],
    data: {
      ...heroSeed.data,
      titleMainEn: "Canonical title",
      script: "alert(1)",
    },
  };
  const canonical = canonicalizeHomeModule(candidate);

  assert.equal(canonical.name, heroSeed.name);
  assert.deepEqual(canonical.fields, heroSeed.fields);
  assert.equal(canonical.data.titleMainEn, "Canonical title");
  assert.equal(canonical.data.script, undefined);
});

test("normalizes legacy homepage copy into its English localization field", () => {
  const canonical = canonicalizeHomeModule({
    ...heroSeed,
    data: { titleMain: "Legacy homepage title" },
  });

  assert.equal(canonical.data.titleMainEn, "Legacy homepage title");
  assert.equal(canonical.data.titleMainZh, "");
  assert.equal(canonical.status, "published");
});

test("includes paired localized fields for the service page sign-off", () => {
  const about = homeModuleSeeds.find((module) => module.id === "aboutSection");

  assert.ok(about?.fields.some((field) => field.key === "servicePageSignOffEn"));
  assert.ok(about?.fields.some((field) => field.key === "servicePageSignOffZh"));
  assert.equal(about?.data.servicePageSignOffEn, "Thanks");
  assert.equal(about?.data.servicePageSignOffZh, "");
});

test("includes editable localized contact-line copy for the quote request module", () => {
  const newsletter = homeModuleSeeds.find((module) => module.id === "newsletter");

  assert.ok(newsletter?.fields.some((field) => field.key === "contactLineEn"));
  assert.ok(newsletter?.fields.some((field) => field.key === "contactLineZh"));
  assert.match(String(newsletter?.data.contactLineEn), /\{\{primaryPhone\}\}/);
  assert.equal(newsletter?.data.contactLineZh, "");
});

test("uses the CMS Chinese Footer defaults when stored legacy fields are blank", () => {
  const footer = homeModuleSeeds.find((module) => module.id === "footer")!;
  const result = mergeHomeModuleRows(
    [
      {
        id: "footer",
        module_index: footer.index,
        name: footer.name,
        description: footer.description,
        status: "published",
        published_version: 1,
        draft_version: null,
        fields: footer.fields,
        published_data: {
          ...footer.data,
          brandTitleZh: "",
          brandDescriptionZh: "",
          copyrightTextZh: "",
        },
        draft_data: null,
        updated_at: "2026-09-24T00:00:00.000Z",
      },
    ],
    "published",
  ).find((module) => module.id === "footer");

  assert.equal(result?.data.brandTitleZh, "中环旅游");
  assert.equal(result?.data.brandDescriptionZh, "一站式旅行服务。TICO 认证成员，以专业服务和具竞争力的价格服务社区。");
  assert.equal(result?.data.copyrightTextZh, "© 2026 中环旅游。版权所有。");
});

test("uses the CMS Chinese Final CTA button default when legacy content is blank", () => {
  const finalCta = homeModuleSeeds.find((module) => module.id === "finalCta")!;
  const result = mergeHomeModuleRows(
    [
      {
        id: "finalCta",
        module_index: finalCta.index,
        name: finalCta.name,
        description: finalCta.description,
        status: "published",
        published_version: 1,
        draft_version: null,
        fields: finalCta.fields,
        published_data: { ...finalCta.data, primaryButtonTextZh: "" },
        draft_data: null,
        updated_at: "2026-09-24T00:00:00.000Z",
      },
    ],
    "published",
  ).find((module) => module.id === "finalCta");

  assert.equal(result?.data.primaryButtonTextZh, "联系我们");
});

test("registers localized booking and contact page modules with independently editable backgrounds", () => {
  const bookingPage = homeModuleSeeds.find((module) => module.id === "bookingPage");
  const contactPage = homeModuleSeeds.find((module) => module.id === "contactPage");

  assert.equal(bookingPage?.fields.find((field) => field.key === "backgroundImage")?.type, "image");
  assert.equal(contactPage?.fields.find((field) => field.key === "backgroundImage")?.type, "image");
  assert.ok(bookingPage?.fields.some((field) => field.key === "bookEn"));
  assert.ok(bookingPage?.fields.some((field) => field.key === "bookZh"));
  assert.ok(contactPage?.fields.some((field) => field.key === "formTitleEn"));
  assert.ok(contactPage?.fields.some((field) => field.key === "formTitleZh"));
  assert.equal(bookingPage?.data.bookZh, "立即预订");
  assert.equal(contactPage?.data.formTitleZh, "申请报价");
});

test("restores the previous Chinese page copy when persisted booking and contact fields are blank", () => {
  const bookingPage = homeModuleSeeds.find((module) => module.id === "bookingPage")!;
  const contactPage = homeModuleSeeds.find((module) => module.id === "contactPage")!;
  const modules = mergeHomeModuleRows(
    [
      {
        id: "bookingPage",
        module_index: bookingPage.index,
        name: bookingPage.name,
        description: bookingPage.description,
        status: "published",
        published_version: 1,
        draft_version: null,
        fields: bookingPage.fields,
        published_data: { ...bookingPage.data, bookZh: "", noPriceZh: "" },
        draft_data: null,
        updated_at: "2026-09-24T00:00:00.000Z",
      },
      {
        id: "contactPage",
        module_index: contactPage.index,
        name: contactPage.name,
        description: contactPage.description,
        status: "published",
        published_version: 1,
        draft_version: null,
        fields: contactPage.fields,
        published_data: { ...contactPage.data, formTitleZh: "", hoursTextZh: "" },
        draft_data: null,
        updated_at: "2026-09-24T00:00:00.000Z",
      },
    ],
    "published",
  );

  assert.equal(modules.find((module) => module.id === "bookingPage")?.data.bookZh, "立即预订");
  assert.equal(modules.find((module) => module.id === "bookingPage")?.data.noPriceZh, "此行程暂不支持在线支付，请联系我们获取报价。");
  assert.equal(modules.find((module) => module.id === "contactPage")?.data.formTitleZh, "申请报价");
  assert.equal(modules.find((module) => module.id === "contactPage")?.data.hoursTextZh, "周一至周五 10:00-17:00\n周六、周日需预约");
});

test("rejects invalid required, typed, and image values before persistence", () => {
  assert.throws(
    () =>
      canonicalizeHomeModule({
        ...heroSeed,
        data: { ...heroSeed.data, titleMainEn: "" },
      }),
    /Main title is required/,
  );
  assert.throws(
    () =>
      canonicalizeHomeModule({
        ...homeModuleSeeds.find((module) => module.id === "exploreByMonth")!,
        data: {
          ...homeModuleSeeds.find((module) => module.id === "exploreByMonth")!.data,
          isVisible: "yes",
        },
      }),
    /Show on homepage must be a boolean/,
  );
  assert.throws(
    () =>
      canonicalizeHomeModule({
        ...heroSeed,
        data: { ...heroSeed.data, backgroundImage: "javascript:alert(1)" },
      }),
    /Background image must use a supported image URL/,
  );
});
