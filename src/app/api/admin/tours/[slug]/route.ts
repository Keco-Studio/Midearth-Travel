import { assertAdminRequest } from "@/lib/admin-auth";
import { validateTourRecordHotSale } from "@/lib/hot-sales";
import { revalidatePublicSite } from "@/lib/revalidate-public-site";
import {
  HotSalesConflictError,
  saveTourAndSyncHotSales,
} from "@/lib/supabase-home-content";
import type { TourRecord } from "@/types/cms";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const unauthorized = await assertAdminRequest();
  if (unauthorized) return unauthorized;

  try {
    const { slug } = await params;
    const payload = (await request.json()) as { tour?: TourRecord };

    if (!payload.tour || payload.tour.slug !== slug) {
      return Response.json({ error: "Invalid tour payload" }, { status: 400 });
    }

    validateTourRecordHotSale(payload.tour);
    const { tour, hotSalesModule } = await saveTourAndSyncHotSales(payload.tour);
    revalidatePublicSite({ tourSlug: tour.slug });
    return Response.json({ tour, hotSalesModule });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save tour" },
      { status: error instanceof HotSalesConflictError ? 409 : 400 },
    );
  }
}
