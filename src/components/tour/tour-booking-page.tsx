"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CreditCard, LoaderCircle } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { useLang } from "@/context/lang-context";
import { type Tour, getTourDisplayTitle } from "@/data/tours";
import { type ContentData } from "@/lib/content-values";
import {
  getLocalizedContent,
  getLocalizedTourList,
  getLocalizedTourValue,
} from "@/lib/localized-content";
import styles from "./tour-booking-page.module.css";

type BookingForm = {
  departureDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  adults: string;
  children: string;
  notes: string;
};

const emptyForm: BookingForm = {
  departureDate: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  adults: "1",
  children: "0",
  notes: "",
};

export function TourBookingPage({
  tour,
  content,
  backgroundImage,
}: {
  tour: Tour;
  content: ContentData;
  backgroundImage: string;
}) {
  const { lang } = useLang();
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [step, setStep] = useState<"form" | "review">("form");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = getLocalizedTourValue(lang, tour.localizedTitle, getTourDisplayTitle(tour));
  const duration = getLocalizedTourValue(lang, tour.localizedDuration, tour.duration);
  const departures = getLocalizedTourList(lang, tour.localizedDepartures, tour.departures ?? []);
  const fare = tour.fares?.[0];
  const text = {
    book: getLocalizedContent(content, "book", lang, "Book now"),
    complete: getLocalizedContent(content, "complete", lang, "Complete your details, then review your booking and payment amount."),
    departure: getLocalizedContent(content, "departure", lang, "Departure date"),
    selectDeparture: getLocalizedContent(content, "selectDeparture", lang, "Select a departure date"),
    name: getLocalizedContent(content, "name", lang, "Name"),
    email: getLocalizedContent(content, "email", lang, "Email"),
    phone: getLocalizedContent(content, "phone", lang, "Contact phone number"),
    adults: getLocalizedContent(content, "adults", lang, "Adults"),
    children: getLocalizedContent(content, "children", lang, "Children"),
    notes: getLocalizedContent(content, "notes", lang, "Details"),
    notesHint: getLocalizedContent(content, "notesHint", lang, "Let us know about any special requirements."),
    continue: getLocalizedContent(content, "continue", lang, "Continue to review"),
    review: getLocalizedContent(content, "review", lang, "Review your booking"),
    reviewHint: getLocalizedContent(content, "reviewHint", lang, "Check your details before continuing to secure payment."),
    package: getLocalizedContent(content, "package", lang, "Tour package"),
    party: getLocalizedContent(content, "party", lang, "Travel party"),
    packagePrice: getLocalizedContent(content, "packagePrice", lang, "Package price"),
    back: getLocalizedContent(content, "back", lang, "Back to edit"),
    pay: getLocalizedContent(content, "pay", lang, "Pay securely"),
    noPrice: getLocalizedContent(content, "noPrice", lang, "Online payment is not available for this tour. Please contact us for a quote."),
    unavailable: getLocalizedContent(content, "unavailable", lang, "We could not save your booking. Please try again."),
    backToTour: getLocalizedContent(content, "backToTour", lang, "Back to tour details"),
  };

  const partySummary = useMemo(() => {
    const adults = Number(form.adults) || 0;
    const children = Number(form.children) || 0;
    return lang === "zh"
      ? `${adults} 位成人，${children} 位儿童`
      : `${adults} adult${adults === 1 ? "" : "s"}, ${children} child${children === 1 ? "" : "ren"}`;
  }, [form.adults, form.children, lang]);

  function updateForm(field: keyof BookingForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tourSlug: tour.slug }),
      });
      const result = (await response.json()) as { bookingId?: string; error?: string };
      if (!response.ok || !result.bookingId) throw new Error(result.error || text.unavailable);
      setBookingId(result.bookingId);
      setStep("review");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : text.unavailable);
    } finally {
      setSaving(false);
    }
  }

  async function startCheckout() {
    if (!fare || !bookingId) return;
    setError(null);
    setPaying(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourSlug: tour.slug,
          fareLabel: fare.label,
          paymentType: "full",
          customerEmail: form.customerEmail,
          bookingId,
        }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || text.unavailable);
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : text.unavailable);
      setPaying(false);
    }
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.background} aria-hidden>
          <Image
            src={backgroundImage}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className={styles.backgroundImage}
          />
          <div className={styles.backgroundVeil} />
        </div>

        <div className={styles.shell}>
          <aside className={styles.sidebar}>
            <Link href={`/tours/${tour.slug}`} className={styles.backLink}>
              <ArrowLeft size={16} aria-hidden />
              {text.backToTour}
            </Link>
            <p className={styles.sideEyebrow}>{text.book}</p>
            <h2 className={styles.sideTitle}>{title}</h2>
            <p className={styles.sideMeta}>{duration}</p>
          </aside>

          <section className={styles.content} aria-live="polite">
            {step === "form" ? (
              <>
                <p className={styles.eyebrow}>{text.book}</p>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.description}>{text.complete}</p>

                <form className={styles.form} onSubmit={(event) => void submitBooking(event)}>
                  <div className={styles.fieldWide}>
                    <label htmlFor="departure-date">{text.departure}</label>
                    <select
                      id="departure-date"
                      className={styles.select}
                      required
                      value={form.departureDate}
                      onChange={(event) => updateForm("departureDate", event.target.value)}
                    >
                      <option value="">{text.selectDeparture}</option>
                      {departures.map((departure) => (
                        <option key={departure} value={departure}>{departure}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldWide}>
                    <label htmlFor="customer-name">{text.name}</label>
                    <input id="customer-name" className={styles.input} required value={form.customerName} onChange={(event) => updateForm("customerName", event.target.value)} />
                  </div>
                  <div className={styles.fieldWide}>
                    <label htmlFor="customer-email">{text.email}</label>
                    <input id="customer-email" className={styles.input} type="email" required value={form.customerEmail} onChange={(event) => updateForm("customerEmail", event.target.value)} />
                  </div>
                  <div className={styles.fieldWide}>
                    <label htmlFor="customer-phone">{text.phone}</label>
                    <input id="customer-phone" className={styles.input} type="tel" required value={form.customerPhone} onChange={(event) => updateForm("customerPhone", event.target.value)} />
                  </div>
                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <label htmlFor="adults">{text.adults}</label>
                      <input id="adults" className={styles.input} type="number" min="1" required value={form.adults} onChange={(event) => updateForm("adults", event.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="children">{text.children}</label>
                      <input id="children" className={styles.input} type="number" min="0" required value={form.children} onChange={(event) => updateForm("children", event.target.value)} />
                    </div>
                  </div>
                  <div className={styles.fieldWide}>
                    <label htmlFor="booking-notes">{text.notes}</label>
                    <textarea id="booking-notes" className={styles.textarea} placeholder={text.notesHint} value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} />
                  </div>

                  <div className={styles.actionRow}>
                    <button type="submit" className={styles.primaryButton} disabled={saving || !fare}>
                      {saving ? <LoaderCircle size={17} className="animate-spin" aria-hidden /> : <ArrowRight size={17} aria-hidden />}
                      {text.continue}
                    </button>
                  </div>
                </form>
                {!fare ? <p className={styles.error}>{text.noPrice}</p> : null}
              </>
            ) : (
              <>
                <p className={styles.eyebrow}>{text.book}</p>
                <h1 className={styles.title}>{text.review}</h1>
                <p className={styles.description}>{text.reviewHint}</p>
                <dl className={styles.reviewList}>
                  <div className={styles.reviewRow}><dt>{text.package}</dt><dd>{title}</dd></div>
                  <div className={styles.reviewRow}><dt>{text.departure}</dt><dd>{form.departureDate}</dd></div>
                  <div className={styles.reviewRow}><dt>{text.party}</dt><dd>{partySummary}</dd></div>
                  <div className={styles.reviewRow}><dt>{text.email}</dt><dd>{form.customerEmail}</dd></div>
                </dl>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>{text.packagePrice}</span>
                  <span className={styles.totalAmount}>{fare?.price ?? ""}</span>
                </div>
                <div className={styles.reviewActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setStep("form")}>{text.back}</button>
                  <button type="button" className={styles.primaryButton} disabled={paying || !fare} onClick={() => void startCheckout()}>
                    {paying ? <LoaderCircle size={17} className="animate-spin" aria-hidden /> : <CreditCard size={17} aria-hidden />}
                    {paying ? text.pay : `${text.pay} ${fare?.price ?? ""}`}
                  </button>
                </div>
              </>
            )}
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
          </section>
        </div>
      </main>
    </div>
  );
}
