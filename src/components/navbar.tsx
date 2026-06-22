"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useLang } from "@/context/lang-context";
import { regions } from "@/data/regions";
import { site } from "@/data/site";

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

export function Navbar() {
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mega, setMega] = useState<"routes" | null>(null);

  const hasHeroOverlay =
    pathname === "/" || /^\/tours\/[^/]+$/.test(pathname);
  const transparent = hasHeroOverlay && !scrolled;

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
    { key: "services", label: "Services", href: "/#about" },
    { key: "contact", label: "Contact", href: "/#contact" },
  ];

  const isActive = (item: (typeof nav)[number]) => {
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
            <BrandLogo size={28} />
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
            </div>
          ))}
        </nav>

        <div className="header-right">
          <div className="header-contact">
            <a href={`tel:${site.phoneTel}`}>{site.phone}</a>
          </div>
          <button
            className="header-pill"
            type="button"
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            aria-label="Switch language"
          >
            <span className={lang === "en" ? "active" : ""}>EN</span>
            <span className="lang-divider">/</span>
            <span className={lang === "zh" ? "active" : ""}>中文</span>
          </button>
          <Link href={`tel:${site.phoneTel}`} className="header-pill">
            Book Now
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
              <Link
                className="drawer-link"
                href="/#about"
                onClick={() => setDrawerOpen(false)}
              >
                Services
              </Link>
              <Link
                className="drawer-link"
                href="/#contact"
                onClick={() => setDrawerOpen(false)}
              >
                Contact
              </Link>
            </div>
            <div className="drawer-foot">
              <button
                className="header-pill header-pill-drawer"
                type="button"
                onClick={() => setLang(lang === "en" ? "zh" : "en")}
              >
                <span className={lang === "en" ? "active" : ""}>EN</span>
                <span className="lang-divider">/</span>
                <span className={lang === "zh" ? "active" : ""}>中文</span>
              </button>
              <Link
                href={`tel:${site.phoneTel}`}
                className="header-pill header-pill-drawer"
                onClick={() => setDrawerOpen(false)}
              >
                Book Now
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
