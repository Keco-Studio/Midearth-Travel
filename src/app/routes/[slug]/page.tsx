import { notFound } from "next/navigation";
import { TourListing } from "@/components/listing/tour-listing";
import { filterToursForCategory } from "@/data/tour-filters";
import { getRegionBySlug } from "@/data/regions";
import { getDestinationCategoryTitle } from "@/lib/destination-category-title";
import { loadDestinationCategories } from "@/lib/supabase-destination-categories";
import { loadPublishedTours } from "@/lib/supabase-tours";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function normalizeRouteSlug(slug: string): string {
  return slug.trim().replaceAll("_", "-");
}

export async function generateMetadata({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteSlug(rawSlug);
  const region = getRegionBySlug(slug);
  if (!region) return { title: "Region Not Found" };
  const categories = await loadDestinationCategories();
  const title = getDestinationCategoryTitle(slug, categories);
  return {
    title: `${title} Tours | Midearth Travel`,
    description: region.summary,
  };
}

export default async function RouteRegionPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteSlug(rawSlug);
  const region = getRegionBySlug(slug);
  if (!region) notFound();

  const [tours, categories] = await Promise.all([
    loadPublishedTours(),
    loadDestinationCategories(),
  ]);
  const title = getDestinationCategoryTitle(slug, categories);

  return (
    <TourListing
      eyebrow="Region"
      title={title}
      summary={region.summary}
      image={region.image}
      initialTours={filterToursForCategory(tours, slug)}
      destinationCategories={categories}
    />
  );
}
