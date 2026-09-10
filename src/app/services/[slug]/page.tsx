import { notFound } from "next/navigation";
import { ServiceDetailPage } from "@/components/services/service-detail-page";
import {
  SERVICE_WHATSAPP_LABEL,
  SERVICE_WHATSAPP_QR,
  serviceToPageContent,
  servicesToNavItems,
} from "@/data/service-pages";
import { getStringContent } from "@/lib/content-values";
import { getHomeModule } from "@/lib/home-content";
import { loadHomepageServices } from "@/lib/supabase-home-collections";
import { loadPublishedHomeModules } from "@/lib/supabase-home-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const services = await loadHomepageServices();
  const service = services.find((item) => item.slug === slug);
  if (!service) return {};

  return {
    title: service.page.metaTitle,
    description: service.page.metaDescription,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [services, modules] = await Promise.all([
    loadHomepageServices(),
    loadPublishedHomeModules(),
  ]);
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();

  const aboutSection = getHomeModule(modules, "aboutSection").data;
  const content = serviceToPageContent(service);
  const sharedSignOff = getStringContent(
    aboutSection,
    "servicePageSignOff",
    content.signOff,
  );

  return (
    <ServiceDetailPage
      content={{
        ...content,
        signOff: sharedSignOff.trim() || content.signOff,
      }}
      navItems={servicesToNavItems(services)}
      whatsappLabel={getStringContent(
        aboutSection,
        "whatsappLabel",
        SERVICE_WHATSAPP_LABEL,
      )}
      whatsappQrImage={getStringContent(
        aboutSection,
        "whatsappQrImage",
        SERVICE_WHATSAPP_QR,
      )}
      backgroundImage={getStringContent(
        aboutSection,
        "servicePageBackgroundImage",
        "",
      )}
    />
  );
}
