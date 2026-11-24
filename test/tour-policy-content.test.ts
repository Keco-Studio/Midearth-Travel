import assert from "node:assert/strict";
import test from "node:test";

type PolicyContentModule = {
  splitTourPolicyContent?: (value: string) => string[];
};

async function loadPolicyContentModule(): Promise<PolicyContentModule> {
  try {
    return await import("../src/lib/tour-policy-content.ts") as PolicyContentModule;
  } catch {
    return {};
  }
}

test("turns CMS policy line breaks into readable content blocks", async () => {
  const { splitTourPolicyContent } = await loadPolicyContentModule();
  assert.equal(typeof splitTourPolicyContent, "function");
  if (!splitTourPolicyContent) return;

  assert.deepEqual(
    splitTourPolicyContent(" First condition\r\nSecond condition\n\n Third condition "),
    ["First condition", "Second condition", "Third condition"],
  );
  assert.deepEqual(splitTourPolicyContent("  "), []);
});
