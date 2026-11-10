import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import postcss, { type AtRule, type Rule } from "postcss";
import ts from "typescript";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

function mediaDeclarations(
  params: string,
  selector: string,
): Map<string, string> {
  const media = postcss.parse(css).nodes.find(
    (node): node is AtRule =>
      node.type === "atrule" && node.name === "media" && node.params === params,
  );
  assert.ok(media, `expected @media ${params}`);

  const rule = media.nodes?.find(
    (node): node is Rule => node.type === "rule" && node.selector === selector,
  );
  assert.ok(rule, `expected ${selector} inside @media ${params}`);

  return new Map(
    rule.nodes.flatMap((node) =>
      node.type === "decl" ? [[node.prop, node.value] as const] : [],
    ),
  );
}

test("keeps desktop navigation centered between the brand and actions", () => {
  assert.match(css, /\.header-inner\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+minmax\(0,\s*1fr\);/);
  assert.match(css, /\.nav-desktop\s*\{[\s\S]*justify-self:\s*center;/);
  assert.doesNotMatch(css, /\.nav-desktop\s*\{[\s\S]*margin-left:\s*auto;/);
});

test("links every public header logo to the homepage", () => {
  const source = readFileSync(new URL("../src/components/navbar.tsx", import.meta.url), "utf8");
  const sourceFile = ts.createSourceFile(
    "navbar.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const logoLinks: Array<{ component: string; href: string | undefined }> = [];

  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(sourceFile) === "BrandLogo") {
      const parent = node.parent;
      const href = ts.isJsxElement(parent) && parent.openingElement.tagName.getText(sourceFile) === "Link"
        ? parent.openingElement.attributes.properties.find(
            (attribute): attribute is ts.JsxAttribute =>
              ts.isJsxAttribute(attribute) && attribute.name.getText(sourceFile) === "href",
          )?.initializer?.getText(sourceFile)
        : undefined;

      logoLinks.push({ component: parent.getText(sourceFile), href });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  assert.equal(logoLinks.length, 2, "expected the main header and mobile drawer logos");
  for (const logoLink of logoLinks) {
    assert.equal(logoLink.href, '"/"', `${logoLink.component} must link to the homepage`);
  }
});

test("uses a single-row mobile header with the full phone number and drawer access", () => {
  assert.equal(mediaDeclarations("(max-width: 1024px)", ".nav-desktop").get("display"), "none");
  assert.equal(mediaDeclarations("(max-width: 1024px)", ".hamburger").get("display"), "flex");
  assert.equal(mediaDeclarations("(max-width: 1024px)", ".header-contact").get("display"), "flex");

  assert.equal(mediaDeclarations("(max-width: 560px)", ".header-phone-label").get("display"), "inline");
});

test("renders the primary phone as a callable mobile header action", () => {
  const source = readFileSync(new URL("../src/components/navbar.tsx", import.meta.url), "utf8");

  assert.match(source, /href=\{phoneHref\}/);
  assert.match(source, /className="header-phone-link"/);
  assert.match(source, /className="header-phone-label"/);
});
