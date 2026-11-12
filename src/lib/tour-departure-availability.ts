export type TourDepartureOption = {
  value: string;
  label: string;
  soldOut: boolean;
};

const SOLD_OUT_PATTERN = /\bsold\s*out\b|售罄/iu;

export function getTourDepartureOptions(
  lang: "en" | "zh",
  departures: readonly string[],
  localizedDepartures: readonly string[],
): TourDepartureOption[] {
  const english = normalizeDepartures(departures);
  const localized = normalizeDepartures(localizedDepartures);
  const selected = lang === "zh" && localized.length > 0 ? localized : english;

  return selected.map((value, index) => {
    const counterpart = lang === "zh" ? english[index] : localized[index];
    const soldOut = hasSoldOutMarker(value) || hasSoldOutMarker(counterpart ?? "");
    const label = soldOut && !hasSoldOutMarker(value)
      ? `${value}${lang === "zh" ? "（售罄）" : " (Sold Out)"}`
      : value;

    return { value, label, soldOut };
  });
}

export function isBookableTourDeparture(
  selection: string,
  options: readonly TourDepartureOption[],
): boolean {
  const normalizedSelection = selection.trim();
  return Boolean(normalizedSelection) && options.some(
    (option) => option.value === normalizedSelection && !option.soldOut,
  );
}

export function requireBookableTourDeparture(
  selection: string,
  options: readonly TourDepartureOption[],
): void {
  if (!isBookableTourDeparture(selection, options)) {
    throw new Error("Select an available departure");
  }
}

function normalizeDepartures(departures: readonly string[]): string[] {
  return departures.map((departure) => departure.trim()).filter(Boolean);
}

function hasSoldOutMarker(value: string): boolean {
  return SOLD_OUT_PATTERN.test(value);
}
