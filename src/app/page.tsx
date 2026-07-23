import { AboutSection } from "@/components/about-section";
import { CategoryGrid } from "@/components/category-grid";
import { ExploreByMonthSection } from "@/components/explore-by-month-section";
import { FinalCta } from "@/components/final-cta";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { Newsletter } from "@/components/newsletter";
import { TestimonialsSection } from "@/components/testimonials-section";
import { ToursSection } from "@/components/tours-section";
import { getBooleanContent } from "@/lib/content-values";
import { getHomeModule } from "@/lib/home-content";
import { loadDestinationCategories } from "@/lib/supabase-destination-categories";
import {
  loadHomepageServices,
  loadHomepageTestimonials,
} from "@/lib/supabase-home-collections";
import { loadPublishedHomeModules } from "@/lib/supabase-home-content";
import { loadPublishedTours } from "@/lib/supabase-tours";

export default async function Home() {
  const [
    modules,
    publishedTours,
    destinationCategories,
    homepageServices,
    homepageTestimonials,
  ] = await Promise.all([
    loadPublishedHomeModules(),
    loadPublishedTours(),
    loadDestinationCategories(),
    loadHomepageServices(),
    loadHomepageTestimonials(),
  ]);
  const navbar = getHomeModule(modules, "navbar").data;
  const hero = getHomeModule(modules, "hero").data;
  const toursSection = getHomeModule(modules, "toursSection").data;
  const categoryGrid = getHomeModule(modules, "categoryGrid").data;
  const exploreByMonth = getHomeModule(modules, "exploreByMonth").data;
  const aboutSection = getHomeModule(modules, "aboutSection").data;
  const testimonialContent = getHomeModule(modules, "testimonials").data;
  const finalCta = getHomeModule(modules, "finalCta").data;
  const newsletter = getHomeModule(modules, "newsletter").data;
  const footer = getHomeModule(modules, "footer").data;

  return (
    <main className="min-h-screen">
      <Navbar content={navbar} />
      <Hero content={hero} />
      <ToursSection content={toursSection} tours={publishedTours} />
      <CategoryGrid content={categoryGrid} categories={destinationCategories} />
      {getBooleanContent(exploreByMonth, "isVisible", true) ? (
        <ExploreByMonthSection content={exploreByMonth} />
      ) : null}
      {getBooleanContent(aboutSection, "isVisible", true) ? (
        <AboutSection content={aboutSection} services={homepageServices} />
      ) : null}
      {getBooleanContent(testimonialContent, "isVisible", true) ? (
        <TestimonialsSection
          content={testimonialContent}
          testimonials={homepageTestimonials}
        />
      ) : null}
      <FinalCta content={finalCta} />
      <Newsletter content={newsletter} />
      <Footer content={footer} />
    </main>
  );
}
