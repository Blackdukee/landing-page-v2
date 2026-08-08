"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { SiteSettingsProvider, useSiteSettings } from "@/lib/SiteSettingsContext";

function DynamicTitle() {
  const { websiteName, favicon } = useSiteSettings();

  useEffect(() => {
    if (!favicon) return;

    try {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/png";
        document.head.appendChild(link);
      }
      link.href = favicon;
    } catch {
      // Ignore DOM errors if running in non-standard environment
    }
  }, [favicon]);

  return null;
}

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <LanguageProvider>
      <SiteSettingsProvider>
        <DynamicTitle />
        {!isAdmin && <Navbar />}
        <main className="min-h-screen">{children}</main>
        {!isAdmin && <Footer />}
      </SiteSettingsProvider>
    </LanguageProvider>
  );
}
