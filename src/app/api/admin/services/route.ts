import { loadHomepageServices, saveHomepageServices } from "@/lib/supabase-home-collections";
import type { Service } from "@/data/services";

export async function GET() {
  return Response.json({ services: await loadHomepageServices() });
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as { services?: Service[] };
    if (!Array.isArray(payload.services)) {
      return Response.json({ error: "Invalid service payload" }, { status: 400 });
    }
    return Response.json({ services: await saveHomepageServices(payload.services) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save services" },
      { status: 400 },
    );
  }
}
