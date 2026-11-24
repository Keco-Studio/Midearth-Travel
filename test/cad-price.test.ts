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
  const module = await loadCadPriceModule();
  assert.equal(typeof module.formatCadAmount, "function");
  assert.equal(typeof module.formatCadPrice, "function");
  assert.equal(typeof module.formatCadCents, "function");
  assert.equal(typeof module.formatCurrencyAmount, "function");
  if (!module.formatCadAmount || !module.formatCadPrice || !module.formatCadCents || !module.formatCurrencyAmount) return;

  assert.equal(module.formatCadAmount(1699), "CAD $1,699.00");
  assert.equal(module.formatCadPrice("$1,699"), "CAD $1,699.00");
  assert.equal(module.formatCadPrice("969.5"), "CAD $969.50");
  assert.equal(module.formatCadPrice("CAD $41.00"), "CAD $41.00");
  assert.equal(module.formatCadCents(4100), "CAD $41.00");
  assert.equal(module.formatCurrencyAmount(38, "cad"), "CAD $38.00");
  assert.equal(module.formatCadPrice("Call for quote"), "Call for quote");
  assert.throws(() => module.formatCurrencyAmount!(38, "not-a-currency"), RangeError);
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
