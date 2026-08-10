"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import {
  Truck,
  ShieldCheck,
  Headphones,
  Sparkles,
  Award,
  ArrowRight,
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

  // Create a continuous, smooth ticker array with enough items for seamless scrolling
  const tickerItems = useMemo(() => {
    if (companies.length === 0) return [];
    const minItems = 16;
    const repeatCount = Math.ceil(minItems / companies.length) * 2;
    const items: Company[] = [];
    for (let i = 0; i < repeatCount; i++) {
      items.push(...companies);
    }
    return items;
  }, [companies]);

  return (
    <section className="relative overflow-hidden pt-28 pb-10">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/40 to-background" />
        <div className="absolute top-10 start-1/3 w-96 h-96 bg-primary/10 rounded-full blur-[130px]" />
        <div className="absolute top-20 end-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-bold text-primary mb-4 border border-primary/20 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{t("home.allBrands")}</span>
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight mb-3">
            تسوق من أشهر العلامات التجارية
          </h1>

          <p className="text-sm sm:text-base text-muted leading-relaxed">
            موزع ووكيل معتمد لأقوى الماركات العالمية في العدد والمعدات الأصلية بضمان شامل وتوصيل سريع.
          </p>
        </div>

        {/* Premium Brand Bento Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-3xl bg-card border border-border p-7 animate-pulse shadow-sm flex flex-col justify-between h-72"
              >
                <div className="h-6 w-24 bg-surface rounded-full mb-4" />
                <div className="h-20 w-36 bg-surface rounded-2xl mx-auto my-auto" />
                <div className="h-5 w-32 bg-surface rounded-md mx-auto mb-2" />
                <div className="h-10 w-full bg-surface rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : companies.length === 1 ? (
          /* Single Brand Flagship Bento Card Layout */
          <div className="max-w-3xl mx-auto">
            {companies.map((comp) => (
              <div
                key={comp._id}
                className="group relative rounded-3xl glass border border-border p-8 sm:p-10 shadow-xl backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  {/* Logo Container */}
                  <div className="md:col-span-5 flex justify-center">
                    <div className="relative h-32 w-full max-w-[240px] flex items-center justify-center p-5 rounded-2xl bg-white shadow-md border border-border overflow-hidden transition-transform duration-500 group-hover:scale-105">
                      <Image
                        src={comp.logo}
                        alt={comp.name}
                        width={200}
                        height={80}
                        className="max-h-full max-w-full object-contain"
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Details & CTA */}
                  <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-start">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3.5 py-1 text-xs font-bold border border-primary/20 mb-3">
                      <Award className="h-3.5 w-3.5" />
                      <span>{t("home.authorizedPartner")}</span>
                    </span>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
                      {comp.name}
                    </h2>

                    <p className="text-xs sm:text-sm text-muted mb-6 leading-relaxed max-w-md">
                      {comp.description ||
                        "أقوى المعدات والأدوات اليدوية والكهربائية الأصلية بضمان الوكيل المعتمد في مصر."}
                    </p>

                    <Link
                      href={`/products?company=${comp._id}`}
                      className="group/btn inline-flex items-center gap-2.5 rounded-2xl bg-primary px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 cursor-pointer"
                    >
                      <span>
                        {t("home.viewBrandProducts", { brand: comp.name })}
                      </span>
                      <ArrowRight
                        className={`h-4 w-4 transition-transform ${
                          dir === "rtl"
                            ? "rotate-180 group-hover/btn:-translate-x-1"
                            : "group-hover/btn:translate-x-1"
                        }`}
                      />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : companies.length > 1 ? (
          /* Multi-Brand Bento Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {companies.map((comp) => (
              <div
                key={comp._id}
                className="group relative rounded-3xl glass border border-border p-6 sm:p-7 shadow-sm backdrop-blur-xl flex flex-col justify-between transition-all duration-500 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold border border-primary/20">
                    <ShieldCheck className="h-3 w-3" />
                    <span>أصلي 100%</span>
                  </span>
                  <span className="text-[11px] font-medium text-muted">
                    ضمان معتمد
                  </span>
                </div>

                {/* Logo */}
                <div className="flex flex-col items-center text-center my-3">
                  <div className="relative h-20 w-44 flex items-center justify-center p-3 rounded-2xl bg-white shadow-xs border border-border mb-4 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                    <Image
                      src={comp.logo}
                      alt={comp.name}
                      width={160}
                      height={60}
                      className="max-h-full max-w-full object-contain"
                      unoptimized
                    />
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {comp.name}
                  </h3>

                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {comp.description ||
                      "أجود أنواع المعدات والأدوات بضمان الوكيل المعتمد."}
                  </p>
                </div>

                {/* CTA Button */}
                <div className="mt-5 pt-4 border-t border-border/70">
                  <Link
                    href={`/products?company=${comp._id}`}
                    className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 cursor-pointer shadow-xs"
                  >
                    <span>
                      {t("home.viewBrandProducts", { brand: comp.name })}
                    </span>
                    <ArrowRight
                      className={`h-3.5 w-3.5 transition-transform ${
                        dir === "rtl"
                          ? "rotate-180 group-hover/btn:-translate-x-1"
                          : "group-hover/btn:translate-x-1"
                      }`}
                    />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 rounded-3xl bg-surface/50 border border-border max-w-md mx-auto">
            <p className="text-sm text-muted">{t("home.noCompanies")}</p>
          </div>
        )}
      </div>

      {/* ───────────── MOVING LINE (INFINITE BRAND LOGO MARQUEE) ───────────── */}
      {tickerItems.length > 0 && (
        <div className="relative w-full overflow-hidden py-4 my-10 bg-surface/60 border-y border-border/70">
          {/* Left & Right Gradient Edges for Smooth Fade */}
          <div className="pointer-events-none absolute inset-y-0 start-0 w-20 sm:w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 end-0 w-20 sm:w-32 bg-gradient-to-l from-background to-transparent z-10" />

          {/* Marquee Track */}
          <div className="animate-marquee gap-4 items-center">
            {tickerItems.map((comp, idx) => (
              <Link
                key={`${comp._id}-${idx}`}
                href={`/products?company=${comp._id}`}
                className="group inline-flex items-center gap-3 px-5 py-2 rounded-full bg-card border border-border/90 shadow-xs hover:border-primary/50 hover:shadow-md hover:scale-105 transition-all duration-300 shrink-0 mx-1 cursor-pointer"
                title={comp.name}
              >
                <div className="relative h-6 w-16 sm:h-7 sm:w-20 flex items-center justify-center">
                  <Image
                    src={comp.logo}
                    alt={comp.name}
                    width={80}
                    height={28}
                    className="max-h-full max-w-full object-contain mix-blend-multiply grayscale group-hover:grayscale-0 transition-all duration-300"
                    unoptimized
                  />
                </div>
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  {comp.name}
                </span>
                <span className="text-[10px] text-primary font-medium opacity-60 group-hover:opacity-100">
                  ✦
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trust Badges Row */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
            <div
              key={text}
              className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl glass border border-border/80 shadow-xs transition-all hover:border-primary/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-0.5">
                  {text}
                </p>
                <p className="text-xs text-muted">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
