"use client";

import Link from "next/link";
import { useState, useEffect, useSyncExternalStore } from "react";
import { ShoppingBag, Menu, X, Sparkles, Globe } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useTranslation } from "@/i18n/LanguageContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const itemCount = useCartStore((s) => s.totalItems());
  const { locale, setLocale, t } = useTranslation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const displayCount = mounted ? itemCount : 0;
  const toggleLocale = () => setLocale(locale === "en" ? "ar" : "en");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-surface/80 backdrop-blur-xl border-b border-glass-border shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-400 text-white transition-all group-hover:shadow-lg group-hover:shadow-primary/30 group-hover:scale-105">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Quesna<span className="text-primary">Shop</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors duration-200"
          >
            {t("nav.home")}
          </Link>
          <Link
            href="/products"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors duration-200"
          >
            {t("nav.shop")}
          </Link>

          {/* Language Toggle */}
          <button
            onClick={toggleLocale}
            className="inline-flex items-center gap-1.5 rounded-full glass px-3.5 py-2 text-xs font-semibold text-muted hover:text-foreground transition-all hover:border-primary/30"
          >
            <Globe className="h-3.5 w-3.5" />
            {locale === "en" ? t("lang.ar") : t("lang.en")}
          </button>

          <Link
            href="/cart"
            className="relative group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{t("nav.cart")}</span>
            {displayCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary text-[11px] font-bold shadow-md">
                {displayCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Language Toggle (mobile) */}
          <button
            onClick={toggleLocale}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-glass transition-colors"
          >
            <Globe className="h-5 w-5" />
          </button>
          <Link href="/cart" className="relative p-2 text-foreground">
            <ShoppingBag className="h-5 w-5" />
            {displayCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {displayCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-foreground hover:bg-glass transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-glass-border bg-surface/95 backdrop-blur-xl">
          <div className="flex flex-col px-6 py-4 gap-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium py-3 px-3 rounded-lg text-muted hover:text-foreground hover:bg-glass transition-all"
            >
              {t("nav.home")}
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium py-3 px-3 rounded-lg text-muted hover:text-foreground hover:bg-glass transition-all"
            >
              {t("nav.shop")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
