"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Facebook, Twitter, Mail, MapPin } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

export default function Footer() {
  const { t } = useTranslation();
  const { websiteName, favicon, socialLinks, location } = useSiteSettings();

  const hasAnySocial = socialLinks.facebook || socialLinks.twitter || socialLinks.email;
  const storeLocation = location?.trim();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-400 text-white overflow-hidden">
                {favicon ? (
                  <Image src={favicon} alt={websiteName} width={32} height={32} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </div>
              <span className="text-lg font-bold tracking-tight">
                {websiteName}
              </span>
            </Link>
            <p className="text-sm text-muted max-w-sm leading-relaxed mb-3">
              {t("footer.tagline")}
            </p>

            {storeLocation ? (
              <div className="inline-flex items-center gap-1.5 text-xs text-muted font-medium bg-card px-3 py-1.5 rounded-full border border-border/80">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{storeLocation}</span>
              </div>
            ) : null}

            {hasAnySocial && (
              <div className="flex gap-4 mt-6">
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted hover:text-primary transition-colors duration-200">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-muted hover:text-primary transition-colors duration-200">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.email && (
                  <a href={`mailto:${socialLinks.email}`} aria-label="Email support" className="text-muted hover:text-primary transition-colors duration-200">
                    <Mail className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
              {t("footer.shop")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-sm text-muted hover:text-foreground transition-colors duration-200">
                  {t("footer.allProducts")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
              {t("footer.company")}
            </h3>
            <ul className="space-y-3">
              <li>
                <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""}?text=Hi,%20I%20have%20a%20question`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground transition-colors duration-200">
                  {t("footer.aboutUs")}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""}?text=Hi,%20I%20have%20a%20question%20about%20shipping`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground transition-colors duration-200">
                  {t("footer.shippingReturns")}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground transition-colors duration-200">
                  {t("footer.contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            {t("footer.copyright", { year: String(new Date().getFullYear()), shopName: websiteName })}{storeLocation ? ` · ${storeLocation}` : ""}
          </p>
          <p className="text-xs text-muted">
            معدات وأدوات TOTAL الأصلية · شحن سريع لجميع المحافظات
          </p>
        </div>
      </div>
    </footer>
  );
}
