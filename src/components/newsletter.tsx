"use client";

import { Send } from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useSiteSettings } from "@/context/site-settings-context";
import styles from "./newsletter.module.css";
import { getStringContent, type ContentData } from "@/lib/content-values";

export function Newsletter({ content = {} }: { content?: ContentData }) {
  const settings = useSiteSettings();
  const [email, setEmail] = useState("");
  const eyebrow = getStringContent(content, "eyebrow", "Get a Quote");
  const titlePrefix = getStringContent(content, "titlePrefix", "Get a");
  const titleEmphasis = getStringContent(content, "titleEmphasis", "Quote");
  const deck = getStringContent(
    content,
    "deck",
    "Contact us today for personalized travel quotes and the best deals on flights, hotels, and tour packages",
  );
  const emailPlaceholder = getStringContent(content, "emailPlaceholder", "Enter your email");
  const mailtoRecipient = getStringContent(
    content,
    "mailtoRecipient",
    settings.emailLabel,
  );
  const wechatQrImage = getStringContent(content, "wechatQrImage", "/contact/wechat-qr.jpg");
  const whatsappQrImage = getStringContent(content, "whatsappQrImage", "/contact/whatsapp-qr.jpg");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    window.location.href = `mailto:${mailtoRecipient}?subject=Quote%20Request&body=Email:%20${encodeURIComponent(email)}`;
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

        <p className={styles.contact}>
          Call us at{" "}
          <a href={settings.primaryPhoneHref}>{settings.primaryPhoneLabel}</a>
          {settings.secondaryPhoneLabel ? (
            <>
              {" / "}
              <a href={settings.secondaryPhoneHref}>{settings.secondaryPhoneLabel}</a>
            </>
          ) : null}{" "}
          or email <a href={settings.emailHref}>{settings.emailLabel}</a>
        </p>

        <div className={styles.qrSection}>
          <div className={styles.qrItem}>
            <p className={styles.qrLabel}>微信扫码咨询</p>
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
            <p className={styles.qrLabel}>WhatsApp us</p>
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
