"use client";

import Link from "next/link";
import { useSiteSettings } from "@/context/site-settings-context";
import { site } from "@/data/site";
import { getStringContent, type ContentData } from "@/lib/content-values";
import { useLang } from "@/context/lang-context";
import { getLocalizedContent, getLocalizedStaticText } from "@/lib/localized-content";
import { getContactQuoteHref } from "@/lib/contact-prefill";

export function FinalCta({ content = {} }: { content?: ContentData }) {
  const settings = useSiteSettings();
  const { lang } = useLang();
  const image = getStringContent(content, "image", "/final-cta-travel-flatlay.jpg");
  const eyebrow = getLocalizedContent(content, "eyebrow", lang, "Get in touch");
  const title = getLocalizedContent(content, "title", lang, "Tell us where, we'll figure out how.");
  const description = getLocalizedContent(
    content,
    "description",
    lang,
    "Use the form, or call the office. Either reaches a real desk in downtown Ottawa.",
  );
  const primaryButtonText = getLocalizedContent(
    content,
    "primaryButtonText",
    lang,
    "Contact us",
  );
  const phoneLabel =
    settings.primaryPhoneLabel.trim() ||
    getStringContent(content, "phoneLabel", "").trim() ||
    site.phone;
  const emailLabel =
    settings.emailLabel.trim() ||
    getStringContent(content, "emailLabel", "").trim() ||
    site.email;
  const officeAddress =
    (lang === "zh"
      ? settings.officeAddressZh.trim() ||
        getStringContent(content, "officeAddressZh", "").trim()
      : settings.officeAddress.trim() ||
        getStringContent(content, "officeAddress", "").trim()) ||
    settings.officeAddress.trim() ||
    "Bronson Avenue, Ottawa, Ontario";
  const primaryButtonLink = getContactQuoteHref();

  return (
    <section className="final-cta">
      <div className="container">
        <div className="final-cta-inner">
          <div className="final-cta-img">
            <img src={image} alt="" />
          </div>
          <div className="final-cta-body">
            <div className="eyebrow">— {eyebrow}</div>
            <h2 className="section-title">{title}</h2>
            <p>{description}</p>
            <div className="final-cta-contact-grid">
              <div className="final-cta-actions">
                <Link href={primaryButtonLink}>
                  <button type="button" className="btn btn-lg btn-primary">
                    {primaryButtonText}
                  </button>
                </Link>
              </div>
              <div className="final-cta-meta">
                <div>
                  <span className="muted">{getLocalizedStaticText(lang, "phone")}</span>
                  <br />
                  {phoneLabel}
                </div>
                <div>
                  <span className="muted">{getLocalizedStaticText(lang, "email")}</span>
                  <br />
                  {emailLabel}
                </div>
                <div>
                  <span className="muted">{getLocalizedStaticText(lang, "office")}</span>
                  <br />
                  {officeAddress}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
