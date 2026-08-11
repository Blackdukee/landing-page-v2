"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { Truck, ShieldCheck, Headphones } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { Company } from "./BrandHeroSection";

interface BrandTickerAndTrustBadgesProps {
  companies: Company[];
}

export default function BrandTickerAndTrustBadges({
  companies,
}: BrandTickerAndTrustBadgesProps) {
  const { t } = useTranslation();
  const { freeDeliveryMinPrice, returnDays } = useSiteSettings();

  // Create continuous ticker items for smooth infinite scrolling
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
    <section className="relative py-6 sm:py-8 overflow-hidden">
      {/* ───────────── MOVING LINE (INFINITE BRAND LOGO MARQUEE) ───────────── */}
      {tickerItems.length > 0 && (
        <div className="relative w-full overflow-hidden py-3.5 mb-8 bg-surface/60 border-y border-border/70">
          {/* Left & Right Gradient Edges for Smooth Fade */}
          <div className="pointer-events-none absolute inset-y-0 start-0 w-16 sm:w-28 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 end-0 w-16 sm:w-28 bg-gradient-to-l from-background to-transparent z-10" />

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

      {/* ───────────── TRUST BADGES ROW ───────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
