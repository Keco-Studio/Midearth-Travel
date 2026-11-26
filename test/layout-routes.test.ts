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

test("does not expose the redundant Global Settings workspace", () => {
  assert.equal(
    flattenRoutes(layoutRouteConfig.routes).some(
      ({ name }) => name === "Global Settings",
    ),
    false,
  );
  assert.deepEqual(parseLayoutPath("/settings"), {
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

test("routes Contact Us form submissions to the dedicated inquiry inbox", () => {
  const contentRoutes = layoutRouteConfig.routes[0]?.routes ?? [];

  assert.ok(contentRoutes.some((route) => (
    route.path === "/inquiries" &&
    route.name === "Inquiry Inbox" &&
    route.workspace === "inquiries"
  )));
  assert.deepEqual(parseLayoutPath("/inquiries"), { workspace: "inquiries" });
});

test("routes Hot Sales as its own Homepage module before Featured Tours", () => {
  const homepageRoutes = layoutRouteConfig.routes[0]?.routes?.[0]?.routes ?? [];
  const hotSalesIndex = homepageRoutes.findIndex(
    (route) => route.path === "/home/hotSales",
  );
  const featuredIndex = homepageRoutes.findIndex(
    (route) => route.path === "/home/toursSection",
  );

  assert.ok(hotSalesIndex >= 0);
  assert.ok(hotSalesIndex < featuredIndex);
  assert.deepEqual(parseLayoutPath("/home/hotSales"), {
    workspace: "home",
    moduleId: "hotSales",
  });
});

function flattenRoutes(routes: LayoutRoute[]): LayoutRoute[] {
  return routes.flatMap((route) => [route, ...flattenRoutes(route.routes ?? [])]);
}
