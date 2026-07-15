import type {
  BookingRecord,
  ContentStatus,
  MediaAsset,
  PaymentRecord,
  TourRecord,
} from "../types/cms.ts";

export type TourStatusCounts = Record<ContentStatus, number>;

export type BookingStatusCounts = Record<BookingRecord["status"], number>;

export type PaymentStatusCounts = Record<PaymentRecord["status"], number>;

export type MediaUsageState = {
  label: string;
  canDelete: boolean;
};

export function getTourStatusCounts(tours: TourRecord[]): TourStatusCounts {
  return tours.reduce<TourStatusCounts>(
    (counts, tour) => {
      counts[tour.status] += 1;
      return counts;
    },
    {
      published: 0,
      draft: 0,
      unpublished: 0,
    },
  );
}

export function getBookingStatusCounts(bookings: BookingRecord[]): BookingStatusCounts {
  return bookings.reduce<BookingStatusCounts>(
    (counts, booking) => {
      counts[booking.status] += 1;
      return counts;
    },
    {
      new: 0,
      contacted: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    },
  );
}

export function getPaymentStatusCounts(payments: PaymentRecord[]): PaymentStatusCounts {
  return payments.reduce<PaymentStatusCounts>(
    (counts, payment) => {
      counts[payment.status] += 1;
      return counts;
    },
    {
      pending: 0,
      paid: 0,
      partial: 0,
      refunded: 0,
      failed: 0,
    },
  );
}

export function getPaymentsForBooking(
  payments: PaymentRecord[],
  bookingId: string,
): PaymentRecord[] {
  return payments.filter((payment) => payment.bookingId === bookingId);
}

export function getMediaUsageState(asset: MediaAsset): MediaUsageState {
  if (asset.usedBy.length === 0) {
    return {
      label: "Not used",
      canDelete: true,
    };
  }

  return {
    label: `Used in ${asset.usedBy.length} ${asset.usedBy.length === 1 ? "place" : "places"}`,
    canDelete: false,
  };
}
