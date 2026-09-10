"use client";

import { Globe, Mail, Share2 } from "lucide-react";
import { useFooterContent } from "@/context/footer-content-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { getPublishedFooterLinks } from "@/lib/footer-links";
import { getStringContent, type ContentData } from "@/lib/content-values";

export function Footer({ content }: { content?: ContentData }) {
  const settings = useSiteSettings();
  const sharedContent = useFooterContent();
  const resolved =
    content && Object.keys(content).length > 0 ? content : sharedContent;

  const brandTitle = getStringContent(resolved, "brandTitle", "Midearth Travel");
  const brandDescription = getStringContent(
    resolved,
    "brandDescription",
    "Your one-stop travel solution. TICO certified member serving the community with professionalism and competitive prices.",
  );
  const copyrightText = getStringContent(
    resolved,
    "copyrightText",
    "© 2026 Midearth Travel Inc. All rights reserved.",
  );
  const { tourLinks, serviceLinks } = getPublishedFooterLinks(resolved);

  const socialLinks = [
    {
      id: "website",
      Icon: Globe,
      href: getStringContent(resolved, "socialWebsiteUrl", "").trim(),
      label: "Website",
    },
    {
      id: "facebook",
      Icon: Share2,
      href: getStringContent(resolved, "socialFacebookUrl", "").trim(),
      label: "Facebook",
    },
    {
      id: "email",
      Icon: Mail,
      href:
        getStringContent(resolved, "socialEmailUrl", "").trim() ||
        settings.emailHref,
      label: "Email",
    },
    {
      id: "other",
      Icon: Share2,
      href: getStringContent(resolved, "socialOtherUrl", "").trim(),
      label: "Social",
    },
  ].filter((item) => item.href && item.href !== "#");

  return (
    <footer id="contact" className="border-t border-white/10 bg-[#1A1A17] text-[#f5efe3]">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16 lg:px-8">
        <div className="mb-8 grid gap-8 md:mb-12 md:grid-cols-2 md:gap-12 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-[#f5efe3]">{brandTitle}</h3>
            <p className="text-sm leading-relaxed text-[#f5efe3]/65">
              {brandDescription}
            </p>
            {socialLinks.length > 0 ? (
              <div className="flex gap-4">
                {socialLinks.map(({ id, Icon, href, label }) => (
                  <a
                    key={id}
                    href={href}
                    aria-label={label}
                    className="text-[#f5efe3]/50 transition-colors hover:text-[#f5efe3]"
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            ) : null}
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
