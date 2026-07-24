import assert from "node:assert/strict";
import test from "node:test";
import {
  FOOTER_SERVICE_LINKS_KEY,
  FOOTER_TOUR_LINKS_KEY,
  footerServiceLinkSeeds,
  footerTourLinkSeeds,
  getFooterLinkEditorData,
  getPublishedFooterLinks,
  serializeFooterLinks,
} from "../src/lib/footer-links.ts";

test("footer links fall back to the fixed seed columns", () => {
  assert.deepEqual(getFooterLinkEditorData({}), {
    tourLinks: footerTourLinkSeeds,
    serviceLinks: footerServiceLinkSeeds,
  });
});

test("footer links serialize editable labels and routes", () => {
  const content = {
    [FOOTER_TOUR_LINKS_KEY]: serializeFooterLinks([
      { id: "custom-tour", label: "Custom Tours", href: "/tours/custom" },
    ]),
    [FOOTER_SERVICE_LINKS_KEY]: serializeFooterLinks([
      { id: "custom-service", label: "Custom Service", href: "/#about" },
      { id: "empty", label: "", href: "" },
    ]),
  };

  assert.deepEqual(getPublishedFooterLinks(content), {
    tourLinks: [
      { id: "custom-tour", label: "Custom Tours", href: "/tours/custom" },
    ],
    serviceLinks: [
      { id: "custom-service", label: "Custom Service", href: "/#about" },
    ],
  });
});
