import { ContactPage } from "@/components/contact/contact-page";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { getHomeModule } from "@/lib/home-content";
import { getPageBackgroundImage } from "@/lib/page-content";
import { loadPublishedHomeModules } from "@/lib/supabase-home-content";

export const dynamic = "force-dynamic";

export default async function ContactRoute({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string; quote?: string; email?: string }>;
}) {
  const [{ tour, quote, email }, modules] = await Promise.all([
    searchParams,
    loadPublishedHomeModules(),
  ]);
  const content = getHomeModule(modules, "contactPage").data;
  const backgroundImage = getPageBackgroundImage(
    content,
    getHomeModule(modules, "hero").data,
  );
  return (
    <>
      <Navbar />
      <ContactPage
        key={`${tour ?? ""}:${quote ?? ""}:${email ?? ""}`}
        tourTitle={tour}
        quoteRequested={quote === "1"}
        prefilledEmail={email}
        content={content}
        backgroundImage={backgroundImage}
      />
      <Footer />
    </>
  );
}
