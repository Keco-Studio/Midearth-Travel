import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("takes a quote email to Contact Us and pre-fills the form", () => {
  const newsletter = readFileSync(
    new URL("../src/components/newsletter.tsx", import.meta.url),
    "utf8",
  );
  const contactRoute = readFileSync(
    new URL("../src/app/contact/page.tsx", import.meta.url),
    "utf8",
  );
  const contactPage = readFileSync(
    new URL("../src/components/contact/contact-page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(newsletter, /getContactQuoteHref\(undefined, email\)/);
  assert.match(contactRoute, /email\?: string/);
  assert.match(contactRoute, /prefilledEmail=\{email\}/);
  assert.match(contactRoute, /key=\{`\$\{tour \?\? ""\}:\$\{quote \?\? ""\}:\$\{email \?\? ""\}`\}/);
  assert.match(contactPage, /prefilledEmail\?: string/);
  assert.match(contactPage, /email: prefilledEmail \?\? ""/);
  assert.match(contactPage, /requirements: getInitialContactRequirements\(/);
  assert.doesNotMatch(contactPage, /useEffect/);
});

test("aligns the Final CTA button with the email contact column", () => {
  const component = readFileSync(
    new URL("../src/components/final-cta.tsx", import.meta.url),
    "utf8",
  );
  const css = readFileSync(
    new URL("../src/app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(component, /\{primaryButtonText\}/);
  assert.match(component, /className="final-cta-contact-grid"/);
  assert.match(css, /\.final-cta-contact-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*1fr\)/);
  assert.match(css, /\.final-cta-contact-grid\s*\{[\s\S]*row-gap:\s*24px/);
  assert.match(css, /\.final-cta-actions\s*\{[\s\S]*grid-column:\s*2/);
  assert.match(css, /\.final-cta-meta\s*\{[\s\S]*grid-column:\s*1\s*\/\s*-1/);
  assert.match(css, /\.final-cta-actions \.btn-primary\s*\{[\s\S]*padding:\s*18px\s+36px;[\s\S]*font-size:\s*18px/);
});
