import { notFound } from "next/navigation";
import { TourDetail } from "@/components/tour/tour-detail";
import { getTourBySlug } from "@/data/tours";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { tours } = await import("@/data/tours");
  return tours.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour) return { title: "Tour Not Found" };
  return {
    title: `${tour.pageTitle ?? tour.title} | Midearth Travel`,
    description: tour.description,
  };
}

export default async function TourPage({ params }: Props) {
  const { slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour) notFound();

  return <TourDetail tour={tour} />;
}
