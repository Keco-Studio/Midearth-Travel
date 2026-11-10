import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import postcss, { type Rule } from "postcss";

const css = readFileSync(
  new URL("../src/components/hero.module.css", import.meta.url),
  "utf8",
);
const root = postcss.parse(css);

function findRule(selector: string): Rule | undefined {
  return root.nodes.find(
    (node): node is Rule => node.type === "rule" && node.selector === selector,
  );
}

function ruleFor(selector: string): Rule {
  const rule = findRule(selector);

  assert.ok(rule, `expected ${selector} CSS rule`);
  return rule;
}

function declarationsFor(selector: string): Map<string, string> {
  const declarations = new Map<string, string>();

  for (const node of ruleFor(selector).nodes) {
    if (node.type === "decl") {
      declarations.set(node.prop, node.value);
    }
  }

  return declarations;
}

test("keeps the hero statistics free of a blurred background panel", () => {
  const stats = declarationsFor(".stats");
  const foreground = declarationsFor(".stat");

  assert.equal(findRule(".stats::before") === undefined, true);
  assert.equal(stats.has("background"), false);
  assert.equal(stats.has("backdrop-filter"), false);
  assert.equal(stats.has("filter"), false);
  assert.equal(foreground.has("backdrop-filter"), false);
  assert.equal(foreground.has("filter"), false);
});

test("keeps the hero statistics above the gradient with legible text contrast", () => {
  const stats = declarationsFor(".stats");
  const value = declarationsFor(".statValue");
  const label = declarationsFor(".statLabel");

  assert.equal(stats.get("position"), "relative");
  assert.match(stats.get("z-index") ?? "", /^[3-9]\d*$/);
  assert.match(value.get("font-weight") ?? "", /^(?:[5-9]00|bold)$/);
  assert.match(label.get("font-weight") ?? "", /^(?:[5-9]00|bold)$/);
  assert.match(value.get("text-shadow") ?? "", /rgba\(10, 29, 55,/);
  assert.match(label.get("text-shadow") ?? "", /rgba\(10, 29, 55,/);
});
