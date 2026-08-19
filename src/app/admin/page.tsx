import { AdminShell } from "@/components/admin-shell";
import { homeModuleSeeds, paymentSeeds } from "@/data/cms-seed";
import { loadDestinationCategories } from "@/lib/supabase-destination-categories";
import {
  loadHomepageServices,
  loadHomepageTestimonials,
} from "@/lib/supabase-home-collections";
import { loadAdminHomeModules } from "@/lib/supabase-home-content";
import { loadGlobalSettings } from "@/lib/supabase-global-settings";
import { loadPaymentOrders } from "@/lib/supabase-payments";

export default async function AdminPage() {
  const [homeModules, destinationCategories, services, testimonials, settings, payments] =
    await Promise.all([
      loadAdminHomeModules().catch((error) => {
        console.error("Unable to preload homepage modules", error);
        return homeModuleSeeds;
      }),
      loadDestinationCategories(),
      loadHomepageServices(),
      loadHomepageTestimonials(),
      loadGlobalSettings(),
      loadPaymentOrders().catch((error) => {
        console.error("Unable to preload Stripe payments", error);
        return paymentSeeds;
      }),
    ]);

  return (
    <AdminShell
      initialDestinationCategories={destinationCategories}
      initialHomeModules={homeModules}
      initialServices={services}
      initialSettings={settings}
      initialTestimonials={testimonials}
      initialPayments={payments}
    />
  );
}
