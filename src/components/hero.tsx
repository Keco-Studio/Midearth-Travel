"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const heroImages = ["/hero/hero1.jpg", "/hero/hero2.jpg"];

export function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % heroImages.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="relative flex h-[calc(100dvh*2/3)] max-h-[calc(100dvh*2/3)] flex-col overflow-hidden bg-[#fdfaf4] md:h-dvh md:max-h-dvh">
      <div className="absolute inset-0 z-0" aria-hidden>
        {heroImages.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            unoptimized
            priority={i === 0}
            sizes="100vw"
            className={`object-cover transition-opacity duration-[1200ms] motion-reduce:transition-none ease-in-out ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(253,250,244,0.12) 42%, rgba(253,250,244,0.55) 72%, #fdfaf4 92%, #fdfaf4 100%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pb-8 pt-16 text-center md:px-8 md:pb-14 md:pt-28 lg:pb-16">
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col justify-center gap-2 overflow-x-hidden sm:gap-4 md:gap-5">
          <p
            lang="zh-Hans"
            className="font-zh text-2xl text-foreground tracking-[0.12em] sm:text-3xl md:text-4xl md:tracking-[0.16em] lg:text-5xl"
          >
            中环旅游
          </p>
          <h1 className="text-balance text-4xl font-light tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
            Ottawa&apos;s Premier
            <span className="mt-1 block font-semibold sm:mt-2">Travel Agency</span>
          </h1>
          <div className="flex flex-col items-center justify-center gap-2 pt-1 sm:flex-row sm:gap-4 sm:pt-2 md:pt-3">
            <a
              href="#tours"
              className={cn(buttonVariants({ size: "lg" }), "group")}
            >
              Explore Tours
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#contact"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Request Quote
            </a>
          </div>
        </div>

        <div className="mx-auto mt-2 grid w-full max-w-3xl shrink-0 grid-cols-3 gap-2 border-t border-border/50 pt-2 sm:mt-4 sm:gap-6 sm:pt-4 md:mt-5 md:gap-10 md:pt-5">
          {[
            { value: "20+", label: "Years Experience" },
            { value: "TICO", label: "Certified Member" },
            { value: "5.0", label: "Google Rating" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-0.5 sm:space-y-1">
              <div className="text-2xl font-light sm:text-3xl md:text-4xl lg:text-5xl">
                {stat.value}
              </div>
              <div className="text-[10px] text-muted-foreground sm:text-xs md:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
