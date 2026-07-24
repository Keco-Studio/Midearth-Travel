import assert from "node:assert/strict";
import test from "node:test";
import {
  getHeroBroadcastContent,
  getHeroFeatureCards,
} from "../src/lib/hero-content.ts";

test("hero broadcast uses editable label and one message per line", () => {
  assert.deepEqual(
    getHeroBroadcastContent({
      liveLabel: "Now",
      liveMessages: "First update\n\nSecond update",
    }),
    {
      label: "Now",
      messages: ["First update", "Second update"],
    },
  );
});

test("hero cards use one editable description and image icon", () => {
  const cards = getHeroFeatureCards({
    card1IconImage: "https://example.com/cruise-icon.png",
    card1Title: "Cruise Booking",
    card1Description: "Ocean journeys worldwide",
    card1Link: "/tours/cruises",
  });

  assert.deepEqual(cards[0], {
    id: "hero-card-1",
    fallbackIcon: "Plane",
    iconImage: "https://example.com/cruise-icon.png",
    title: "Cruise Booking",
    description: "Ocean journeys worldwide",
    href: "/tours/cruises",
  });
  assert.equal(cards[1]?.fallbackIcon, "Bus");
  assert.equal(cards[1]?.iconImage, "");
  assert.equal(cards.length, 4);
});
