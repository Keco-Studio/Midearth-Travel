import { createQuoteRequest } from "@/lib/supabase-bookings";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      requirements?: unknown;
    };
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
    const requirements = typeof payload.requirements === "string" ? payload.requirements.trim() : "";
    if (!name || !phone || !requirements || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ error: "Please complete all required fields." }, { status: 400 });
    }
    const booking = await createQuoteRequest({ name, email, phone, requirements });
    return Response.json({ ok: true, reference: booking.reference });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to submit request" },
      { status: 500 },
    );
  }
}
