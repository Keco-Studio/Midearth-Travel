import assert from "node:assert/strict";
import test from "node:test";

type CadPriceModule = {
  formatCadAmount?: (amount: number) => string;
  formatCadPrice?: (value: string) => string;
  formatCadCents?: (cents: number) => string;
  parseCadPriceToCents?: (value: string) => number | null;
  formatCurrencyAmount?: (amount: number, currency: string, locale?: string) => string;
};

async function loadCadPriceModule(): Promise<CadPriceModule> {
  try {
    return await import("../src/lib/cad-price.ts") as CadPriceModule;
  } catch {
    return {};
  }
}

test("formats Canadian-dollar values with one consistent prefix", async () => {
  const cadPriceModule = await loadCadPriceModule();
  assert.equal(typeof cadPriceModule.formatCadAmount, "function");
  assert.equal(typeof cadPriceModule.formatCadPrice, "function");
  assert.equal(typeof cadPriceModule.formatCadCents, "function");
  assert.equal(typeof cadPriceModule.formatCurrencyAmount, "function");
  if (!cadPriceModule.formatCadAmount || !cadPriceModule.formatCadPrice || !cadPriceModule.formatCadCents || !cadPriceModule.formatCurrencyAmount) return;

  assert.equal(cadPriceModule.formatCadAmount(1699), "CAD $1,699.00");
  assert.equal(cadPriceModule.formatCadPrice("$1,699"), "CAD $1,699.00");
  assert.equal(cadPriceModule.formatCadPrice("969.5"), "CAD $969.50");
  assert.equal(cadPriceModule.formatCadPrice("CAD $41.00"), "CAD $41.00");
  assert.equal(cadPriceModule.formatCadCents(4100), "CAD $41.00");
  assert.equal(cadPriceModule.formatCurrencyAmount(38, "cad"), "CAD $38.00");
  assert.equal(cadPriceModule.formatCadPrice("Call for quote"), "Call for quote");
  assert.throws(() => cadPriceModule.formatCurrencyAmount!(38, "not-a-currency"), RangeError);
});

test("parses complete legacy fare strings without accepting mixed copy", async () => {
  const { parseCadPriceToCents } = await loadCadPriceModule();
  assert.equal(typeof parseCadPriceToCents, "function");
  if (!parseCadPriceToCents) return;

  assert.equal(parseCadPriceToCents("$1,699"), 169900);
  assert.equal(parseCadPriceToCents("CAD $969.50"), 96950);
  assert.equal(parseCadPriceToCents("from $969"), null);
  assert.equal(parseCadPriceToCents("Call for quote"), null);
});
