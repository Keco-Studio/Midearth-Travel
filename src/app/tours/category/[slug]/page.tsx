import { notFound } from "next/navigation";
import { TourListing } from "@/components/listing/tour-listing";
import { categoryMeta } from "@/data/categories";
import { filterToursForCategory } from "@/data/tour-filters";
import { getDestinationCategoryTitle } from "@/lib/destination-category-title";
import { loadDestinationCategories } from "@/lib/supabase-destination-categories";
import { loadPublishedTours } from "@/lib/supabase-tours";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const meta = categoryMeta[slug];
  if (!meta) return { title: "Category Not Found" };
  const categories = await loadDestinationCategories();
  const title = getDestinationCategoryTitle(slug, categories);
  return {
    title: `${title} | Midearth Travel`,
    description: meta.summary,
  };
}

export default async function TourCategoryPage({ params }: Props) {
  const { slug } = await params;
  const meta = categoryMeta[slug];
  if (!meta) notFound();

  const [tours, categories] = await Promise.all([
    loadPublishedTours(),
    loadDestinationCategories(),
  ]);
  const title = getDestinationCategoryTitle(slug, categories);

  return (
    <TourListing
      eyebrow="Category"
      title={title}
      summary={meta.summary}
      image={meta.image}
      initialTours={filterToursForCategory(tours, slug)}
      showBrowseSections={slug === "bus-tours"}
      destinationCategories={categories}
    />
  );
}
