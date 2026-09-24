import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { TourBookingPage } from "@/components/tour/tour-booking-page";
import { getHomeModule } from "@/lib/home-content";
import { getPageBackgroundImage } from "@/lib/page-content";
import { loadPublishedHomeModules } from "@/lib/supabase-home-content";
import { loadPublishedTours } from "@/lib/supabase-tours";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const tour = (await loadPublishedTours()).find((entry) => entry.slug === slug);
  return { title: tour ? `Book ${tour.pageTitle ?? tour.title} | Midearth Travel` : "Tour Not Found" };
}

export default async function TourBookingRoute({ params }: Props) {
  const { slug } = await params;
  const [tours, modules] = await Promise.all([
    loadPublishedTours(),
    loadPublishedHomeModules(),
  ]);
  const tour = tours.find((entry) => entry.slug === slug);
  if (!tour) notFound();

  const content = getHomeModule(modules, "bookingPage").data;
  const backgroundImage = getPageBackgroundImage(
    content,
    getHomeModule(modules, "hero").data,
  );

  return (
    <>
      <TourBookingPage
        tour={tour}
        content={content}
        backgroundImage={backgroundImage}
      />
      <Footer />
    </>
  );
}
