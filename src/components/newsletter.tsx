"use client";

import { Send } from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";
import styles from "./newsletter.module.css";

export function Newsletter() {
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    window.location.href = `mailto:info@midearth.ca?subject=Quote%20Request&body=Email:%20${encodeURIComponent(email)}`;
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.eyebrow}>— Get a Quote</div>
        <h2 className={styles.title}>
          Get a <span className={styles.titleBold}>Quote</span>
        </h2>
        <p className={styles.deck}>
          Contact us today for personalized travel quotes and the best deals on
          flights, hotels, and tour packages
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
          <a href="tel:6132365226">613-236-5226</a> /{" "}
          <a href="tel:6132362323">613-236-2323</a> or email{" "}
          <a href="mailto:info@midearth.ca">info@midearth.ca</a>
        </p>

        <div className={styles.qrSection}>
          <div className={styles.qrItem}>
            <p className={styles.qrLabel}>微信扫码咨询</p>
            <Image
              src="/contact/wechat-qr.jpg"
              alt="WeChat QR code"
              width={140}
              height={140}
              className={styles.qrImage}
            />
          </div>
          <div className={styles.qrItem}>
            <p className={styles.qrLabel}>WhatsApp us</p>
            <Image
              src="/contact/whatsapp-qr.jpg"
              alt="WhatsApp QR code"
              width={140}
              height={140}
              className={styles.qrImage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
