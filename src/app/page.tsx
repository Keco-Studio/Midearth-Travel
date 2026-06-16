import { AboutSection } from "@/components/about-section";
import { CategoryGrid } from "@/components/category-grid";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { Newsletter } from "@/components/newsletter";
import { PackagesSection } from "@/components/packages-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { ToursSection } from "@/components/tours-section";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <CategoryGrid />
      <ToursSection />
      <AboutSection />
      <TestimonialsSection />
      <PackagesSection />
      <Newsletter />
      <Footer />
    </main>
  );
}
