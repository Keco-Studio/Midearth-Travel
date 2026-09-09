"use client";

import { FormEvent, useState } from "react";
import { useSiteSettings } from "@/context/site-settings-context";
import styles from "./service-page.module.css";

type Props = {
  serviceLabel?: string;
};

export function ServiceQuoteForm({ serviceLabel = "Flights" }: Props) {
  const settings = useSiteSettings();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [requirements, setRequirements] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body = [
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `Service: ${serviceLabel}`,
      "",
      "Requirements:",
      requirements,
    ].join("\n");

    window.location.href = `mailto:${settings.emailLabel}?subject=${encodeURIComponent(
      `${serviceLabel} Quote Request`,
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form className={styles.quoteForm} onSubmit={handleSubmit}>
      <h2 className={styles.quoteTitle}>Request a Quote</h2>
      <label className={styles.field}>
        <span className={styles.srOnly}>Name</span>
        <input
          className={styles.input}
          type="text"
          name="name"
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.srOnly}>Phone</span>
        <input
          className={styles.input}
          type="tel"
          name="phone"
          required
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.srOnly}>Email</span>
        <input
          className={styles.input}
          type="email"
          name="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.srOnly}>Requirements</span>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          name="requirements"
          required
          placeholder="Requirements"
          rows={5}
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
        />
      </label>
      <button type="submit" className={styles.submitBtn}>
        Send Request
      </button>
    </form>
  );
}
