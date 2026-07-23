import { loadAdminTours } from "@/lib/supabase-tours";

export async function GET() {
  try {
    return Response.json({ tours: await loadAdminTours() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load tours" },
      { status: 500 },
    );
  }
}
