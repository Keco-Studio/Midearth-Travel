"use client";

import {
  ArrowRight,
  CalendarDays,
  Clock,
  Hotel,
  MapPin,
  ShieldAlert,
  Ticket,
  Users,
} from "lucide-react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getBookingMailto,
  getTourDisplayTitle,
  getTourNotIncluded,
  defaultTourIncluded,
  type Tour,
  type TourPolicy,
} from "@/data/tours";
import { TourDetailHeader } from "@/components/tour/tour-detail-header";
import { TourPdfDownload } from "@/components/tour/tour-pdf-download";
import { TourCheckoutButton } from "@/components/tour/tour-checkout-button";
import { useLang } from "@/context/lang-context";
import { useSiteSettings } from "@/context/site-settings-context";
import styles from "@/components/tour/tour-detail.module.css";

function PolicyIcon({ icon }: { icon?: TourPolicy["icon"] }) {
  if (icon === "ticket") return <Ticket className="h-5 w-5" aria-hidden />;
  if (icon === "shield") return <ShieldAlert className="h-5 w-5" aria-hidden />;
  return null;
}

function pickLocalized(
  lang: string,
  localized: string | undefined,
  fallback: string,
): string {
  return lang === "zh" && localized?.trim() ? localized.trim() : fallback;
}

function pickLocalizedList(
  lang: string,
  localized: string[] | undefined,
  fallback: string[],
): string[] {
  return lang === "zh" && localized && localized.length > 0 ? localized : fallback;
}

