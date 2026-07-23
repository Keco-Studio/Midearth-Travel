import { loadAdminHomeModules } from "@/lib/supabase-home-content";

export async function GET() {
  try {
    const modules = await loadAdminHomeModules();
    return Response.json({ modules });
  } catch (error) {
    return Response.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load homepage modules";
}
