"use client";

import { FileText } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import styles from "@/components/tour/tour-detail.module.css";

export function TourPdfDownload() {
  const [message, setMessage] = useState<string | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (clearTimer.current) {
        clearTimeout(clearTimer.current);
      }
    },
    [],
  );

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setMessage("PDF download coming soon");

    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
    }

    clearTimer.current = setTimeout(() => setMessage(null), 2500);
  }

  return (
    <div className={styles.pdfDownload}>
      <a
        href="#"
        className={styles.pdfDownloadLink}
        onClick={handleClick}
        aria-describedby={message ? "tour-pdf-download-status" : undefined}
      >
        <FileText className={styles.pdfDownloadIcon} aria-hidden />
        <span>download the itinerary</span>
      </a>
      {message ? (
        <p id="tour-pdf-download-status" className={styles.pdfDownloadStatus} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
