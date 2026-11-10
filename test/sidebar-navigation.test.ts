import assert from "node:assert/strict";
import test from "node:test";
import {
  getSidebarNavigation,
  getVisibleHomeModuleItems,
} from "../src/lib/sidebar-navigation.ts";

test("places homepage modules under Homepage Content instead of beside primary items", () => {
  const navigation = getSidebarNavigation("home");
  const contentGroup = navigation.find((group) => group.label === "Content");

  assert.ok(contentGroup);
  assert.deepEqual(
    contentGroup.items.map((item) => item.label),
    ["Homepage Content", "Booking Page", "Contact Us", "Tour Library", "Bookings", "Inquiry Inbox", "Payments"],
  );

  const homepageItem = contentGroup.items[0];
  assert.equal(homepageItem.children.length, 10);
  assert.equal(contentGroup.items[1].children.length, 0);
  assert.equal(contentGroup.items[2].children.length, 0);
  assert.equal(contentGroup.items[3].children.length, 0);
  assert.equal(contentGroup.items[4].children.length, 0);
  assert.equal(contentGroup.items[5].children.length, 0);
  assert.equal(contentGroup.items[6].children.length, 0);
});

test("only shows homepage module children while home workspace is selected", () => {
  assert.equal(getVisibleHomeModuleItems("home").length, 10);
  assert.equal(getVisibleHomeModuleItems(null).length, 0);
});

test("does not show a redundant Global Settings navigation group", () => {
  const navigation = getSidebarNavigation(null);

  assert.deepEqual(navigation.map((group) => group.label), ["Content"]);
  assert.equal(
    navigation.some((group) =>
      group.items.some((item) => item.label === "Global Settings"),
    ),
    false,
  );
});

test("keeps homepage children hidden when Homepage Content is collapsed", () => {
  const navigation = getSidebarNavigation(null);
  const contentGroup = navigation.find((group) => group.label === "Content");

  assert.ok(contentGroup);
  assert.equal(contentGroup.items[0].children.length, 0);
});
