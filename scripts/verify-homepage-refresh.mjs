import { readFileSync } from "node:fs";

const files = {
  hero: "src/components/hero.tsx",
  heroCss: "src/components/hero.module.css",
  navbar: "src/components/navbar.tsx",
  tours: "src/components/tours-section.tsx",
  category: "src/components/category-grid.tsx",
  month: "src/components/explore-by-month-section.tsx",
  monthCss: "src/components/listing/browse-sections.module.css",
  about: "src/components/about-section.tsx",
  globals: "src/app/globals.css",
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [
    key,
    readFileSync(path, "utf8"),
  ]),
);

const failures = [];

function expectIncludes(name, haystack, needle) {
  if (!haystack.includes(needle)) {
    failures.push(`${name}: missing ${JSON.stringify(needle)}`);
  }
}

function expectNotIncludes(name, haystack, needle) {
  if (haystack.includes(needle)) {
    failures.push(`${name}: still contains ${JSON.stringify(needle)}`);
  }
}

function expectOrdered(name, haystack, needles) {
  let lastIndex = -1;
  for (const needle of needles) {
    const index = haystack.indexOf(needle);
    if (index === -1) {
      failures.push(`${name}: missing ${JSON.stringify(needle)}`);
      continue;
    }
    if (index < lastIndex) {
      failures.push(`${name}: ${JSON.stringify(needle)} is out of order`);
    }
    lastIndex = index;
  }
}

expectOrdered("hero cards", source.hero, [
  'title: "Flight Booking"',
  'title: "Bus Tours"',
  'title: "Worldwide Travel"',
  'title: "Other Services"',
]);
expectIncludes("hero title", source.heroCss, ".titleMain");
expectIncludes("hero title prominence", source.heroCss, "color: #000");
expectIncludes("hero subtitle", source.hero, "Your One-Stop Travel Solution");
expectIncludes("hero card transparency", source.heroCss, "background: rgba(253, 250, 244, 0.18)");
expectIncludes("hero card border", source.heroCss, "border: 1px solid");
expectIncludes("hero card selected state", source.heroCss, ".card:is(:hover, :focus-visible, :active)");

expectIncludes("navbar destinations label", source.navbar, 'label: "Destinations"');
expectIncludes("navbar destinations href", source.navbar, 'href: "/#destinations"');
expectNotIncludes("navbar routes label", source.navbar, 'label: "Routes"');

expectIncludes("top picks", source.tours, "Our Top Picks");
expectNotIncludes("popular tours", source.tours, "Popular Tours");

expectIncludes("destinations anchor", source.category, 'id="destinations"');
expectIncludes("where title", source.category, "Where to Go");
expectIncludes("where subtitle", source.category, "Explore Destinations");
expectNotIncludes("old where title", source.category, "Where do you want to go?");

expectIncludes("month title", source.month, "When to Go");
expectIncludes("month subtitle", source.month, "Explore by Month");
expectIncludes("month subtitle support", source.month, "subtitle=");

expectIncludes("service title", source.about, "Travel Service");
expectIncludes("service subtitle", source.about, "Everything else, handled.");

expectIncludes("mobile destination full text", source.monthCss, "@media (max-width: 640px)");
expectIncludes("mobile nav wraps", source.globals, "flex-wrap: wrap");
expectIncludes("mobile nav visible", source.globals, ".nav-desktop");

if (failures.length > 0) {
  console.error("Homepage refresh verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Homepage refresh verification passed.");
