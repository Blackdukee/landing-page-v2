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
    if (websiteName) {
      document.title = `${websiteName} | Modern Online Store`;
    }
  }, [websiteName]);

  useEffect(() => {
    // Remove any existing icon links
    const existingIcons = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
    existingIcons.forEach((el) => el.remove());

    if (!favicon) return;

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/x-icon";
    link.href = favicon.includes("?") ? `${favicon}&v=${Date.now()}` : `${favicon}?v=${Date.now()}`;
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
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
