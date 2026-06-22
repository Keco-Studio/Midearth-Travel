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

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <ToursSection />
      <CategoryGrid />
      <ExploreByMonthSection />
      <AboutSection />
      <TestimonialsSection />
      <FinalCta />
      <Newsletter />
      <Footer />
    </main>
  );
}
