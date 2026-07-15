import assert from "node:assert/strict";
import test from "node:test";
import {
  getBookingStatusCounts,
  getMediaUsageState,
  getPaymentStatusCounts,
  getPaymentsForBooking,
  getTourStatusCounts,
} from "../src/lib/workspace-view-models.ts";
import { mapTravelToursToRecords } from "../src/lib/travel-data-mapper.ts";
import type { BookingRecord, MediaAsset, PaymentRecord, TourRecord } from "../src/types/cms.ts";

test("counts tour records by status", () => {
  const baseTour = mapTravelToursToRecords()[0];
  const tours: TourRecord[] = [
    {
      ...baseTour,
      slug: "published-tour",
      title: "Published Tour",
      image: "/published-tour.jpg",
      region: "Canada",
      duration: "5 days",
      tourType: "Group Tour",
      status: "published",
      updatedAt: "2026-07-06T09:00:00Z",
    },
    {
      ...baseTour,
      slug: "draft-tour",
      title: "Draft Tour",
      image: "/draft-tour.jpg",
      region: "Europe",
      duration: "7 days",
      tourType: "Bus Tour",
      status: "draft",
      updatedAt: "2026-07-06T09:00:00Z",
    },
  ];

  assert.deepEqual(getTourStatusCounts(tours), {
    published: 1,
    draft: 1,
    unpublished: 0,
  });
});

test("marks media with published usage as protected", () => {
  const asset: MediaAsset = {
    id: "media_001",
    fileName: "hero.jpg",
    type: "image",
    url: "/hero.jpg",
    sizeLabel: "1 MB",
    usedBy: ["Hero", "Footer"],
    uploadedAt: "2026-07-06T09:00:00Z",
  };

  assert.deepEqual(getMediaUsageState(asset), {
    label: "Used in 2 places",
    canDelete: false,
  });
});

test("counts booking records by status", () => {
  const bookings: BookingRecord[] = [
    {
      id: "bk_001",
      reference: "BK-1",
      status: "new",
      source: "phone",
      customerName: "A",
      createdAt: "2026-07-07T00:00:00Z",
      updatedAt: "2026-07-07T00:00:00Z",
    },
    {
      id: "bk_002",
      reference: "BK-2",
      status: "confirmed",
      source: "tour_email",
      customerName: "B",
      createdAt: "2026-07-07T00:00:00Z",
      updatedAt: "2026-07-07T00:00:00Z",
    },
    {
      id: "bk_003",
      reference: "BK-3",
      status: "new",
      source: "quote_request",
      customerName: "C",
      createdAt: "2026-07-07T00:00:00Z",
      updatedAt: "2026-07-07T00:00:00Z",
    },
  ];

  assert.deepEqual(getBookingStatusCounts(bookings), {
    new: 2,
    contacted: 0,
    confirmed: 1,
    cancelled: 0,
    completed: 0,
  });
});

test("counts payment records by status", () => {
  const payments: PaymentRecord[] = [
    {
      id: "pay_001",
      reference: "PAY-1",
      bookingId: "bk_001",
      bookingReference: "BK-1",
      customerName: "A",
      amount: 100,
      currency: "CAD",
      status: "paid",
      method: "card",
      type: "deposit",
      description: "Deposit",
      createdAt: "2026-07-07T00:00:00Z",
      updatedAt: "2026-07-07T00:00:00Z",
    },
    {
      id: "pay_002",
      reference: "PAY-2",
      bookingId: "bk_001",
      bookingReference: "BK-1",
      customerName: "A",
      amount: 200,
      currency: "CAD",
      status: "pending",
      method: "bank_transfer",
      type: "balance",
      description: "Balance",
      createdAt: "2026-07-07T00:00:00Z",
      updatedAt: "2026-07-07T00:00:00Z",
    },
    {
      id: "pay_003",
      reference: "PAY-3",
      bookingId: "bk_002",
      bookingReference: "BK-2",
      customerName: "B",
      amount: 50,
      currency: "CAD",
      status: "failed",
      method: "card",
      type: "deposit",
      description: "Failed deposit",
      createdAt: "2026-07-07T00:00:00Z",
      updatedAt: "2026-07-07T00:00:00Z",
    },
  ];

  assert.deepEqual(getPaymentStatusCounts(payments), {
    pending: 1,
    paid: 1,
    partial: 0,
    refunded: 0,
    failed: 1,
  });
});

test("filters payments by booking id", () => {
  const payments: PaymentRecord[] = [
    {
      id: "pay_001",
      reference: "PAY-1",
      bookingId: "bk_001",
      bookingReference: "BK-1",
      customerName: "A",
      amount: 100,
      currency: "CAD",
      status: "paid",
      method: "card",
      type: "deposit",
      description: "Deposit",
      createdAt: "2026-07-07T00:00:00Z",
      updatedAt: "2026-07-07T00:00:00Z",
    },
    {
      id: "pay_002",
      reference: "PAY-2",
      bookingId: "bk_002",
      bookingReference: "BK-2",
      customerName: "B",
      amount: 200,
      currency: "CAD",
      status: "pending",
      method: "bank_transfer",
      type: "balance",
      description: "Balance",
      createdAt: "2026-07-07T00:00:00Z",
      updatedAt: "2026-07-07T00:00:00Z",
    },
  ];

  assert.equal(getPaymentsForBooking(payments, "bk_001").length, 1);
  assert.equal(getPaymentsForBooking(payments, "bk_001")[0]?.id, "pay_001");
});
