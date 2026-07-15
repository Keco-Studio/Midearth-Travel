import assert from "node:assert/strict";
import test from "node:test";
import {
  layoutRouteConfig,
  parseLayoutPath,
  type LayoutRoute,
} from "../src/lib/layout-routes.ts";

test("does not expose a Media Library route", () => {
  assert.equal(flattenRoutes(layoutRouteConfig.routes).some(({ name }) => name === "Media Library"), false);
});

test("falls back to Homepage Content for the removed media path", () => {
  assert.deepEqual(parseLayoutPath("/media"), {
    workspace: "home",
    moduleId: "navbar",
  });
});

function flattenRoutes(routes: LayoutRoute[]): LayoutRoute[] {
  return routes.flatMap((route) => [route, ...flattenRoutes(route.routes ?? [])]);
}
