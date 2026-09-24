import { validateTourBookingInput } from "@/lib/payment-domain";
import { createTourBooking } from "@/lib/supabase-bookings";
import { loadPublishedTours } from "@/lib/supabase-tours";

export async function POST(request: Request) {
  try {
    const input = validateTourBookingInput(await request.json());
    const tour = (await loadPublishedTours()).find((entry) => entry.slug === input.tourSlug);
    if (!tour) return Response.json({ error: "Tour not found" }, { status: 400 });

    const booking = await createTourBooking({
      ...input,
      tourTitle: tour.title,
      tourCode: tour.code,
    });
    return Response.json({ bookingId: booking.id, reference: booking.reference });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create tour booking";
    const status = /required|adult|children|valid|not found/i.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
