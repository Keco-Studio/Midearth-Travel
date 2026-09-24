"use client";

import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { ServiceQuoteForm } from "@/components/services/service-quote-form";
import {
  SERVICE_BACKGROUND_IMAGE,
  SERVICE_WHATSAPP_LABEL,
  SERVICE_WHATSAPP_QR,
  type ServiceNavItem,
  type ServicePageContent,
} from "@/data/service-pages";
import { getLocalizedServicePage } from "@/data/services";
import { useSiteSettings } from "@/context/site-settings-context";
import { useLang } from "@/context/lang-context";
import { type ContentData } from "@/lib/content-values";
import { getLocalizedContent, getLocalizedStaticText } from "@/lib/localized-content";
import styles from "./service-page.module.css";

export function ServiceDetailPage({
  content,
  navItems,
  whatsappLabel = SERVICE_WHATSAPP_LABEL,
  whatsappQrImage = SERVICE_WHATSAPP_QR,
  backgroundImage,
  servicePageContent,
}: {
  content: ServicePageContent;
  navItems: ServiceNavItem[];
  whatsappLabel?: string;
  whatsappQrImage?: string;
  backgroundImage?: string;
  servicePageContent?: ContentData;
}) {
  const settings = useSiteSettings();
  const { lang } = useLang();
  const localizedContent = getLocalizedServicePage(content, lang);
  const signOff = getLocalizedContent(
    servicePageContent ?? {},
    "servicePageSignOff",
    lang,
    localizedContent.signOff,
  );
  const resolvedBackground =
    backgroundImage?.trim() || SERVICE_BACKGROUND_IMAGE;

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.bg} aria-hidden>
          <Image
            src={resolvedBackground}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className={styles.bgImg}
          />
          <div className={styles.bgVeil} />
        </div>

        <div className={styles.shell}>
          <aside className={styles.sidebar}>
            <nav className={styles.sideNav} aria-label="Travel services">
              {navItems.map((item) => {
                const active = item.slug === content.slug;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={active ? styles.sideNavActive : styles.sideNavLink}
                    aria-current={active ? "page" : undefined}
                  >
                    {lang === "zh" && item.labelZh?.trim() ? item.labelZh : item.label}
                  </Link>
                );
              })}
            </nav>
            <ServiceQuoteForm serviceLabel={localizedContent.quoteLabel} />
          </aside>

          <section className={styles.content}>
            <h1 className={styles.title}>{localizedContent.title}</h1>
            <p className={styles.intro}>{localizedContent.intro}</p>

            {localizedContent.deals?.length ? (
              <ul className={styles.deals}>
                {localizedContent.deals.map((deal) => (
                  <li key={deal.id} className={styles.deal}>
                    <span className={styles.dealRoute}>{deal.route}</span>
                    <span className={styles.dealPrice}>: {deal.priceLabel}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {localizedContent.disclaimer ? (
              <p className={styles.disclaimer}>{localizedContent.disclaimer}</p>
            ) : null}
            <p className={styles.signOff}>{signOff}</p>

            <div className={styles.contactRow}>
              <div className={styles.qrWrap}>
                <Image
                  src={whatsappQrImage}
                  alt="WhatsApp QR code"
                  width={148}
                  height={148}
                  unoptimized
                  className={styles.qrImage}
                />
              </div>
              <div className={styles.contactMeta}>
                <p className={styles.whatsappHint}>{whatsappLabel}</p>
                <p className={styles.contactLine}>
                  {getLocalizedStaticText(lang, "phone")}:{" "}
                  {settings.primaryPhoneLabel}
                </p>
                {settings.secondaryPhoneLabel ? (
                  <p className={styles.contactLineIndent}>
                    {settings.secondaryPhoneLabel}
                  </p>
                ) : null}
                <p className={styles.contactLine}>
                  {getLocalizedStaticText(lang, "email")}:{" "}
                  {settings.emailLabel}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
