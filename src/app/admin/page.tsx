import { AdminShell } from "@/components/admin-shell";
import { homeModuleSeeds, paymentSeeds } from "@/data/cms-seed";
import { loadBookings } from "@/lib/supabase-bookings";
import { loadDestinationCategories } from "@/lib/supabase-destination-categories";
import {
  loadHomepageServices,
  loadHomepageTestimonials,
} from "@/lib/supabase-home-collections";
import { loadAdminHomeModules } from "@/lib/supabase-home-content";
import { loadGlobalSettings } from "@/lib/supabase-global-settings";
import { withSyncedFinalCtaContactFields } from "@/lib/office-address-sync";
import { loadPaymentOrders } from "@/lib/supabase-payments";
import { loadAdminTours } from "@/lib/supabase-tours";

export default async function AdminPage() {
  const [
    homeModules,
    destinationCategories,
    services,
    testimonials,
    settings,
    payments,
    bookings,
    tours,
  ] = await Promise.all([
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
      loadBookings().catch((error) => {
        console.error("Unable to preload bookings", error);
        return [];
      }),
      loadAdminTours().catch((error) => {
        console.error("Unable to preload tours", error);
        return [];
      }),
    ]);

  return (
    <AdminShell
      initialDestinationCategories={destinationCategories}
      initialHomeModules={withSyncedFinalCtaContactFields(homeModules, settings)}
      initialServices={services}
      initialSettings={settings}
      initialTestimonials={testimonials}
      initialPayments={payments}
      initialBookings={bookings}
      initialTours={tours}
    />
  );
}
