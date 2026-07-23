import { TourListing } from "@/components/listing/tour-listing";
import { categoryMeta } from "@/data/categories";
import { filterToursForCategory } from "@/data/tour-filters";
import { loadPublishedTours } from "@/lib/supabase-tours";

export const metadata = {
  title: "All Tours | Midearth Travel",
  description: categoryMeta.all.summary,
};

export default async function AllToursPage() {
  const meta = categoryMeta.all;
  const tours = await loadPublishedTours();

  return (
    <TourListing
      eyebrow="Category"
      title={meta.title}
      summary={meta.summary}
      image={meta.image}
      initialTours={filterToursForCategory(tours, "all")}
    />
  );
}
