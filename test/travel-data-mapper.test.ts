import assert from "node:assert/strict";
import test from "node:test";
import { tours } from "../src/data/tours.ts";
import { mapTravelToursToRecords } from "../src/lib/travel-data-mapper.ts";

test("maps each tour primary image into its CMS record", () => {
  const records = mapTravelToursToRecords();

  assert.equal(records.length, tours.length);
  assert.deepEqual(
    records.map(({ slug, image }) => ({ slug, image })),
    tours.map(({ slug, image }) => ({ slug, image })),
  );
});

test("maps source tour content into editable CMS fields", () => {
  const [record] = mapTravelToursToRecords();
  const [source] = tours;

  assert.equal(record.code, source.code);
  assert.equal(record.departures, source.departures?.join(", "));
  assert.equal(record.highlights, source.tags.join(", "));
  assert.match(record.description, /Day 1:/);
  assert.deepEqual(record.fares, {
    child: "$639",
    single: "$1,699",
    double: "$969",
    triple: "$759",
    quad: "$639",
  });
  assert.equal(record.specialOffer, true);
  assert.equal(record.specialDeals, true);
  assert.equal(record.vacationPackage, false);
  assert.equal(record.travelNewsPackage, false);
  assert.equal(record.busTourPackage, true);
});
