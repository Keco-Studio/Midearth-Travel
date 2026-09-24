"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useLang } from "@/context/lang-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { getContactQuoteRequirements } from "@/lib/contact-prefill";
import { type ContentData } from "@/lib/content-values";
import { getLocalizedContent } from "@/lib/localized-content";
import styles from "./contact-page.module.css";

export function ContactPage({
  tourTitle,
  quoteRequested = false,
  prefilledEmail,
  content,
  backgroundImage,
}: {
  tourTitle?: string;
  quoteRequested?: boolean;
  prefilledEmail?: string;
  content: ContentData;
  backgroundImage: string;
}) {
  const settings = useSiteSettings();
  const { lang } = useLang();
  const zh = lang === "zh";
  const text = {
    formTitle: getLocalizedContent(content, "formTitle", lang, "Request a Quote"),
    namePlaceholder: getLocalizedContent(content, "namePlaceholder", lang, "Name"),
    phonePlaceholder: getLocalizedContent(content, "phonePlaceholder", lang, "Phone"),
    emailPlaceholder: getLocalizedContent(content, "emailPlaceholder", lang, "Email"),
    requirementsPlaceholder: getLocalizedContent(content, "requirementsPlaceholder", lang, "Your requirements"),
    submit: getLocalizedContent(content, "submit", lang, "Send Request"),
    sending: getLocalizedContent(content, "sending", lang, "Sending..."),
    successTemplate: getLocalizedContent(content, "successTemplate", lang, "Request received. We will be in touch shortly ({{reference}})."),
    failure: getLocalizedContent(content, "failure", lang, "Unable to submit request."),
    kicker: getLocalizedContent(content, "kicker", lang, "MidEarth Travel"),
    title: getLocalizedContent(content, "title", lang, "Contact Us"),
    lede: getLocalizedContent(content, "lede", lang, "If you have any questions, comments, or concerns, please feel free to contact us. We are happy to help in English and Mandarin."),
    detailsTitle: getLocalizedContent(content, "detailsTitle", lang, "Get in touch"),
    phoneLabel: getLocalizedContent(content, "phoneLabel", lang, "Phone"),
    emailLabel: getLocalizedContent(content, "emailLabel", lang, "Email"),
    addressLabel: getLocalizedContent(content, "addressLabel", lang, "Address"),
    mapAriaLabel: getLocalizedContent(content, "mapAriaLabel", lang, "Open office directions in Google Maps"),
    mapText: getLocalizedContent(content, "mapText", lang, "MID⇄EARTH TRAVEL"),
    whatsappLabel: getLocalizedContent(content, "whatsappLabel", lang, "Scan to reach us on WhatsApp"),
    hoursLabel: getLocalizedContent(content, "hoursLabel", lang, "Hours"),
    hoursText: getLocalizedContent(content, "hoursText", lang, "Monday-Friday 10:00 am-5:00 pm\nSaturday & Sunday by appointment"),
    quoteRequestedText: getLocalizedContent(content, "quoteRequestedText", lang, "I would like to request a quote."),
  };
  const [form, setForm] = useState(() => ({
    name: "",
    phone: "",
    email: prefilledEmail ?? "",
    requirements: getInitialContactRequirements(tourTitle, quoteRequested, lang, text.quoteRequestedText),
  }));
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { ok?: boolean; reference?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? text.failure);
      setForm({ name: "", phone: "", email: "", requirements: "" });
      setStatus(text.successTemplate.replace("{{reference}}", payload.reference ?? ""));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : text.failure);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.bg} aria-hidden>
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className={styles.bgImg}
        />
        <div className={styles.bgVeil} />
      </div>
      <div className={styles.main}>
        <div className={styles.shell}>
          <aside className={styles.sidebar}>
            <section className={styles.formCard} aria-labelledby="quote-title">
              <h2 id="quote-title" className={styles.formTitle}>{text.formTitle}</h2>
              <form className={styles.form} onSubmit={submit}>
                <input className={styles.input} required placeholder={text.namePlaceholder} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                <input className={styles.input} required placeholder={text.phonePlaceholder} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                <input className={styles.input} required type="email" placeholder={text.emailPlaceholder} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                <textarea className={`${styles.input} ${styles.textarea}`} required placeholder={text.requirementsPlaceholder} value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} />
                <button className={styles.button} type="submit" disabled={busy}>{busy ? text.sending : text.submit}</button>
                {status ? <p className={styles.status} role="status">{status}</p> : null}
              </form>
            </section>
          </aside>

          <section className={styles.content} aria-labelledby="contact-details-title">
            <p className={styles.kicker}>{text.kicker}</p>
            <h1 className={styles.title}>{text.title}</h1>
            <p className={styles.lede}>{text.lede}</p>
            <h2 id="contact-details-title" className={styles.sectionTitle}>{text.detailsTitle}</h2>
            <div className={styles.contactRows}>
              <div className={styles.contactRow}><span className={styles.label}>{text.phoneLabel}</span><span className={styles.value}>{settings.primaryPhoneLabel}{settings.secondaryPhoneLabel ? `\n${settings.secondaryPhoneLabel}` : ""}</span></div>
              <div className={styles.contactRow}><span className={styles.label}>{text.emailLabel}</span><span className={styles.value}>{settings.emailLabel}</span></div>
              <div className={styles.contactRow}><span className={styles.label}>{text.addressLabel}</span><span className={styles.value}>{zh && settings.officeAddressZh.trim() ? settings.officeAddressZh : settings.officeAddress}</span></div>
            </div>
            <a
              className={styles.map}
              href="https://www.google.com/maps/search/?api=1&query=738%20Bronson%20Avenue%2C%20Ottawa%2C%20ON%20K1S%204G3"
              target="_blank"
              rel="noreferrer"
              aria-label={text.mapAriaLabel}
            >
              <span className={styles.mapText}>{text.mapText}</span>
            </a>
            <div className={styles.qrRow}><Image className={styles.qr} src="/contact/whatsapp-qr.jpg" alt="WhatsApp" width={148} height={148} unoptimized /><span className={styles.value}>{text.whatsappLabel}</span></div>
            <div className={styles.hours}><span className={styles.label}>{text.hoursLabel}</span><span>{text.hoursText}</span></div>
          </section>
        </div>
      </div>
    </main>
  );
}

function getInitialContactRequirements(
  tourTitle: string | undefined,
  quoteRequested: boolean,
  lang: "en" | "zh",
  quoteRequestedText: string,
): string {
  const title = tourTitle?.trim();
  if (title) return getContactQuoteRequirements(title, lang);
  if (quoteRequested) return quoteRequestedText;
  return "";
}
