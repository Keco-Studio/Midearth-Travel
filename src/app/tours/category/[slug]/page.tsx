import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { TourListing } from "@/components/listing/tour-listing";
import { categoryMeta } from "@/data/categories";
import { filterToursForCategory } from "@/data/tour-filters";
import { getDestinationCategoryTitle } from "@/lib/destination-category-title";
import { loadDestinationCategories } from "@/lib/supabase-destination-categories";
import { loadPublishedTours } from "@/lib/supabase-tours";
import { getBusToursContent, getBusToursMonthEntries } from "@/lib/bus-tours-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const meta = categoryMeta[slug];
  if (!meta) return { title: "Category Not Found" };
  const categories = await loadDestinationCategories();
  const title = getDestinationCategoryTitle(slug, categories);
  const category = categories.find((item) => item.slug === slug || item.id === slug);
  return {
    title: `${title} | Midearth Travel`,
    description: category?.summary?.trim() || meta.summary,
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
  const localizedTitle = getDestinationCategoryTitle(slug, categories, "zh");
  const category = categories.find((item) => item.slug === slug || item.id === slug);

  return (
    <>
      <TourListing
        eyebrow="Category"
        eyebrowTextKey="category"
        title={title}
        localizedTitle={localizedTitle}
        summary={category?.summary?.trim() || meta.summary}
        localizedSummary={category?.summaryZh?.trim() || undefined}
        image={category?.image?.trim() || meta.image}
        initialTours={filterToursForCategory(tours, slug)}
        publishedTours={tours}
        browseMonths={getBusToursMonthEntries(category?.busContent)}
        browseContent={getBusToursContent(category?.busContent)}
        showBrowseSections={slug === "bus-tours"}
        destinationCategories={categories}
      />
      <Footer categories={categories} />
    </>
  );
}
