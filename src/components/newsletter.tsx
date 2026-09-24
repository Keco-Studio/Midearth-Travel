"use client";

import { Send } from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useSiteSettings } from "@/context/site-settings-context";
import { useLang } from "@/context/lang-context";
import styles from "./newsletter.module.css";
import { getStringContent, type ContentData } from "@/lib/content-values";
import { getLocalizedContent } from "@/lib/localized-content";
import { getContactQuoteHref } from "@/lib/contact-prefill";

export function Newsletter({ content = {} }: { content?: ContentData }) {
  const settings = useSiteSettings();
  const { lang } = useLang();
  const [email, setEmail] = useState("");
  const eyebrow = getLocalizedContent(content, "eyebrow", lang, "Get a Quote");
  const titlePrefix = getLocalizedContent(content, "titlePrefix", lang, "Get a");
  const titleEmphasis = getLocalizedContent(content, "titleEmphasis", lang, "Quote");
  const deck = getLocalizedContent(
    content,
    "deck",
    lang,
    "Contact us today for personalized travel quotes and the best deals on flights, hotels, and tour packages",
  );
  const emailPlaceholder = getLocalizedContent(content, "emailPlaceholder", lang, "Enter your email");
  const contactLineTemplate = getLocalizedContent(
    content,
    "contactLine",
    lang,
    "",
  );
  const contactLine = contactLineTemplate
    .replaceAll("{{primaryPhone}}", settings.primaryPhoneLabel)
    .replaceAll(
      "{{secondaryPhone}}",
      settings.secondaryPhoneLabel ? ` / ${settings.secondaryPhoneLabel}` : "",
    )
    .replaceAll("{{email}}", settings.emailLabel);
  const wechatQrImage = getStringContent(content, "wechatQrImage", "/contact/wechat-qr.jpg");
  const whatsappQrImage = getStringContent(content, "whatsappQrImage", "/contact/whatsapp-qr.jpg");
  const wechatQrLabel = getLocalizedContent(content, "wechatQrLabel", lang, "微信扫码咨询");
  const whatsappQrLabel = getLocalizedContent(content, "whatsappQrLabel", lang, "WhatsApp us");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    window.location.href = getContactQuoteHref(undefined, email);
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.eyebrow}>— {eyebrow}</div>
        <h2 className={styles.title}>
          {titlePrefix} <span className={styles.titleBold}>{titleEmphasis}</span>
        </h2>
        <p className={styles.deck}>
          {deck}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={emailPlaceholder}
              className={styles.input}
            />
            <button
              type="submit"
              className={styles.submitBtn}
              aria-label="Send quote request"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>

        {contactLine ? <p className={styles.contact}>{contactLine}</p> : null}

        <div className={styles.qrSection}>
          <div className={styles.qrItem}>
            <p className={styles.qrLabel}>{wechatQrLabel}</p>
            <Image
              src={wechatQrImage}
              alt="WeChat QR code"
              width={140}
              height={140}
              className={styles.qrImage}
              unoptimized
            />
          </div>
          <div className={styles.qrItem}>
            <p className={styles.qrLabel}>{whatsappQrLabel}</p>
            <Image
              src={whatsappQrImage}
              alt="WhatsApp QR code"
              width={140}
              height={140}
              className={styles.qrImage}
              unoptimized
            />
          </div>
        </div>
      </div>
    </section>
  );
}
