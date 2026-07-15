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
    ["Homepage Content", "Tour Library", "Bookings", "Payments"],
  );

  const homepageItem = contentGroup.items[0];
  assert.equal(homepageItem.children.length, 10);
  assert.equal(contentGroup.items[1].children.length, 0);
  assert.equal(contentGroup.items[2].children.length, 0);
  assert.equal(contentGroup.items[3].children.length, 0);
});

test("only shows homepage module children while home workspace is selected", () => {
  assert.equal(getVisibleHomeModuleItems("home").length, 10);
  assert.equal(getVisibleHomeModuleItems(null).length, 0);
});

test("keeps system items separate from content items", () => {
  const navigation = getSidebarNavigation(null);
  const systemGroup = navigation.find((group) => group.label === "System");

  assert.ok(systemGroup);
  assert.deepEqual(
    systemGroup.items.map((item) => item.label),
    ["Global Settings"],
  );
  assert.ok(systemGroup.items.every((item) => item.children.length === 0));
});

test("keeps homepage children hidden when Homepage Content is collapsed", () => {
  const navigation = getSidebarNavigation(null);
  const contentGroup = navigation.find((group) => group.label === "Content");

  assert.ok(contentGroup);
  assert.equal(contentGroup.items[0].children.length, 0);
});
