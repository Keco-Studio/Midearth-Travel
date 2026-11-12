import assert from "node:assert/strict";
import test from "node:test";
import {
  getTourDepartureOptions,
  isBookableTourDeparture,
  requireBookableTourDeparture,
} from "../src/lib/tour-departure-availability.ts";

test("marks English and Chinese sold-out departures as unavailable", () => {
  assert.deepEqual(
    getTourDepartureOptions(
      "en",
      ["July 11", "August 1 (Sold Out)", "August 15"],
      ["7 月 11 日", "8 月 1 日（售罄）", "8 月 15 日"],
    ),
    [
      { value: "July 11", label: "July 11", soldOut: false },
      {
        value: "August 1 (Sold Out)",
        label: "August 1 (Sold Out)",
        soldOut: true,
      },
      { value: "August 15", label: "August 15", soldOut: false },
    ],
  );
});

test("propagates a sold-out status across matching localized departures", () => {
  assert.deepEqual(
    getTourDepartureOptions(
      "zh",
      ["July 11", "August 1 (Sold Out)"],
      ["7 月 11 日", "8 月 1 日"],
    ),
    [
      { value: "7 月 11 日", label: "7 月 11 日", soldOut: false },
      { value: "8 月 1 日", label: "8 月 1 日（售罄）", soldOut: true },
    ],
  );
});

test("allows only a configured departure that is not sold out", () => {
  const options = getTourDepartureOptions(
    "en",
    ["July 11", "August 1 - SOLD OUT"],
    [],
  );

  assert.equal(isBookableTourDeparture("July 11", options), true);
  assert.equal(isBookableTourDeparture("August 1 - SOLD OUT", options), false);
  assert.equal(isBookableTourDeparture("August 22", options), false);
  assert.equal(isBookableTourDeparture("", options), false);
});

test("rejects a sold-out or unknown departure before booking persistence", () => {
  const options = getTourDepartureOptions(
    "zh",
    ["July 11", "August 1"],
    ["7 月 11 日", "8 月 1 日（售罄）"],
  );

  assert.doesNotThrow(() => requireBookableTourDeparture("7 月 11 日", options));
  assert.throws(
    () => requireBookableTourDeparture("8 月 1 日（售罄）", options),
    /available departure/i,
  );
  assert.throws(
    () => requireBookableTourDeparture("8 月 15 日", options),
    /available departure/i,
  );
});
