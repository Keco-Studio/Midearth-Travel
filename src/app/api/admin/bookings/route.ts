import { loadBookings, updateBookingStatus } from "@/lib/supabase-bookings";
import type { BookingStatus } from "@/types/cms";

const STATUS_VALUES: BookingStatus[] = [
  "new",
  "contacted",
  "confirmed",
  "cancelled",
  "completed",
];

export async function GET() {
  try {
    const bookings = await loadBookings();
    return Response.json({ bookings });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load bookings" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as {
      id?: string;
      status?: BookingStatus;
    };
    const id = payload.id?.trim();
    const status = payload.status;

    if (!id || !status || !STATUS_VALUES.includes(status)) {
      return Response.json(
        { error: "Booking id and a valid status are required" },
        { status: 400 },
      );
    }

    const booking = await updateBookingStatus(id, status);
    return Response.json({ booking });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update booking",
      },
      { status: 500 },
    );
  }
}
