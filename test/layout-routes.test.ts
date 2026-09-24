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

test("routes standalone booking and contact page editors before Tour Library", () => {
  const contentRoutes = layoutRouteConfig.routes[0]?.routes ?? [];

  assert.deepEqual(
    contentRoutes.slice(0, 4).map((route) => [route.path, route.name, route.workspace]),
    [
      ["/home", "Homepage Content", "home"],
      ["/booking-page", "Booking Page", "bookingPage"],
      ["/contact-page", "Contact Us", "contactPage"],
      ["/tours", "Tour Library", "tours"],
    ],
  );
  assert.deepEqual(parseLayoutPath("/booking-page"), { workspace: "bookingPage" });
  assert.deepEqual(parseLayoutPath("/contact-page"), { workspace: "contactPage" });
});

function flattenRoutes(routes: LayoutRoute[]): LayoutRoute[] {
  return routes.flatMap((route) => [route, ...flattenRoutes(route.routes ?? [])]);
}
