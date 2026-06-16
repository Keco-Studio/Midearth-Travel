import { notFound } from "next/navigation";
import { TourListing } from "@/components/listing/tour-listing";
import { getToursForCategory } from "@/data/tour-filters";
import { getRegionBySlug } from "@/data/regions";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { regions } = await import("@/data/regions");
  return regions.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) return { title: "Region Not Found" };
  return {
    title: `${region.title} Tours | Midearth Travel`,
    description: region.summary,
  };
}

export default async function RouteRegionPage({ params }: Props) {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) notFound();

  return (
    <TourListing
      eyebrow="Region"
      title={region.title}
      summary={region.summary}
      image={region.image}
      initialTours={getToursForCategory(slug)}
    />
  );
}