export function TourDetail({ tour }: { tour: Tour }) {
  const { lang } = useLang();
  const settings = useSiteSettings();
  const displayTitle = pickLocalized(
    lang,
    tour.localizedTitle,
    getTourDisplayTitle(tour),
  );
  const duration = pickLocalized(lang, tour.localizedDuration, tour.duration);
  const departureCity = pickLocalized(
    lang,
    tour.localizedDepartureCity,
    tour.departureCity?.trim() ?? "",
  );
  const departures = pickLocalizedList(
    lang,
    tour.localizedDepartures,
    tour.departures ?? [],
  );
  const departuresLine = departures.length > 0 ? departures.join(" · ") : undefined;
  const departuresComma = departures.length > 0 ? departures.join(", ") : undefined;
  const tags = pickLocalizedList(lang, tour.localizedHighlights, tour.tags);
  const bookingMailto = getBookingMailto(tour);
  const gallery = tour.gallery?.length ? tour.gallery : [tour.image];
  const included = pickLocalizedList(
    lang,
    tour.localizedIncluded,
    tour.included ?? defaultTourIncluded,
  );
  const notIncluded = pickLocalizedList(
    lang,
    tour.localizedNotIncluded,
    getTourNotIncluded(tour),
  );
  const meetingPlace = pickLocalized(
    lang,
    tour.essentials?.localizedMeetingPlace,
    tour.essentials?.meetingPlace ?? "",
  );
  const hotels = pickLocalized(
    lang,
    tour.essentials?.localizedHotels,
    tour.essentials?.hotels ?? "",
  );
  const escortedCoach = pickLocalized(
    lang,
    tour.essentials?.localizedEscortedCoach,
    tour.essentials?.escortedCoach ?? "",
  );
  const pdfTitle = pickLocalized(lang, tour.localizedPdfTitle, tour.pdfTitle ?? "");
  const phoneHref = settings.primaryPhoneHref.trim() || "tel:+16132365226";
  const phoneLabel = settings.primaryPhoneLabel.trim() || "613-236-5226";

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <TourDetailHeader images={gallery} alt={displayTitle}>
        <div className="mx-auto w-full max-w-7xl">
          {tour.code && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Tour {tour.code}
            </p>
          )}

          <h1 className="max-w-4xl text-balance text-4xl font-light tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {displayTitle}
          </h1>

          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm md:text-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          <dl className="mt-8 grid max-w-3xl gap-4 border-t border-white/20 pt-8 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-white/60">
                Duration
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white md:text-base">
                {duration}
              </dd>
            </div>
            {tour.subregion?.trim() ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-white/60">
                  Region
                </dt>
                <dd className="mt-1 text-sm font-semibold text-white md:text-base">
                  {[tour.region, tour.subregion.trim()].filter(Boolean).join(" · ")}
                </dd>
              </div>
            ) : null}
            <div className={tour.subregion?.trim() ? undefined : "sm:col-span-2"}>
              <dt className="text-xs font-medium uppercase tracking-wide text-white/60">
                {departureCity
                  ? `Departures from ${departureCity}`
                  : "Departures"}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white md:text-base">
                {departuresLine ?? "Contact for dates"}
              </dd>
            </div>
          </dl>
        </div>
      </TourDetailHeader>

      <div className={styles.tourBody}>
        <div className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-16 lg:px-8">
          <div className={styles.overviewBlock}>
            <div className={styles.pdfDownloadSlot}>
              <TourPdfDownload title={pdfTitle || undefined} href={tour.pdfUrl} />
            </div>

            <div className={styles.overviewMain}>
              {tour.itinerary && tour.itinerary.length > 0 ? (
                <section className={styles.dayByDaySection}>
                  <h2 className="text-3xl font-light tracking-tight md:text-4xl">
                    Day by <span className="font-semibold">day</span>
                  </h2>
                  <p className="mt-3 max-w-2xl text-muted-foreground">
                    A clear overview of each stage of the journey so you know
                    what to expect on the road.
                  </p>

                  <ol className={styles.dayList}>
                    {tour.itinerary.map((day, index) => (
                      <li key={day.day} className={styles.dayItem}>
                        <div className={styles.dayRail}>
                          <span className={styles.dayNumber} aria-hidden>
                            {day.day}
                          </span>
                          {index < tour.itinerary!.length - 1 && (
                            <div className={styles.dayConnector} aria-hidden />
                          )}
                        </div>
                        <div className={styles.dayContent}>
                          <div className={styles.dayCard}>
                            <h3 className={styles.dayTitle}>
                              <span className="text-muted-foreground">
                                Day {day.day}
                                {day.note ? ` (${day.note})` : ""}:
                              </span>{" "}
                              {day.title}
                            </h3>
                            {day.description && (
                              <p className={styles.dayDescription}>
                                {day.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}
            </div>

            <aside className={styles.overviewAside}>
              {included.length > 0 && (
                <div className={styles.includedCard}>
                  <div className={styles.includedHead}>Included</div>
                  <ul className={styles.includedList}>
                    {included.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {notIncluded.length > 0 && (
                <div className={styles.notIncludedCard}>
                  <div className={styles.notIncludedHead}>Not included</div>
                  <ul className={styles.notIncludedList}>
                    {notIncluded.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {tour.policies && tour.policies.length > 0 && (
                <section
                  className={styles.policyList}
                  aria-label="Policies and practical information"
                >
                  {tour.policies.map((policy) => (
                    <div
                      key={policy.title}
                      className="flex flex-col gap-6 rounded-xl border border-border bg-card py-6 shadow-sm"
                    >
                      <div className="px-6 pb-2">
                        <div className="flex items-center gap-2 text-primary">
                          <PolicyIcon icon={policy.icon} />
                          <h3 className="text-base font-semibold">
                            {policy.title}
                          </h3>
                        </div>
                      </div>
                      <div className="px-6 text-sm leading-relaxed text-muted-foreground">
                        {policy.content}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {tour.essentials && (
                <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card py-0 shadow-lg">
                  <div className="border-b border-border bg-muted/40 px-6 py-5">
                    <h3 className="text-lg font-semibold">Trip essentials</h3>
                  </div>
                  <div className="space-y-5 px-6 py-6">
                    {tour.essentials.departureTime && (
                      <div className="flex gap-3">
                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Departure time
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {tour.essentials.departureTime}
                          </p>
                        </div>
                      </div>
                    )}
                    {meetingPlace && (
                      <div className="flex gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Meeting place
                          </p>
                          <p className="mt-1 text-sm leading-snug">
                            {meetingPlace}
                          </p>
                        </div>
                      </div>
                    )}
                    {hotels && (
                      <div className="flex gap-3">
                        <Hotel className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Hotels
                          </p>
                          <p className="mt-1 text-sm leading-snug">
                            {hotels}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {duration}
                        </p>
                        <p className="mt-1 text-sm">
                          {departuresComma ?? "Contact for dates"}
                        </p>
                      </div>
                    </div>
                    {escortedCoach && (
                      <div className="flex gap-3">
                        <Users className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Escorted coach
                          </p>
                          <p className="mt-1 text-sm">
                            {escortedCoach}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card py-0 shadow-lg">
                <div className="border-b border-border px-6 py-5">
                  <h3 className="text-lg font-semibold">Tour fares</h3>
                  <p className="text-xs text-muted-foreground">
                    Per person
                    {departureCity ? `, from ${departureCity}` : ""}
                  </p>
                </div>

                {tour.fares && tour.fares.length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody>
                      {tour.fares.map((fare) => (
                        <tr
                          key={fare.label}
                          className="border-b border-border last:border-0"
                        >
                          <th
                            scope="row"
                            className="px-6 py-3 text-left font-medium text-muted-foreground"
                          >
                            {fare.label}
                          </th>
                          <td className="px-6 py-3 text-right font-semibold tabular-nums">
                            {fare.price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-6 text-sm text-muted-foreground">
                    Call for quote — pricing varies by season and room type.
                  </div>
                )}

                <div className="border-t border-border px-6 py-4">
                  {tour.fares && tour.fares.length > 0 ? (
                    <TourCheckoutButton
                      tourSlug={tour.slug}
                      fares={tour.fares}
                    />
                  ) : null}
                  <a
                    href={bookingMailto}
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full",
                    )}
                  >
                    Book this tour
                  </a>
                  <a
                    href={phoneHref}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "mt-3 w-full border-2",
                    )}
                  >
                    Call {phoneLabel}
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <section
        className="border-t border-border bg-muted/30 px-6 py-20 lg:px-8"
        aria-labelledby="book-cta"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="book-cta"
            className="text-3xl font-light tracking-tight md:text-4xl"
          >
            Ready for <span className="font-semibold">{displayTitle}</span>?
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Email us to reserve your seats, or call our Ottawa office — we&apos;ll
            confirm availability and next steps
            {tour.code ? ` for tour ${tour.code}` : ""}.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={bookingMailto}
              className={cn(
                buttonVariants({ size: "lg" }),
                "group h-14 px-10 text-base",
              )}
            >
              Book now
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={phoneHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-14 border-2 bg-background px-10 text-base shadow-xs",
              )}
            >
              Contact us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
