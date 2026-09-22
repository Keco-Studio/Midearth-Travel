import assert from "node:assert/strict";
import test from "node:test";
import {
  FOOTER_SERVICE_LINKS_KEY,
  footerServiceLinkSeeds,
  getFooterLinkEditorData,
  getCategoryFooterLinks,
  getPublishedFooterLinks,
  serializeFooterLinks,
} from "../src/lib/footer-links.ts";
import { destinationCategorySeeds } from "../src/lib/destination-categories.ts";
import { homeModuleSeeds } from "../src/data/cms-seed.ts";
import { canonicalizeHomeModule } from "../src/lib/home-content.ts";

test("footer links retain only the editable service column", () => {
  assert.deepEqual(getFooterLinkEditorData({}), {
    serviceLinks: footerServiceLinkSeeds,
  });
});

test("derives all six Footer tour links from Where to Go categories", () => {
  assert.deepEqual(
    getCategoryFooterLinks([...destinationCategorySeeds].reverse(), "en").map(
      ({ label, href }) => ({ label, href }),
    ),
    [
      { label: "North America", href: "/routes/north-america" },
      { label: "Asia", href: "/routes/asia" },
      { label: "Europe", href: "/routes/europe" },
      { label: "Sun Destinations", href: "/routes/sun-destinations" },
      { label: "Bus Tours", href: "/tours/category/bus-tours" },
      { label: "Vacation Packages", href: "/tours/category/vacation-packages" },
    ],
  );
});

test("uses configured Chinese category names for Footer tour links", () => {
  assert.deepEqual(
    getCategoryFooterLinks(destinationCategorySeeds, "zh").map(({ label }) => label),
    ["北美", "亚洲", "欧洲", "阳光度假目的地", "巴士旅行团", "度假套餐"],
  );
});

test("footer services omit empty and unsupported CMS destinations", () => {
  const content = {
    [FOOTER_SERVICE_LINKS_KEY]: serializeFooterLinks([
      { id: "custom-service", label: "Custom Service", href: "/#about" },
      { id: "empty", label: "", href: "" },
      { id: "unsupported", label: "Custom Tours", href: "/tours/custom" },
    ]),
  };

  assert.deepEqual(getPublishedFooterLinks(content), {
    serviceLinks: [
      { id: "custom-service", label: "Custom Service", href: "/#about" },
    ],
  });
});

test("preserves stored footer service links through canonicalization before publishing", () => {
  const footer = homeModuleSeeds.find((module) => module.id === "footer");
  assert.ok(footer);

  const serviceLinksData = serializeFooterLinks([
    { id: "air", label: "Air tickets", href: "/services/flights" },
    { id: "invalid", label: "Dead link", href: "/tours/custom" },
  ]);
  const canonical = canonicalizeHomeModule({
    ...footer,
    data: { ...footer.data, [FOOTER_SERVICE_LINKS_KEY]: serviceLinksData },
  });

  assert.equal(canonical.data[FOOTER_SERVICE_LINKS_KEY], serviceLinksData);
  assert.deepEqual(getPublishedFooterLinks(canonical.data), {
    serviceLinks: [{ id: "air", label: "Air tickets", href: "/services/flights" }],
  });
});
