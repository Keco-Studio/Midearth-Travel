import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import postcss, { type Rule } from "postcss";

const css = readFileSync(
  new URL("../src/components/hero.module.css", import.meta.url),
  "utf8",
);
const root = postcss.parse(css);

function declarationsFor(selector: string): Map<string, string> {
  const rule = root.nodes.find(
    (node): node is Rule => node.type === "rule" && node.selector === selector,
  );

  assert.ok(rule, `expected ${selector} CSS rule`);

  return new Map(
    rule.nodes.flatMap((node) =>
      node.type === "decl" ? [[node.prop, node.value] as const] : [],
    ),
  );
}

test("uses lighter, more open typography for the Chinese hero heading", () => {
  const title = declarationsFor(".titleMain:lang(zh)");
  const subtitle = declarationsFor(".subtitle:lang(zh)");

  assert.match(title.get("font-family") ?? "", /ZCOOL XiaoWei/);
  assert.equal(title.get("font-weight"), "400");
  assert.match(title.get("letter-spacing") ?? "", /^0\.0[6-9]em$/);

  assert.match(subtitle.get("font-family") ?? "", /ZCOOL XiaoWei/);
  assert.equal(subtitle.get("font-weight"), "400");
  assert.match(subtitle.get("letter-spacing") ?? "", /^0\.0[4-8]em$/);
});
