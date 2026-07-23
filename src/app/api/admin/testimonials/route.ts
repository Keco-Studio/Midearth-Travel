import {
  loadHomepageTestimonials,
  saveHomepageTestimonials,
} from "@/lib/supabase-home-collections";
import type { Testimonial } from "@/data/testimonials";

export async function GET() {
  return Response.json({ testimonials: await loadHomepageTestimonials() });
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as { testimonials?: Testimonial[] };
    if (!Array.isArray(payload.testimonials)) {
      return Response.json({ error: "Invalid testimonial payload" }, { status: 400 });
    }
    return Response.json({
      testimonials: await saveHomepageTestimonials(payload.testimonials),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save testimonials" },
      { status: 400 },
    );
  }
}
