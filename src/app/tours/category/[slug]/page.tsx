import { notFound } from "next/navigation";
import { TourListing } from "@/components/listing/tour-listing";
import { categoryMeta } from "@/data/categories";
import { getToursForCategory } from "@/data/tour-filters";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return Object.keys(categoryMeta)
    .filter((slug) => slug !== "all")
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const meta = categoryMeta[slug];
  if (!meta) return { title: "Category Not Found" };
  return {
    title: `${meta.title} | Midearth Travel`,
    description: meta.summary,
  };
}

export default async function TourCategoryPage({ params }: Props) {
  const { slug } = await params;
  const meta = categoryMeta[slug];
  if (!meta) notFound();

  return (
    <TourListing
      eyebrow="Category"
      title={meta.title}
      summary={meta.summary}
      image={meta.image}
      initialTours={getToursForCategory(slug)}
      showBrowseSections={slug === "bus-tours"}
    />
  );
}
