import {
  loadDestinationCategories,
  saveDestinationCategories,
} from "@/lib/supabase-destination-categories";
import type { DestinationCategory } from "@/lib/destination-categories";

export async function GET() {
  return Response.json({ categories: await loadDestinationCategories() });
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as {
      categories?: Array<Pick<DestinationCategory, "id" | "titleEn" | "titleZh">>;
    };

    if (!Array.isArray(payload.categories)) {
      return Response.json({ error: "Invalid destination category payload" }, { status: 400 });
    }

    return Response.json({
      categories: await saveDestinationCategories(payload.categories),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save destination names" },
      { status: 400 },
    );
  }
}
