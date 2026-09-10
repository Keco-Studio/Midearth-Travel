"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useLang } from "@/context/lang-context";
import { useNavbarContent } from "@/context/navbar-content-context";
import { useSiteSettings } from "@/context/site-settings-context";
import { getStringContent, type ContentData } from "@/lib/content-values";

// Original routes mega navigation is intentionally disabled for the
// homepage-focused destinations anchor.
// function MegaRoutes() {
//   return (
//     <div className="mega">
//       <div className="mega-grid">
//         {regions.map((r) => (
//           <Link key={r.id} className="mega-card" href={`/routes/${r.slug}`}>
//             <img src={r.image} alt="" />
//             <div className="mega-card-body">
//               <div className="mega-card-title">{r.title}</div>
//               <div className="mega-card-sub">
//                 {r.destinations.slice(0, 3).join(" · ")}
//               </div>
//             </div>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// }

export function Navbar({ content }: { content?: ContentData }) {
  const settings = useSiteSettings();
  const sharedContent = useNavbarContent();
  const resolvedContent = content && Object.keys(content).length > 0 ? content : sharedContent;
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const previousPathname = useRef(pathname);

  const hasHeroOverlay =
    pathname === "/" || /^\/tours\/[^/]+$/.test(pathname);
  const transparent = hasHeroOverlay && !scrolled;
  const logoAlt = getStringContent(
    resolvedContent,
    "logoAlt",
    `${settings.siteName} ${settings.tagline}`,
  );
  const logoImage = getStringContent(resolvedContent, "logoImage", "").trim();
  const logoImageSolid = getStringContent(resolvedContent, "logoImageSolid", "").trim();
  const bookNowLabel = getStringContent(resolvedContent, "bookNowLabel", "Book Now");
  const bookNowLink =
    getStringContent(resolvedContent, "bookNowLink", "").trim() ||
    settings.primaryPhoneHref.trim() ||
    "tel:+16132365226";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (!drawerOpen) return;

    const closeOnRouteChange = window.setTimeout(() => {
      setDrawerOpen(false);
    }, 0);

    return () => window.clearTimeout(closeOnRouteChange);
  }, [drawerOpen, pathname]);

  const nav = [
    {
      key: "home",
      label: getStringContent(resolvedContent, "homeLabel", "Home"),
      href: getStringContent(resolvedContent, "homeHref", "/"),
    },
    {
      key: "routes",
      label: getStringContent(resolvedContent, "destinationsLabel", "Destinations"),
      href: getStringContent(resolvedContent, "destinationsHref", "/#destinations"),
      // mega: "routes" as const,
    },
    {
      key: "services",
      label: getStringContent(resolvedContent, "servicesLabel", "Services"),
      href: getStringContent(resolvedContent, "servicesHref", "/#about"),
    },
    {
      key: "contact",
      label: getStringContent(resolvedContent, "contactLabel", "Contact"),
      href: getStringContent(resolvedContent, "contactHref", "/#contact"),
    },
  ];

  const isActive = (item: (typeof nav)[number]) => {
    if (item.key === "routes") {
      return pathname === "/" && false;
    }
    return pathname === item.href;
  };

  const adminActive = pathname.startsWith("/admin");

  return (
    <header className={`site-header ${transparent ? "transparent" : "solid"}`}>
      <div className="header-inner">
        <Link className="brand" href="/">
          <BrandLogo
            solid={!transparent}
            alt={logoAlt}
            src={logoImage || undefined}
            solidSrc={logoImageSolid || undefined}
          />
        </Link>

        <nav className="nav-desktop">
          {nav.map((item) => (
            <div
              key={item.key}
              className="nav-item"
            >
              <Link
                className={`nav-link ${isActive(item) ? "active" : ""}`}
                href={item.href}
              >
                {item.label}
              </Link>
            </div>
          ))}
        </nav>

        <div className="header-right">
          <div className="header-contact">
            <a href={settings.primaryPhoneHref}>{settings.primaryPhoneLabel}</a>
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
          <Link href={bookNowLink} className="header-pill">
            {bookNowLabel}
          </Link>
          <Link
            href="/admin"
            className={`header-pill ${adminActive ? "active" : ""}`}
          >
            Admin Portal
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
              <BrandLogo
                solid
                alt={logoAlt}
                src={logoImage || undefined}
                solidSrc={logoImageSolid || undefined}
              />
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
              {nav.map((item) => (
                <Link
                  key={item.key}
                  className="drawer-link"
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
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
                href={bookNowLink}
                className="header-pill header-pill-drawer"
                onClick={() => setDrawerOpen(false)}
              >
                {bookNowLabel}
              </Link>
              <Link
                href="/admin"
                className={`header-pill header-pill-drawer ${adminActive ? "active" : ""}`}
                onClick={() => setDrawerOpen(false)}
              >
                Admin Portal
              </Link>
              <div className="drawer-contact">
                <div>{settings.primaryPhoneLabel}</div>
                <div>{settings.emailLabel}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
