"use client";

import Link from "next/link";
import { Sparkles, Instagram, Twitter, Mail } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

export default function Footer() {
  const { t } = useTranslation();
  const { websiteName } = useSiteSettings();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-400 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                {websiteName}
              </span>
            </Link>
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-muted hover:text-primary transition-colors duration-200">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted hover:text-primary transition-colors duration-200">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted hover:text-primary transition-colors duration-200">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-4">
              {t("footer.shop")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-sm text-muted hover:text-foreground transition-colors duration-200">
                  {t("footer.allProducts")}
                </Link>
              </li>
              <li>
                <Link href="/products?category=Electronics" className="text-sm text-muted hover:text-foreground transition-colors duration-200">
                  {t("footer.electronics")}
                </Link>
              </li>
              <li>
                <Link href="/products?category=Fashion" className="text-sm text-muted hover:text-foreground transition-colors duration-200">
                  {t("footer.fashion")}
                </Link>
              </li>
              <li>
                <Link href="/products?category=Home" className="text-sm text-muted hover:text-foreground transition-colors duration-200">
                  {t("footer.homeLiving")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-4">
              {t("footer.company")}
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-muted hover:text-foreground transition-colors duration-200">
                  {t("footer.aboutUs")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted hover:text-foreground transition-colors duration-200">
                  {t("footer.shippingReturns")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted hover:text-foreground transition-colors duration-200">
                  {t("footer.contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            {t("footer.copyright", { year: String(new Date().getFullYear()) })}
          </p>
          <p className="text-xs text-muted">
            {t("footer.bottomText")}
          </p>
        </div>
      </div>
    </footer>
  );
}
