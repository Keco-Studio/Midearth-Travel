"use client";

import { useFooterContent } from "@/context/footer-content-context";
import { useSiteSettings } from "@/context/site-settings-context";
import {
  getCategoryFooterLinks,
  getPublishedFooterLinks,
} from "@/lib/footer-links";
import type { ContentData } from "@/lib/content-values";
import type { DestinationCategory } from "@/lib/destination-categories";
import { useLang } from "@/context/lang-context";
import { getLocalizedContent, getLocalizedStaticText } from "@/lib/localized-content";

export function FooterContent({
  categories,
  content,
}: {
  categories: DestinationCategory[];
  content?: ContentData;
}) {
  const settings = useSiteSettings();
  const { lang } = useLang();
  const sharedContent = useFooterContent();
  const resolved =
    content && Object.keys(content).length > 0 ? content : sharedContent;
  const brandTitle = getLocalizedContent(resolved, "brandTitle", lang, "Midearth Travel");
  const brandDescription = getLocalizedContent(
    resolved,
    "brandDescription",
    lang,
    "Your one-stop travel solution. TICO certified member serving the community with professionalism and competitive prices.",
  );
  const copyrightText = getLocalizedContent(
    resolved,
    "copyrightText",
    lang,
    "© 2026 Midearth Travel Inc. All rights reserved.",
  );
  const tourLinks = getCategoryFooterLinks(categories, lang);
  const serviceLinks = getPublishedFooterLinks(resolved, lang).serviceLinks;

  return (
    <footer id="contact" className="border-t border-white/10 bg-[#1A1A17] text-[#f5efe3]">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16 lg:px-8">
        <div className="mb-8 grid gap-8 md:mb-12 md:grid-cols-2 md:gap-12 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-[#f5efe3]">{brandTitle}</h3>
            <p className="text-sm leading-relaxed text-[#f5efe3]/65">{brandDescription}</p>
          </div>

          <FooterColumn heading={getLocalizedStaticText(lang, "tours")} links={tourLinks} />
          <FooterColumn heading={getLocalizedStaticText(lang, "services")} links={serviceLinks} />

          <div>
            <h4 className="mb-4 font-semibold text-[#f5efe3]">{getLocalizedStaticText(lang, "contactUs")}</h4>
            <ul className="space-y-3 text-sm text-[#f5efe3]/65">
              <li><span>{settings.primaryPhoneLabel}</span></li>
              {settings.secondaryPhoneLabel ? <li><span>{settings.secondaryPhoneLabel}</span></li> : null}
              <li><span>{settings.emailLabel}</span></li>
              <li><span>{lang === "zh" && settings.officeAddressZh.trim() ? settings.officeAddressZh : settings.officeAddress}</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-sm text-[#f5efe3]/50">
          <p>{copyrightText}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ heading, links }: { heading: string; links: { id: string; label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="mb-4 font-semibold text-[#f5efe3]">{heading}</h4>
      <ul className="space-y-3 text-sm text-[#f5efe3]/65">
        {links.map((item) => (
          <li key={item.id}>
            <a href={item.href} className="transition-colors hover:text-[#f5efe3]">{item.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
