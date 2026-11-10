import test from "node:test";
import assert from "node:assert/strict";
import { defaultAddOnSelections, calculateAddOnTotal, validateAddOnSelections, type TourAddOn } from "../src/lib/tour-add-ons.ts";

const addOns: TourAddOn[] = [{
  id: "cruise", name: "River Cruise", localizedName: "河流游船", category: "activity", icon: "ticket", required: false,
  ticketTypes: [{ id: "adult", label: "Adult", localizedLabel: "成人", priceCents: 3000 }],
}, {
  id: "fee", name: "Service Fee", localizedName: "服务费", category: "service_fee", icon: "fee", required: true,
  ticketTypes: [{ id: "adult", label: "Adult", localizedLabel: "成人", priceCents: 1000 }],
}];

test("defaults required add-ons selected and optional add-ons unchecked", () => {
  assert.deepEqual(defaultAddOnSelections(addOns), [{ addOnId: "fee", ticketTypeId: "adult", quantity: 1 }]);
});

test("validates selections and calculates configured tax-inclusive total", () => {
  const selections = [{ addOnId: "cruise", ticketTypeId: "adult", quantity: 2 }, { addOnId: "fee", ticketTypeId: "adult", quantity: 1 }];
  assert.deepEqual(validateAddOnSelections(addOns, selections), selections);
  assert.equal(calculateAddOnTotal(addOns, selections), 7000);
});

test("rejects unknown ticket types and omitted required add-ons", () => {
  assert.throws(() => validateAddOnSelections(addOns, [{ addOnId: "cruise", ticketTypeId: "bad", quantity: 1 }]), /ticket type|required/i);
});
