import assert from "node:assert/strict";
import test from "node:test";

type TourDescriptionContentModule = {
  splitTourDescriptionContent?: (value: string) => string[];
};

async function loadTourDescriptionContentModule(): Promise<TourDescriptionContentModule> {
  try {
    return await import("../src/lib/tour-description-content.ts") as TourDescriptionContentModule;
  } catch {
    return {};
  }
}

test("turns itinerary description line breaks into visible frontend blocks", async () => {
  const { splitTourDescriptionContent } = await loadTourDescriptionContentModule();
  assert.equal(typeof splitTourDescriptionContent, "function");
  if (!splitTourDescriptionContent) return;

  assert.deepEqual(
    splitTourDescriptionContent(
      "After breakfast, travel along the coast.\n\nAdmire Percé Rock.\nContinue to Gaspé.",
    ),
    [
      "After breakfast, travel along the coast.",
      "Admire Percé Rock.",
      "Continue to Gaspé.",
    ],
  );
});
