"use client";

import { useEffect, useState } from "react";
import styles from "./hero.module.css";

const broadcasts = [
  "The Shire — golden hills at dusk, perfect for a peaceful countryside tour",
  "Helm's Deep — battle reported; guided groups rerouted via safer mountain passes",
  "Rivendell — waterfalls in full bloom, ideal for spring photography trips",
  "Rohan — endless green plains under open sky, horseback tours now available",
  "Moria — low visibility in the depths; expert-led expeditions recommended",
  "Gondor — panoramic views from the White City, sunset bookings open",
  "Lothlórien — silver mist over the forest canopy, a rare scenic window",
  "Grey Havens — calm seas at twilight, coastal cruises departing at dusk",
];

const INTERVAL_MS = 4200;

export function HeroBroadcast() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % broadcasts.length);
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className={styles.broadcast}
      aria-live="polite"
      aria-atomic="true"
      aria-label="Travel bulletin"
    >
      <span className={styles.broadcastLabel}>
        <span className={styles.broadcastDot} aria-hidden />
        Live
      </span>
      <div className={styles.broadcastViewport}>
        <p key={index} className={styles.broadcastLine}>
          {broadcasts[index]}
        </p>
      </div>
    </div>
  );
}
