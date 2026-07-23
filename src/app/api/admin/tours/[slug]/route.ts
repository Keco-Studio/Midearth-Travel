import { saveTour } from "@/lib/supabase-tours";
import type { TourRecord } from "@/types/cms";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const payload = (await request.json()) as { tour?: TourRecord };

    if (!payload.tour || payload.tour.slug !== slug) {
      return Response.json({ error: "Invalid tour payload" }, { status: 400 });
    }

    return Response.json({ tour: await saveTour(payload.tour) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save tour" },
      { status: 400 },
    );
  }
}
