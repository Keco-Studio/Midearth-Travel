import assert from "node:assert/strict";
import test from "node:test";
import {
  assignTourToExploreMonth,
  findExploreMonthForTour,
  parseMonthEntries,
  selectTourForExploreDestination,
  serializeMonthEntries,
} from "../src/lib/explore-by-month.ts";

test("retains a Chinese monthly destination description", () => {
  const months = parseMonthEntries(
    serializeMonthEntries([
      {
        month: "Jan",
        label: "January",
        destinations: [
          {
            id: "japan",
            name: "Japan",
            region: "East Asia",
            tag: "Culture",
            desc: "English description",
            localizedDesc: "中文简介",
            image: "/japan.jpg",
          },
        ],
      },
    ]),
  );

  assert.equal(months[0]?.destinations[0]?.localizedDesc, "中文简介");
});

const linkedMonths = parseMonthEntries(
  serializeMonthEntries([
    {
      month: "Jun",
      label: "June",
      destinations: [
        {
          id: "coast-june",
          tourSlug: "coast",
          name: "",
          region: "",
          tag: "",
          desc: "June coast description",
          localizedDesc: "六月海岸说明",
          image: "",
          href: "",
        },
      ],
    },
    {
      month: "Jul",
      label: "July",
      destinations: [],
    },
  ]),
  { completeMonths: true },
);

test("moves one linked tour to a single month and clears its old descriptions", () => {
  const moved = assignTourToExploreMonth(linkedMonths, "coast", "Jul");
  const assignments = moved
    .flatMap((entry) => entry.destinations)
    .filter((destination) => destination.tourSlug === "coast");

  assert.equal(findExploreMonthForTour(moved, "coast"), "Jul");
  assert.equal(assignments.length, 1);
  assert.equal(assignments[0]?.desc, "");
  assert.equal(assignments[0]?.localizedDesc, "");
});

test("keeps descriptions when a linked tour remains in the same month", () => {
  const unchanged = assignTourToExploreMonth(linkedMonths, "coast", "Jun");
  const assignment = unchanged
    .find((entry) => entry.month === "Jun")
    ?.destinations.find((destination) => destination.tourSlug === "coast");

  assert.equal(assignment?.desc, "June coast description");
  assert.equal(assignment?.localizedDesc, "六月海岸说明");
});

test("removes a linked tour when its month is cleared", () => {
  const removed = assignTourToExploreMonth(linkedMonths, "coast", "");

  assert.equal(findExploreMonthForTour(removed, "coast"), "");
  assert.equal(
    removed.flatMap((entry) => entry.destinations).some(
      (destination) => destination.tourSlug === "coast",
    ),
    false,
  );
});

test("selecting an assigned tour in another month moves it into the target row", () => {
  const withTargetRow = linkedMonths.map((entry) =>
    entry.month === "Jul"
      ? {
          ...entry,
          destinations: [
            {
              id: "july-target",
              tourSlug: "",
              name: "",
              region: "",
              tag: "",
              desc: "Placeholder copy",
              localizedDesc: "占位说明",
              image: "",
              href: "",
            },
          ],
        }
      : entry,
  );
  const moved = selectTourForExploreDestination(
    withTargetRow,
    "Jul",
    "july-target",
    "coast",
  );
  const assignments = moved
    .flatMap((entry) => entry.destinations)
    .filter((destination) => destination.tourSlug === "coast");

  assert.equal(findExploreMonthForTour(moved, "coast"), "Jul");
  assert.equal(assignments.length, 1);
  assert.equal(assignments[0]?.id, "july-target");
  assert.equal(assignments[0]?.desc, "");
  assert.equal(assignments[0]?.localizedDesc, "");
});

test("reselecting the same tour in the same row preserves its descriptions", () => {
  const unchanged = selectTourForExploreDestination(
    linkedMonths,
    "Jun",
    "coast-june",
    "coast",
  );
  const assignment = unchanged
    .find((entry) => entry.month === "Jun")
    ?.destinations.find((destination) => destination.id === "coast-june");

  assert.equal(assignment?.desc, "June coast description");
  assert.equal(assignment?.localizedDesc, "六月海岸说明");
});
