import assert from "node:assert/strict";
import test from "node:test";
import { services } from "../src/data/services.ts";
import {
  mergeServiceRows,
  type ServiceRow,
} from "../src/lib/home-collections.ts";
import * as homeCollections from "../src/lib/home-collections.ts";
import * as servicePages from "../src/data/service-pages.ts";
import {
  FOOTER_SERVICE_LINKS_KEY,
  getPublishedFooterLinks,
  serializeFooterLinks,
} from "../src/lib/footer-links.ts";
import { getHeroFeatureCards } from "../src/lib/hero-content.ts";

test("publishes one combined flight and hotel service instead of separate cards", () => {
  assert.deepEqual(
    services.map(({ id, slug, title, titleZh }) => ({ id, slug, title, titleZh })),
    [
      {
        id: "flights-hotels",
        slug: "flights-hotels",
        title: "Flights & Hotels",
        titleZh: "机票与酒店",
      },
      {
        id: "charters",
        slug: "charters",
        title: "Charters",
        titleZh: undefined,
      },
      {
        id: "travel-insurance",
        slug: "travel-insurance",
        title: "Travel Insurance",
        titleZh: undefined,
      },
      {
        id: "visa-application",
        slug: "visa-application",
        title: "Visa Application",
        titleZh: undefined,
      },
    ],
  );

  const combined = services[0]!;
  assert.match(combined.page.intro, /flights/i);
  assert.match(combined.page.intro, /hotel/i);
  assert.equal(combined.page.quoteLabel, "Flights & Hotels");
  assert.ok(combined.page.deals.length > 0);
});

test("collapses legacy stored flight and hotel rows into one backend record", () => {
  const rows: ServiceRow[] = [
    {
      id: "flights",
      slug: "flights",
      title: "Flights",
      summary: "Flight summary",
      image: "/flights.jpg",
      page_content: {
        title: "FLIGHTS",
        intro: "Custom flight content.",
        signOff: "Thanks",
        disclaimer: "Flight disclaimer",
        quoteLabel: "Flights",
        metaTitle: "Flights",
        metaDescription: "Flights",
        deals: [{ id: "deal-1", route: "Ottawa - Tokyo", priceLabel: "from $999" }],
      },
      sort_order: 1,
      updated_at: "2026-11-10T00:00:00Z",
    },
    {
      id: "hotels",
      slug: "hotels",
      title: "Hotels",
      summary: "Hotel summary",
      image: "/hotels.jpg",
      page_content: {
        title: "HOTELS",
        intro: "Custom hotel content.",
        signOff: "Thanks",
        disclaimer: "",
        quoteLabel: "Hotels",
        metaTitle: "Hotels",
        metaDescription: "Hotels",
        deals: [{ id: "deal-1", route: "Ottawa hotel", priceLabel: "from $199" }],
      },
      sort_order: 2,
      updated_at: "2026-11-10T00:00:00Z",
    },
    {
      id: "charters",
      slug: "charters",
      title: "Charters",
      summary: "Charter summary",
      image: "/charters.jpg",
      page_content: services.find((service) => service.id === "charters")!.page,
      sort_order: 3,
      updated_at: "2026-11-10T00:00:00Z",
    },
  ];

  const result = mergeServiceRows(rows);

  assert.deepEqual(result.map((service) => service.id), ["flights-hotels", "charters"]);
  assert.equal(result[0]?.slug, "flights-hotels");
  assert.equal(result[0]?.title, "Flights & Hotels");
  assert.equal(result[0]?.titleZh, "机票与酒店");
  assert.equal(result[0]?.image, "/flights.jpg");
  assert.equal(
    result[0]?.page.intro,
    "Custom flight content.\n\nCustom hotel content.",
  );
  assert.equal(result[0]?.page.deals[0]?.route, "Ottawa - Tokyo");
  assert.equal(result[0]?.page.deals[1]?.route, "Ottawa hotel");
  assert.equal(new Set(result[0]?.page.deals.map((deal) => deal.id)).size, 2);
});

test("accepts two legacy maximum-length intros only for the combined service", () => {
  const validatesIntro = (
    homeCollections as typeof homeCollections & {
      isServicePageIntroWithinLimit?: (
        serviceId: string,
        page: { intro: string; introZh?: string },
      ) => boolean;
    }
  ).isServicePageIntroWithinLimit;
  const combinedPage = {
    intro: `${"a".repeat(4000)}\n\n${"b".repeat(4000)}`,
    introZh: `${"甲".repeat(4000)}\n\n${"乙".repeat(4000)}`,
  };

  assert.equal(validatesIntro?.("flights-hotels", combinedPage), true);
  assert.equal(validatesIntro?.("charters", { intro: "a".repeat(4001) }), false);
});

test("maps both legacy service URLs to the combined canonical slug", () => {
  const canonicalize = (
    servicePages as typeof servicePages & {
      getCanonicalServiceSlug?: (slug: string) => string;
    }
  ).getCanonicalServiceSlug;

  assert.equal(canonicalize?.("flights"), "flights-hotels");
  assert.equal(canonicalize?.("hotels"), "flights-hotels");
  assert.equal(canonicalize?.("charters"), "charters");
});

test("collapses stored legacy footer links into one combined service link", () => {
  const content = {
    [FOOTER_SERVICE_LINKS_KEY]: serializeFooterLinks([
      { id: "flights", label: "Flights", labelZh: "机票", href: "/services/flights" },
      { id: "hotels", label: "Hotels", labelZh: "酒店", href: "/services/hotels" },
      { id: "charters", label: "Charters", href: "/services/charters" },
      {
        id: "travel-insurance",
        label: "Travel Insurance",
        href: "/services/travel-insurance",
      },
      {
        id: "visa-application",
        label: "Visa Application",
        href: "/services/visa-application",
      },
    ]),
  };

  assert.deepEqual(
    getPublishedFooterLinks(content).serviceLinks.map(({ id, label, href }) => ({
      id,
      label,
      href,
    })),
    [
      {
        id: "flights-hotels",
        label: "Flights & Hotels",
        href: "/services/flights-hotels",
      },
      { id: "charters", label: "Charters", href: "/services/charters" },
      {
        id: "travel-insurance",
        label: "Travel Insurance",
        href: "/services/travel-insurance",
      },
      {
        id: "visa-application",
        label: "Visa Application",
        href: "/services/visa-application",
      },
    ],
  );
});

test("routes the homepage flight shortcut to the combined service", () => {
  assert.equal(getHeroFeatureCards({})[0]?.href, "/services/flights-hotels");
});
