const cadNumberFormatter = new Intl.NumberFormat("en-CA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCadCents(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError("CAD cents must be a non-negative safe integer");
  }
  return `CAD $${cadNumberFormatter.format(cents / 100)}`;
}

export function formatCadAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError("CAD amount must be a non-negative number");
  }
  return formatCadCents(Math.round(amount * 100));
}

export function parseCadPriceToCents(value: string): number | null {
  const match = value.trim().match(
    /^(?:CAD\s*)?\$?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/i,
  );
  if (!match) return null;

  const whole = Number(match[1].replaceAll(",", ""));
  const fraction = (match[2] ?? "").padEnd(2, "0");
  const cents = whole * 100 + Number(fraction || 0);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatCadPrice(value: string): string {
  const cents = parseCadPriceToCents(value);
  return cents === null ? value : formatCadCents(cents);
}

export function formatCurrencyAmount(
  amount: number,
  currency: string,
  locale = "en-CA",
): string {
  if (currency.trim().toLowerCase() === "cad") return formatCadAmount(amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}
