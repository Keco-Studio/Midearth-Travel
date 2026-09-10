"use client";

import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ServiceQuoteForm } from "@/components/services/service-quote-form";
import {
  SERVICE_BACKGROUND_IMAGE,
  SERVICE_WHATSAPP_LABEL,
  SERVICE_WHATSAPP_QR,
  type ServiceNavItem,
  type ServicePageContent,
} from "@/data/service-pages";
import { useSiteSettings } from "@/context/site-settings-context";
import styles from "./service-page.module.css";

export function ServiceDetailPage({
  content,
  navItems,
  whatsappLabel = SERVICE_WHATSAPP_LABEL,
  whatsappQrImage = SERVICE_WHATSAPP_QR,
  backgroundImage,
}: {
  content: ServicePageContent;
  navItems: ServiceNavItem[];
  whatsappLabel?: string;
  whatsappQrImage?: string;
  backgroundImage?: string;
}) {
  const settings = useSiteSettings();
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
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <ServiceQuoteForm serviceLabel={content.quoteLabel} />
          </aside>

          <section className={styles.content}>
            <h1 className={styles.title}>{content.title}</h1>
            <p className={styles.intro}>{content.intro}</p>

            {content.deals?.length ? (
              <ul className={styles.deals}>
                {content.deals.map((deal) => (
                  <li key={deal.id} className={styles.deal}>
                    <span className={styles.dealRoute}>{deal.route}</span>
                    <span className={styles.dealPrice}>: {deal.priceLabel}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {content.disclaimer ? (
              <p className={styles.disclaimer}>{content.disclaimer}</p>
            ) : null}
            <p className={styles.signOff}>{content.signOff}</p>

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
                  Phone:{" "}
                  <a href={settings.primaryPhoneHref}>{settings.primaryPhoneLabel}</a>
                </p>
                {settings.secondaryPhoneLabel ? (
                  <p className={styles.contactLineIndent}>
                    <a href={settings.secondaryPhoneHref}>
                      {settings.secondaryPhoneLabel}
                    </a>
                  </p>
                ) : null}
                <p className={styles.contactLine}>
                  Email:{" "}
                  <a href={settings.emailHref}>{settings.emailLabel}</a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
