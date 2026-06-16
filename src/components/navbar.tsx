"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { TravelButton } from "@/components/ui/travel-button";
import { regions } from "@/data/regions";
import { services } from "@/data/services";
import { site } from "@/data/site";
import {
  getTourCategoryImage,
  getTourCategorySlug,
  getToursForCategoryName,
  tourCategories,
} from "@/data/tours";

function MegaRoutes() {
  return (
    <div className="mega">
      <div className="mega-grid">
        {regions.map((r) => (
          <Link key={r.id} className="mega-card" href={`/routes/${r.slug}`}>
            <img src={r.image} alt="" />
            <div className="mega-card-body">
              <div className="mega-card-title">{r.title}</div>
              <div className="mega-card-sub">
                {r.destinations.slice(0, 3).join(" · ")}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MegaTours() {
  return (
    <div className="mega">
      <div className="mega-grid mega-grid-3">
        {tourCategories.map((cat) => (
          <Link
            key={cat}
            className="mega-card"
            href={`/tours/category/${getTourCategorySlug(cat)}`}
          >
            <img src={getTourCategoryImage(cat)} alt="" />
            <div className="mega-card-body">
              <div className="mega-card-title">{cat}</div>
              <div className="mega-card-sub">
                {getToursForCategoryName(cat).length} trips
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MegaServices() {
  return (
    <div className="mega">
      <div className="mega-list">
        {services.map((s) => (
          <Link key={s.id} className="mega-list-item" href="/#contact">
            <span className="mega-list-title">{s.title}</span>
            <span className="mega-list-sub">{s.summary}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mega, setMega] = useState<"routes" | "tours" | "services" | null>(
    null,
  );

  const transparent = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setMega(null);
  }, [pathname]);

  const nav = [
    { key: "home", label: "Home", href: "/" },
    {
      key: "routes",
      label: "Routes",
      mega: "routes" as const,
      href: "/routes/north-america",
    },
    { key: "tours", label: "Tours", mega: "tours" as const, href: "/tours" },
    {
      key: "services",
      label: "Services",
      mega: "services" as const,
      href: "/#contact",
    },
    { key: "contact", label: "Contact", href: "/#contact" },
  ];

  const isActive = (item: (typeof nav)[number]) => {
    if (item.key === "tours") {
      return pathname === item.href || pathname.startsWith("/tours");
    }
    if (item.key === "routes") {
      return pathname.startsWith("/routes");
    }
    return pathname === item.href;
  };

  return (
    <header className={`site-header ${transparent ? "transparent" : "solid"}`}>
      <div className="header-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <BrandLogo />
          </span>
          <span className="brand-text">
            <span className="brand-name">{site.name}</span>
            <span className="brand-sub">{site.tagline}</span>
          </span>
        </Link>

        <nav className="nav-desktop">
          {nav.map((item) => (
            <div
              key={item.key}
              className="nav-item"
              onMouseEnter={() => item.mega && setMega(item.mega)}
              onMouseLeave={() => item.mega && setMega(null)}
            >
              <Link
                className={`nav-link ${isActive(item) ? "active" : ""}`}
                href={item.href}
              >
                {item.label}
                {item.mega && <span className="nav-caret">▾</span>}
              </Link>
              {item.mega === "routes" && mega === "routes" && <MegaRoutes />}
              {item.mega === "tours" && mega === "tours" && <MegaTours />}
              {item.mega === "services" && mega === "services" && (
                <MegaServices />
              )}
            </div>
          ))}
        </nav>

        <div className="header-right">
          <div className="header-contact">
            <a href={`tel:${site.phoneTel}`}>{site.phone}</a>
          </div>
          <Link className="lang-switcher" href="/">
            <span className="active">EN</span>
            <span className="lang-divider">/</span>
            <span>中文</span>
          </Link>
          <Link href={`tel:${site.phoneTel}`}>
            <TravelButton variant="primary" size="sm">
              Book Now
            </TravelButton>
          </Link>
          <button
            className="hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <span className="brand-name">{site.name}</span>
              <button
                className="drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="drawer-body">
              <Link
                className="drawer-link"
                href="/"
                onClick={() => setDrawerOpen(false)}
              >
                Home
              </Link>
              <div className="drawer-section">Routes</div>
              {regions.map((r) => (
                <Link
                  key={r.id}
                  className="drawer-sublink"
                  href={`/routes/${r.slug}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  {r.title}
                </Link>
              ))}
              <div className="drawer-section">Tours</div>
              {tourCategories.map((cat) => (
                <Link
                  key={cat}
                  className="drawer-sublink"
                  href={`/tours/category/${getTourCategorySlug(cat)}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  {cat}
                </Link>
              ))}
              <div className="drawer-section">Services</div>
              {services.map((s) => (
                <Link
                  key={s.id}
                  className="drawer-sublink"
                  href="/#contact"
                  onClick={() => setDrawerOpen(false)}
                >
                  {s.title}
                </Link>
              ))}
              <Link
                className="drawer-link"
                href="/#contact"
                onClick={() => setDrawerOpen(false)}
              >
                Contact
              </Link>
            </div>
            <div className="drawer-foot">
              <Link
                href={`tel:${site.phoneTel}`}
                onClick={() => setDrawerOpen(false)}
              >
                <TravelButton variant="primary">Book Now</TravelButton>
              </Link>
              <div className="drawer-contact">
                <div>{site.phone}</div>
                <div>{site.email}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
