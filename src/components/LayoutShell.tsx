"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { SiteSettingsProvider, useSiteSettings } from "@/lib/SiteSettingsContext";

function DynamicTitle() {
  const { websiteName } = useSiteSettings();
  useEffect(() => {
    if (websiteName) {
      document.title = `${websiteName} | Modern Online Store`;
    }
  }, [websiteName]);
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
