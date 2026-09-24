"use client";

import { Calendar, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSiteSettings } from "@/context/site-settings-context";
import { useLang } from "@/context/lang-context";
import { getHotSaleTours, type Tour } from "@/data/tours";
import { getConfiguredContactHref, getTourPublicHref } from "@/lib/tour-content-audit";
import {
  getLocalizedStaticText,
  getLocalizedTourList,
  getLocalizedTourValue,
} from "@/lib/localized-content";

export function PackagesSection({ tours }: { tours?: Tour[] }) {
  const settings = useSiteSettings();
  const { lang } = useLang();
  const packages = tours
    ? tours.filter((tour) => tour.hotSale)
    : getHotSaleTours();

  if (packages.length === 0) {
    return null;
  }

  return (
    <section id="packages" className="bg-[#fdfaf4] py-14 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mx-0 md:mb-16 md:text-left lg:mb-20">
          <h2 className="mb-6 text-5xl font-light tracking-tight text-balance md:text-6xl">
            {getLocalizedStaticText(lang, "hotSales")}
          </h2>
          <p className="text-lg text-muted-foreground text-balance leading-relaxed">
            {getLocalizedStaticText(lang, "hotSalesDescription")}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3 lg:gap-8">
          {packages.map((tour) => {
            const title = getLocalizedTourValue(lang, tour.localizedTitle, tour.title);
            const duration = getLocalizedTourValue(lang, tour.localizedDuration, tour.duration);
            const tourType = getLocalizedTourValue(lang, tour.localizedTourType, tour.tourType);
            const tags = getLocalizedTourList(
              lang,
              tour.localizedHighlights,
              tour.highlights ?? tour.tags,
            );
            const href = getTourPublicHref(
              tour,
              getConfiguredContactHref(settings.emailHref, settings.primaryPhoneHref),
            );

            return (
              <Link
                key={tour.slug}
                href={href}
                aria-label={`${getLocalizedStaticText(lang, "viewTour")}: ${title}`}
                className="group/card block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="flex h-full cursor-pointer flex-col gap-0 overflow-hidden rounded-xl border-0 bg-card p-0 shadow-sm transition-all duration-500 hover:shadow-2xl">
                  <div className="relative h-64 shrink-0 overflow-hidden rounded-t-xl">
                    <Image
                      src={tour.image}
                      alt={title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 400px"
                      className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                    {tour.rating && (
                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 backdrop-blur-sm">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span className="text-xs font-semibold">{tour.rating}</span>
                        {tour.reviewCount && (
                          <span className="text-xs text-muted-foreground">
                            ({tour.reviewCount}+)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-6 p-6">
                    <div>
                      <h3 className="mb-4 text-2xl font-semibold">{title}</h3>
                      <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>{tourType}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-muted px-3 py-1 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-6">
                      <div>
                        <div className="mb-1 text-xs text-muted-foreground">
                          {getLocalizedStaticText(lang, "startingFrom")}
                        </div>
                        <div className="text-2xl font-semibold text-primary">
                          {getLocalizedStaticText(lang, "callForQuoteShort")}
                        </div>
                      </div>
                      <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors group-hover/card:bg-primary/90">
                        {getLocalizedStaticText(lang, "viewTour")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
