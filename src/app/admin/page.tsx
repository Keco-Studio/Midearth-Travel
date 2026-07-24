import { AdminShell } from "@/components/admin-shell";
import { homeModuleSeeds } from "@/data/cms-seed";
import { loadDestinationCategories } from "@/lib/supabase-destination-categories";
import {
  loadHomepageServices,
  loadHomepageTestimonials,
} from "@/lib/supabase-home-collections";
import { loadAdminHomeModules } from "@/lib/supabase-home-content";

export default async function AdminPage() {
  const [homeModules, destinationCategories, services, testimonials] =
    await Promise.all([
      loadAdminHomeModules().catch((error) => {
        console.error("Unable to preload homepage modules", error);
        return homeModuleSeeds;
      }),
      loadDestinationCategories(),
      loadHomepageServices(),
      loadHomepageTestimonials(),
    ]);

  return (
    <AdminShell
      initialDestinationCategories={destinationCategories}
      initialHomeModules={homeModules}
      initialServices={services}
      initialTestimonials={testimonials}
    />
  );
}
