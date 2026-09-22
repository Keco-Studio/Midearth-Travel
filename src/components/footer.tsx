import type { ContentData } from "@/lib/content-values";
import type { DestinationCategory } from "@/lib/destination-categories";
import { loadDestinationCategories } from "@/lib/supabase-destination-categories";
import { FooterContent } from "./footer-content";

export async function Footer({
  content,
  categories,
}: {
  content?: ContentData;
  categories?: DestinationCategory[];
}) {
  return (
    <FooterContent
      categories={categories ?? (await loadDestinationCategories())}
      content={content}
    />
  );
}
