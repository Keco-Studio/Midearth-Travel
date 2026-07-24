"use client";

import { Globe, Mail, Share2 } from "lucide-react";
import { useSiteSettings } from "@/context/site-settings-context";
import { getPublishedFooterLinks } from "@/lib/footer-links";
import { getStringContent, type ContentData } from "@/lib/content-values";

export function Footer({ content = {} }: { content?: ContentData }) {
  const settings = useSiteSettings();
  const brandTitle = getStringContent(content, "brandTitle", "Midearth Travel");
  const brandDescription = getStringContent(
    content,
    "brandDescription",
    "Your one-stop travel solution. TICO certified member serving the community with professionalism and competitive prices.",
  );
  const copyrightText = getStringContent(
    content,
    "copyrightText",
    "© 2026 Midearth Travel Inc. All rights reserved.",
  );
  const { tourLinks, serviceLinks } = getPublishedFooterLinks(content);

  return (
    <footer id="contact" className="border-t border-white/10 bg-[#1A1A17] text-[#f5efe3]">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16 lg:px-8">
        <div className="mb-8 grid gap-8 md:mb-12 md:grid-cols-2 md:gap-12 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-[#f5efe3]">{brandTitle}</h3>
            <p className="text-sm leading-relaxed text-[#f5efe3]/65">
              {brandDescription}
            </p>
            <div className="flex gap-4">
              {[Globe, Share2, Mail, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-[#f5efe3]/50 transition-colors hover:text-[#f5efe3]"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-[#f5efe3]">Tours</h4>
            <ul className="space-y-3 text-sm text-[#f5efe3]/65">
              {tourLinks.map((item) => (
                <li key={item.id}>
                  <a href={item.href} className="transition-colors hover:text-[#f5efe3]">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-[#f5efe3]">Services</h4>
            <ul className="space-y-3 text-sm text-[#f5efe3]/65">
              {serviceLinks.map((item) => (
                <li key={item.id}>
                  <a href={item.href} className="transition-colors hover:text-[#f5efe3]">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-[#f5efe3]">Contact Us</h4>
            <ul className="space-y-3 text-sm text-[#f5efe3]/65">
              <li>
                <a href={settings.primaryPhoneHref} className="transition-colors hover:text-[#f5efe3]">
                  {settings.primaryPhoneLabel}
                </a>
              </li>
              {settings.secondaryPhoneLabel ? (
                <li>
                  <a href={settings.secondaryPhoneHref} className="transition-colors hover:text-[#f5efe3]">
                    {settings.secondaryPhoneLabel}
                  </a>
                </li>
              ) : null}
              <li>
                <a
                  href={settings.emailHref}
                  className="transition-colors hover:text-[#f5efe3]"
                >
                  {settings.emailLabel}
                </a>
              </li>
              <li>
                <span>{settings.officeAddress}</span>
              </li>
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
