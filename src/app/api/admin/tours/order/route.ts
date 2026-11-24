import { assertAdminRequest } from "@/lib/admin-auth";
import { revalidatePublicSite } from "@/lib/revalidate-public-site";
import { parseTourOrderInput } from "@/lib/tour-order";
import { saveTourOrder } from "@/lib/supabase-tours";

export async function PUT(request: Request) {
  const unauthorized = await assertAdminRequest();
  if (unauthorized) return unauthorized;

  try {
    const orderedSlugs = parseTourOrderInput(await request.json());
    const tours = await saveTourOrder(orderedSlugs);
    revalidatePublicSite();
    return Response.json({ tours });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save tour order" },
      { status: 400 },
    );
  }
}
