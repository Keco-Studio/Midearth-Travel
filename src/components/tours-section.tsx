import { ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getFeaturedTours } from "@/data/tours";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ToursSection() {
  const tours = getFeaturedTours();

  return (
    <section id="tours" className="bg-[#f5efe3] py-14 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mx-0 md:mb-16 md:text-left lg:mb-20">
          <h2 className="mb-6 text-5xl font-light tracking-tight text-balance md:text-6xl">
            Popular <span className="font-semibold">Tours</span>
          </h2>
          <p className="text-lg text-muted-foreground text-balance leading-relaxed">
            Expertly planned bus tours and vacation packages across Canada, USA,
            and beyond
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {tours.map((tour) => (
            <Link
              key={tour.slug}
              href={`/tours/${tour.slug}`}
              aria-label={`View tour page for ${tour.title}`}
              className="group/card block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex h-full cursor-pointer flex-col gap-0 overflow-hidden rounded-xl border-0 bg-card p-0 shadow-sm transition-all duration-500 hover:shadow-2xl">
                <div className="relative h-80 shrink-0 overflow-hidden rounded-t-xl">
                  <Image
                    src={tour.image}
                    alt={tour.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                    className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                  <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 backdrop-blur-sm">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">{tour.region}</span>
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <div>
                    <h3 className="mb-2 text-2xl font-semibold">{tour.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tour.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="text-sm font-semibold text-primary">
                      {tour.duration}
                    </span>
                    <span className="inline-flex items-center text-sm font-medium text-foreground transition-colors group-hover/card:text-primary">
                      Explore
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/card:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center md:mt-12 lg:mt-16">
          <Link
            href="/tours"
            className={cn(
              buttonVariants({ variant: "outline", size: "wide", round: true }),
              "border-2 bg-transparent",
            )}
          >
            View All Tours
          </Link>
        </div>
      </div>
    </section>
  );
}
