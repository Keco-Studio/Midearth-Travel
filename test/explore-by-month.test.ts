import assert from "node:assert/strict";
import test from "node:test";
import { parseMonthEntries, serializeMonthEntries } from "../src/lib/explore-by-month.ts";

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
