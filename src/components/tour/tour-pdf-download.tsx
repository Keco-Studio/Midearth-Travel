"use client";

import { FileText } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import styles from "@/components/tour/tour-detail.module.css";

type TourPdfDownloadProps = {
  title?: string;
  href?: string;
};

export function TourPdfDownload({ title, href }: TourPdfDownloadProps) {
  const [message, setMessage] = useState<string | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const label = title?.trim() || "download the itinerary";

  useEffect(
    () => () => {
      if (clearTimer.current) {
        clearTimeout(clearTimer.current);
      }
    },
    [],
  );

  function handleComingSoon(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setMessage("PDF download coming soon");

    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
    }

    clearTimer.current = setTimeout(() => setMessage(null), 2500);
  }

  if (!href?.trim()) {
    return (
      <div className={styles.pdfDownload}>
        <a
          href="#"
          className={styles.pdfDownloadLink}
          onClick={handleComingSoon}
          aria-describedby={message ? "tour-pdf-download-status" : undefined}
        >
          <FileText className={styles.pdfDownloadIcon} aria-hidden />
          <span>{label}</span>
        </a>
        {message ? (
          <p id="tour-pdf-download-status" className={styles.pdfDownloadStatus} role="status">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.pdfDownload}>
      <a
        href={href}
        className={styles.pdfDownloadLink}
        download
        target="_blank"
        rel="noopener noreferrer"
      >
        <FileText className={styles.pdfDownloadIcon} aria-hidden />
        <span>{label}</span>
      </a>
    </div>
  );
}
