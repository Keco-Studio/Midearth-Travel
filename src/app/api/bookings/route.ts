import { validateTourBookingInput } from "@/lib/payment-domain";
import { createTourBooking } from "@/lib/supabase-bookings";
import { loadPublishedTours } from "@/lib/supabase-tours";
import {
  getTourDepartureOptions,
  requireBookableTourDeparture,
} from "@/lib/tour-departure-availability";

export async function POST(request: Request) {
  try {
    const input = validateTourBookingInput(await request.json());
    const tour = (await loadPublishedTours()).find((entry) => entry.slug === input.tourSlug);
    if (!tour) return Response.json({ error: "Tour not found" }, { status: 400 });
    requireBookableTourDeparture(
      input.departureDate,
      getTourDepartureOptions(
        input.locale,
        tour.departures ?? [],
        tour.localizedDepartures ?? [],
      ),
    );

    const booking = await createTourBooking({
      ...input,
      tourTitle: tour.title,
      tourCode: tour.code,
    });
    return Response.json({ bookingId: booking.id, reference: booking.reference });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create tour booking";
    const status = /required|adult|children|valid|not found|available departure/i.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
