"use client";

import { useEffect, useState } from "react";
import { heroBroadcastSeeds } from "@/data/hero-content";
import styles from "./hero.module.css";

const INTERVAL_MS = 4200;

export function HeroBroadcast({
  label = "Live",
  messages = heroBroadcastSeeds,
}: {
  label?: string;
  messages?: string[];
}) {
  const [index, setIndex] = useState(0);
  const activeMessages = messages.length > 0 ? messages : heroBroadcastSeeds;
  const messageCount = activeMessages.length;

  useEffect(() => {
    if (messageCount < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messageCount);
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [messageCount]);

  return (
    <div
      className={styles.broadcast}
      aria-live="polite"
      aria-atomic="true"
      aria-label="Travel bulletin"
    >
      <span className={styles.broadcastLabel}>
        <span className={styles.broadcastDot} aria-hidden />
        {label}
      </span>
      <div className={styles.broadcastViewport}>
        <p key={index} className={styles.broadcastLine}>
          {activeMessages[index % messageCount]}
        </p>
      </div>
    </div>
  );
}
