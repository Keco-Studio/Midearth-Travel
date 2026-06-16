import { TourListing } from "@/components/listing/tour-listing";
import { categoryMeta } from "@/data/categories";
import { getToursForCategory } from "@/data/tour-filters";

export const metadata = {
  title: "All Tours | Midearth Travel",
  description: categoryMeta.all.summary,
};

export default function AllToursPage() {
  const meta = categoryMeta.all;

  return (
    <TourListing
      eyebrow="Category"
      title={meta.title}
      summary={meta.summary}
      image={meta.image}
      initialTours={getToursForCategory("all")}
    />
  );
}
