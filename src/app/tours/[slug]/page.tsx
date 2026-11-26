import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { TourDetail } from "@/components/tour/tour-detail";
import { loadPublishedTours } from "@/lib/supabase-tours";
import { loadPublishedHomeModules } from "@/lib/supabase-home-content";
import { getHomeModule } from "@/lib/home-content";
import { getPublishedHotSalePromotions } from "@/lib/hot-sales";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const tour = (await loadPublishedTours()).find((entry) => entry.slug === slug);
  if (!tour) return { title: "Tour Not Found" };
  return {
    title: `${tour.pageTitle ?? tour.title} | Midearth Travel`,
    description: tour.description,
  };
}

export default async function TourPage({ params }: Props) {
  const { slug } = await params;
  const [tours, modules] = await Promise.all([
    loadPublishedTours(),
    loadPublishedHomeModules(),
  ]);
  const tour = tours.find((entry) => entry.slug === slug);
  if (!tour) notFound();
  const promotion = getPublishedHotSalePromotions(
    getHomeModule(modules, "hotSales").data,
    tours,
  ).find((entry) => entry.tourSlug === slug);

  return (
    <>
      <TourDetail tour={tour} promotion={promotion} />
      <Footer />
    </>
  );
}
