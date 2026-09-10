import { revalidatePath } from "next/cache";

/** Bust public route caches after CMS writes so leaving admin shows fresh content. */
export function revalidatePublicSite(options?: { tourSlug?: string }) {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/tours");
  revalidatePath("/tours/category", "layout");
  revalidatePath("/routes", "layout");
  revalidatePath("/services", "layout");

  if (options?.tourSlug) {
    revalidatePath(`/tours/${options.tourSlug}`);
  }
}
