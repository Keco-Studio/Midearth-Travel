import type { Metadata } from "next";
import { FooterContentProvider } from "@/context/footer-content-context";
import { LangProvider } from "@/context/lang-context";
import { NavbarContentProvider } from "@/context/navbar-content-context";
import { SiteSettingsProvider } from "@/context/site-settings-context";
import { getHomeModule } from "@/lib/home-content";
import { loadPublishedHomeModules } from "@/lib/supabase-home-content";
import { loadGlobalSettings } from "@/lib/supabase-global-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadGlobalSettings().catch(() => null);
  const siteName = settings?.siteName?.trim() || "Midearth Travel";
  const tagline = settings?.tagline?.trim() || "Ottawa Travel Agency | Bus Tours";

  return {
    title: `${siteName} | ${tagline}`,
    description:
      settings?.tagline?.trim() ||
      "Ottawa's premier travel agency specializing in all-inclusive vacation packages, bus tours to Canada and the United States, air tickets, and hotel reservations.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, modules] = await Promise.all([
    loadGlobalSettings(),
    loadPublishedHomeModules().catch(() => []),
  ]);
  const navbarContent = getHomeModule(modules, "navbar").data;
  const footerContent = getHomeModule(modules, "footer").data;

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="preload"
          href="/fonts/zcool-xiaowei-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full font-sans antialiased">
        <SiteSettingsProvider settings={settings}>
          <NavbarContentProvider content={navbarContent}>
            <FooterContentProvider content={footerContent}>
              <LangProvider>{children}</LangProvider>
            </FooterContentProvider>
          </NavbarContentProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
