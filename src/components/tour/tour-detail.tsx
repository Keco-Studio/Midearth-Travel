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
import { getLocalizedStaticText, getLocalizedTourList, getLocalizedTourValue } from "@/lib/localized-content";
import styles from "@/components/tour/tour-detail.module.css";

function PolicyIcon({ icon }: { icon?: TourPolicy["icon"] }) {
  if (icon === "ticket") return <Ticket className="h-5 w-5" aria-hidden />;
  if (icon === "shield") return <ShieldAlert className="h-5 w-5" aria-hidden />;
  return null;
}

function getPolicyTitle(lang: "en" | "zh", policy: TourPolicy): string {
  if (policy.icon === "ticket") return getLocalizedStaticText(lang, "admissions");
  if (policy.icon === "shield") return getLocalizedStaticText(lang, "cancellation");
  if (policy.icon === "info") return getLocalizedStaticText(lang, "importantNotice");
  return policy.title;
}

export function TourDetail({ tour }: { tour: Tour }) {
  const { lang } = useLang();
  const settings = useSiteSettings();
  const displayTitle = getLocalizedTourValue(
    lang,
    tour.localizedTitle,
    getTourDisplayTitle(tour),
  );
  const duration = getLocalizedTourValue(lang, tour.localizedDuration, tour.duration);
  const departureCity = getLocalizedTourValue(
    lang,
    tour.localizedDepartureCity,
    tour.departureCity?.trim() ?? "",
  );
  const departures = getLocalizedTourList(
    lang,
    tour.localizedDepartures,
    tour.departures ?? [],
  );
  const departuresLine = departures.length > 0 ? departures.join(" · ") : undefined;
  const departuresComma = departures.length > 0 ? departures.join(", ") : undefined;
  const tags = getLocalizedTourList(lang, tour.localizedHighlights, tour.tags);
  const gallery = tour.gallery?.length ? tour.gallery : [tour.image];
  const included = getLocalizedTourList(
    lang,
    tour.localizedIncluded,
    tour.included ?? defaultTourIncluded,
  );
  const notIncluded = getLocalizedTourList(
    lang,
    tour.localizedNotIncluded,
    getTourNotIncluded(tour),
  );
  const meetingPlace = getLocalizedTourValue(
    lang,
    tour.essentials?.localizedMeetingPlace,
    tour.essentials?.meetingPlace ?? "",
  );
  const hotels = getLocalizedTourValue(
    lang,
    tour.essentials?.localizedHotels,
    tour.essentials?.hotels ?? "",
  );
  const escortedCoach = getLocalizedTourValue(
    lang,
    tour.essentials?.localizedEscortedCoach,
    tour.essentials?.escortedCoach ?? "",
  );
  const pdfTitle = getLocalizedTourValue(lang, tour.localizedPdfTitle, tour.pdfTitle ?? "");
  const phoneHref = settings.primaryPhoneHref.trim() || "tel:+16132365226";
  const phoneLabel = settings.primaryPhoneLabel.trim() || "613-236-5226";
  const bookingMailto =
    getBookingMailto(
      tour,
      settings.emailHref.trim() || settings.primaryPhoneHref.trim(),
    ) || phoneHref;
  const bookingRecipient = settings.emailHref.trim() || settings.primaryPhoneHref.trim();

  function handleBookingClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const href = getBookingMailto(tour, bookingRecipient, window.location.href);
    if (!href) return;

    event.preventDefault();
    window.location.assign(href);
  }
  const bookingTourCode = tour.code
    ? lang === "zh"
      ? `（行程编号 ${tour.code}）`
      : ` for tour ${tour.code}`
    : "";

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <TourDetailHeader images={gallery} alt={displayTitle}>
        <div className="mx-auto w-full max-w-7xl">
          {tour.code && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              {getLocalizedStaticText(lang, "tour")} {tour.code}
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
                {getLocalizedStaticText(lang, "duration")}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white md:text-base">
                {duration}
              </dd>
            </div>
            {tour.subregion?.trim() ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-white/60">
                  {getLocalizedStaticText(lang, "region")}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-white md:text-base">
                  {[tour.region, tour.subregion.trim()].filter(Boolean).join(" · ")}
                </dd>
              </div>
            ) : null}
            <div className={tour.subregion?.trim() ? undefined : "sm:col-span-2"}>
              <dt className="text-xs font-medium uppercase tracking-wide text-white/60">
                {departureCity
                  ? getLocalizedStaticText(lang, "departuresFrom", { city: departureCity })
                  : getLocalizedStaticText(lang, "departures")}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white md:text-base">
                {departuresLine ?? getLocalizedStaticText(lang, "contactForDates")}
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
                    {getLocalizedStaticText(lang, "dayByDay")}
                  </h2>
                  <p className="mt-3 max-w-2xl text-muted-foreground">
                    {getLocalizedStaticText(lang, "dayByDayDescription")}
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
                                {getLocalizedStaticText(lang, "day", { day: day.day })}
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
                  <div className={styles.includedHead}>{getLocalizedStaticText(lang, "included")}</div>
                  <ul className={styles.includedList}>
                    {included.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {notIncluded.length > 0 && (
                <div className={styles.notIncludedCard}>
                  <div className={styles.notIncludedHead}>{getLocalizedStaticText(lang, "notIncluded")}</div>
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
                  aria-label={getLocalizedStaticText(lang, "policiesAndInformation")}
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
                            {getPolicyTitle(lang, policy)}
                          </h3>
                        </div>
                      </div>
                      <div className="px-6 text-sm leading-relaxed text-muted-foreground">
                        {getLocalizedTourValue(lang, policy.localizedContent, policy.content)}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {tour.essentials && (
                <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card py-0 shadow-lg">
                  <div className="border-b border-border bg-muted/40 px-6 py-5">
                    <h3 className="text-lg font-semibold">{getLocalizedStaticText(lang, "tripEssentials")}</h3>
                  </div>
                  <div className="space-y-5 px-6 py-6">
                    {tour.essentials.departureTime && (
                      <div className="flex gap-3">
                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {getLocalizedStaticText(lang, "departureTime")}
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
                            {getLocalizedStaticText(lang, "meetingPlace")}
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
                            {getLocalizedStaticText(lang, "hotels")}
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
                          {departuresComma ?? getLocalizedStaticText(lang, "contactForDates")}
                        </p>
                      </div>
                    </div>
                    {escortedCoach && (
                      <div className="flex gap-3">
                        <Users className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {getLocalizedStaticText(lang, "escortedCoach")}
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
                  <h3 className="text-lg font-semibold">{getLocalizedStaticText(lang, "tourFares")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {getLocalizedStaticText(lang, "perPerson")}
                    {departureCity ? `, ${getLocalizedStaticText(lang, "from")} ${departureCity}` : ""}
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
                    {getLocalizedStaticText(lang, "callForQuote")}
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
                    onClick={handleBookingClick}
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full",
                    )}
                  >
                    {getLocalizedStaticText(lang, "bookThisTour")}
                  </a>
                  <a
                    href={phoneHref}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "mt-3 w-full border-2",
                    )}
                  >
                    {getLocalizedStaticText(lang, "call")} {phoneLabel}
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
            {getLocalizedStaticText(lang, "readyFor", { title: displayTitle })}
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {getLocalizedStaticText(lang, "bookingCtaDescription", {
              tourCode: bookingTourCode,
            })}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={bookingMailto}
              className={cn(
                buttonVariants({ size: "lg" }),
                "group h-14 px-10 text-base",
              )}
            >
              {getLocalizedStaticText(lang, "bookNow")}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={phoneHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-14 border-2 bg-background px-10 text-base shadow-xs",
              )}
            >
              {getLocalizedStaticText(lang, "contactUs")}
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
