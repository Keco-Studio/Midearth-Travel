import { notFound } from "next/navigation";
import { ServiceDetailPage } from "@/components/services/service-detail-page";
import {
  getServicePage,
  getServicePageSlugs,
  serviceNavItems,
} from "@/data/service-pages";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getServicePageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return {};

  return {
    title: page.metaTitle,
    description: page.metaDescription,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = getServicePage(slug);
  if (!content) notFound();

  return <ServiceDetailPage content={content} navItems={serviceNavItems} />;
}
