"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

export interface Company {
  _id: string;
  name: string;
  logo: string;
  description?: string;
}

interface BrandHeroSectionProps {
  companies: Company[];
  loading?: boolean;
}

export default function BrandHeroSection({
  companies,
  loading = false,
}: BrandHeroSectionProps) {
  const { t, dir } = useTranslation();
  const { freeDeliveryMinPrice, returnDays } = useSiteSettings();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotate brand spotlight every 5s if not hovered
  useEffect(() => {
    if (companies.length <= 1 || isHovered) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % companies.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [companies.length, isHovered]);

  const activeCompany = companies[activeIndex] || null;

  const nextCompany = () => {
    if (companies.length > 0) {
      setActiveIndex((prev) => (prev + 1) % companies.length);
    }
  };

  const prevCompany = () => {
    if (companies.length > 0) {
      setActiveIndex((prev) => (prev - 1 + companies.length) % companies.length);
    }
  };

  return (
    <section className="relative min-h-[90svh] flex flex-col justify-between overflow-hidden pt-28 pb-12">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/40 to-background" />
        <div className="absolute top-1/4 -start-32 w-96 h-96 bg-primary/15 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 end-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 start-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-8 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Text & Value Proposition (Right col in RTL) */}
          <div className="lg:col-span-7 text-start">
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-semibold text-primary mb-6 shadow-sm border border-primary/20">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t("home.brandHeroBadge")}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.15] tracking-tight mb-6">
              {t("home.brandHeroLine1")}
              <br />
              <span className="gradient-text">{t("home.brandHeroLine2")}</span>{" "}
              {t("home.brandHeroLine3")}
            </h1>

            <p className="text-base sm:text-lg text-muted leading-relaxed mb-8 max-w-xl">
              {t("home.brandHeroDesc")}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link
                href="/products"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-primary to-blue-600 px-8 py-4 text-sm font-bold text-white transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("home.explore")}
                <ArrowRight
                  className={`h-4 w-4 transition-transform ${
                    dir === "rtl"
                      ? "rotate-180 group-hover:-translate-x-1"
                      : "group-hover:translate-x-1"
                  }`}
                />
              </Link>

              <a
                href="#brands-marquee"
                className="inline-flex items-center gap-2 rounded-full glass px-7 py-4 text-sm font-semibold text-foreground transition-all hover:bg-glass-border hover:border-primary/30"
              >
                {t("home.browseByBrand")}
              </a>
            </div>

            {/* Micro Guarantees */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 border border-border">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>منتجات أصلية 100%</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 border border-border">
                <Award className="h-3.5 w-3.5 text-primary" />
                <span>ضمان الوكيل المعتمد</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 border border-border">
                <Truck className="h-3.5 w-3.5 text-blue-600" />
                <span>شحن سريع لجميع المحافظات</span>
              </div>
            </div>
          </div>

          {/* Brand Spotlight Card (Left col in RTL) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {loading ? (
              <div className="w-full max-w-md rounded-3xl bg-card border border-border p-8 animate-pulse">
                <div className="h-28 bg-surface rounded-2xl mb-6" />
                <div className="h-6 bg-muted/20 rounded w-1/2 mb-3" />
                <div className="h-4 bg-muted/20 rounded w-full mb-6" />
                <div className="h-12 bg-muted/20 rounded-2xl w-full" />
              </div>
            ) : activeCompany ? (
              <div
                className="relative w-full max-w-md group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Ambient glow around spotlight card */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition duration-700" />

                <div className="relative rounded-3xl glass p-7 sm:p-8 border border-border shadow-xl backdrop-blur-xl flex flex-col justify-between transition-all duration-300">
                  {/* Top bar: Verified badge & Controls */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold border border-primary/20">
                      <Award className="h-3.5 w-3.5 text-primary" />
                      {t("home.authorizedPartner")}
                    </span>

                    {companies.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={prevCompany}
                          aria-label="Previous Brand"
                          className="h-7 w-7 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-colors cursor-pointer"
                        >
                          <ChevronRight
                            className={`h-4 w-4 ${dir === "rtl" ? "" : "rotate-180"}`}
                          />
                        </button>
                        <button
                          onClick={nextCompany}
                          aria-label="Next Brand"
                          className="h-7 w-7 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-colors cursor-pointer"
                        >
                          <ChevronLeft
                            className={`h-4 w-4 ${dir === "rtl" ? "" : "rotate-180"}`}
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Brand Logo & Presentation */}
                  <div className="flex flex-col items-center text-center my-4">
                    <div className="relative h-24 w-44 sm:h-28 sm:w-52 flex items-center justify-center p-3 rounded-2xl bg-white shadow-sm border border-border mb-5 overflow-hidden">
                      <img
                        src={activeCompany.logo}
                        alt={activeCompany.name}
                        className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                      {activeCompany.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted line-clamp-2 max-w-xs leading-relaxed">
                      {activeCompany.description ||
                        "أجود أنواع العدد والمعدات الأصلية بأعلى معايير الكفاءة والمتانة."}
                    </p>
                  </div>

                  {/* Direct Link to Company's Products */}
                  <div className="mt-6 pt-5 border-t border-border/80 flex flex-col gap-3">
                    <Link
                      href={`/products?company=${activeCompany._id}`}
                      className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-primary/90 transition-all duration-200 cursor-pointer"
                    >
                      <span>
                        {t("home.viewBrandProducts", { brand: activeCompany.name })}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110" />
                    </Link>

                    {/* Quick Thumbnail Selector if multiple companies */}
                    {companies.length > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        {companies.map((c, i) => (
                          <button
                            key={c._id}
                            onClick={() => setActiveIndex(i)}
                            aria-label={`Select brand: ${c.name}`}
                            className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                              i === activeIndex
                                ? "w-8 bg-primary"
                                : "w-2.5 bg-muted/30 hover:bg-muted/60"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Infinite Brand Logo Marquee Ribbon */}
      <div id="brands-marquee" className="relative z-10 w-full mt-16 pt-8 border-t border-border/80 bg-surface/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted">
              {t("home.allBrands")}
            </span>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("home.viewAll")} ←
          </Link>
        </div>

        {/* Marquee Scroller */}
        <div className="relative w-full overflow-hidden py-3">
          {/* Gradient Edges for Smooth Fade */}
          <div className="pointer-events-none absolute inset-y-0 start-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 end-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />

          {loading ? (
            <div className="flex justify-center gap-4 py-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-32 rounded-xl bg-surface animate-pulse border border-border"
                />
              ))}
            </div>
          ) : companies.length > 0 ? (
            <div className="animate-marquee gap-4 px-4 items-center">
              {/* Duplicate array for seamless infinite scroll */}
              {[...companies, ...companies, ...companies, ...companies].map(
                (comp, idx) => (
                  <Link
                    key={`${comp._id}-${idx}`}
                    href={`/products?company=${comp._id}`}
                    className="group flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border border-border hover:border-primary/40 hover:shadow-md transition-all duration-300 shrink-0"
                    title={comp.name}
                  >
                    <div className="relative h-7 w-16 flex items-center justify-center">
                      <img
                        src={comp.logo}
                        alt={comp.name}
                        className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {comp.name}
                    </span>
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-muted">
              {t("home.noCompanies")}
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border">
            {[
              {
                icon: Truck,
                text: t("home.freeDelivery"),
                sub: t("home.freeDeliverySub", {
                  price: String(freeDeliveryMinPrice),
                }),
              },
              {
                icon: ShieldCheck,
                text: t("home.easyReturns"),
                sub: t("home.easyReturnsSub", { days: String(returnDays) }),
              },
              {
                icon: Headphones,
                text: t("home.support"),
                sub: t("home.supportSub"),
              },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{text}</p>
                  <p className="text-xs text-muted">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
