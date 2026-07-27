import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultTourIncluded,
  defaultTourNotIncluded,
  tours,
} from "../src/data/tours.ts";
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
  assert.equal(record.description, source.description);
  assert.doesNotMatch(record.description, /Day 1:/);
  assert.equal(record.departureCity, source.departureCity);
  assert.equal(
    record.admissions,
    source.policies?.find(({ title }) => title === "Admissions")?.content,
  );
  assert.equal(
    record.cancellation,
    source.policies?.find(({ title }) => title === "Cancellation")?.content,
  );
  assert.equal(
    record.importantNotice,
    source.policies?.find(({ title }) => title === "Important notice")?.content,
  );
  assert.equal(record.included, defaultTourIncluded.join("\n"));
  assert.equal(record.notIncluded, defaultTourNotIncluded.join("\n"));
  assert.deepEqual(record.essentials, {
    departureTime: source.essentials?.departureTime ?? "",
    meetingPlace: source.essentials?.meetingPlace ?? "",
    localizedMeetingPlace: "",
    hotels: source.essentials?.hotels ?? "",
    localizedHotels: "",
    escortedCoach: source.essentials?.escortedCoach ?? "",
    localizedEscortedCoach: "",
  });
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
