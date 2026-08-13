"use client";

import { useEffect, useState, useMemo } from "react";
import { Flame, Clock } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings, IDailyOfferItem } from "@/lib/SiteSettingsContext";
import ProductCard from "@/components/ProductCard";

function getOfferTargetTime(expiresAt?: string | null, currentMs?: number): number {
  const nowMs = currentMs ?? Date.now();
  if (expiresAt) {
    const t = new Date(expiresAt).getTime();
    if (!isNaN(t) && t > nowMs) {
      return t;
    }
  }
  const endOfDay = new Date(nowMs);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime();
}

function formatRemainingTime(targetMs: number, currentMs: number) {
  const diff = Math.max(0, targetMs - currentMs);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    isExpired: diff <= 0,
  };
}

export default function DailyOffersSection() {
  const { dailyOffers, loading } = useSiteSettings();
  const { t } = useTranslation();

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter valid offers
  const validOffers = useMemo(() => {
    return dailyOffers.filter(
      (offer): offer is IDailyOfferItem & { product: NonNullable<IDailyOfferItem["product"]> } =>
        Boolean(
          offer.active &&
            offer.product &&
            offer.product._id
        )
    );
  }, [dailyOffers]);

  // If loading settings, render skeleton loader to prevent CLS
  if (loading) {
    return (
      <section className="py-16 sm:py-24 bg-gradient-to-b from-surface/40 via-background to-surface/40 border-y border-border/60 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 animate-pulse motion-reduce:animate-none">
            <div className="space-y-3">
              <div className="h-6 w-32 bg-muted/20 rounded-full" />
              <div className="h-9 w-64 sm:w-80 bg-muted/20 rounded-xl" />
              <div className="h-4 w-72 sm:w-96 bg-muted/20 rounded" />
            </div>
            <div className="h-12 w-48 bg-muted/20 rounded-2xl" />
          </div>

          {/* Cards Skeleton Grid */}
          <div className="border border-border/80 rounded-2xl overflow-hidden bg-border/40 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[1px]">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-card flex flex-col h-full p-4 sm:p-5 animate-pulse justify-between space-y-3 rounded-none"
              >
                <div className="aspect-square bg-surface rounded-lg" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted/20 rounded w-3/4 mx-auto" />
                  <div className="h-3 bg-muted/20 rounded w-full" />
                </div>
                <div className="h-4 bg-muted/20 rounded w-1/3 mx-auto" />
                <div className="h-10 bg-muted/20 rounded-lg w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If no valid active offers exist, render nothing
  if (validOffers.length === 0) {
    return null;
  }

  // Determine section countdown (use minimum target time among active offers or end of day)
  const currentMs = now ?? Date.now();
  const primaryTargetMs = Math.min(
    ...validOffers.map((o) => getOfferTargetTime(o.expiresAt, currentMs))
  );
  const sectionTimer = formatRemainingTime(primaryTargetMs, currentMs);

  return (
    <section
      id="daily-offers"
      className="py-16 sm:py-24 bg-gradient-to-b from-surface/40 via-background to-surface/40 border-y border-border/60 relative overflow-hidden"
    >
      {/* Background glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500/10 dark:bg-red-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/10 to-red-500/10 dark:from-amber-500/20 dark:to-red-500/20 border border-amber-500/20 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 mb-3 shadow-sm">
              <Flame className="h-4 w-4 text-amber-500 animate-bounce motion-reduce:animate-none fill-amber-500" />
              <span>{t("home.dailyOffersTitle")}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t("home.dailyOffersTitle")}
            </h2>
            <p className="text-muted text-sm sm:text-base max-w-xl mt-2 leading-relaxed">
              {t("home.dailyOffersSubtitle")}
            </p>
          </div>

          {/* Section Level Live Clock */}
          <div className="flex items-center gap-3 rounded-2xl bg-card p-3.5 sm:p-4 border border-amber-500/30 shadow-lg shadow-amber-500/10 self-start md:self-auto">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-red-500 text-white shadow-md">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">
                {t("home.endsIn")}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-extrabold">
                <div className="flex items-center justify-center min-w-[34px] px-2 py-1 rounded-lg bg-background border border-border shadow-inner text-amber-500 dark:text-amber-400">
                  {now === null ? "00" : sectionTimer.hours}
                </div>
                <span className="text-amber-500 font-bold">:</span>
                <div className="flex items-center justify-center min-w-[34px] px-2 py-1 rounded-lg bg-background border border-border shadow-inner text-amber-500 dark:text-amber-400">
                  {now === null ? "00" : sectionTimer.minutes}
                </div>
                <span className="text-amber-500 font-bold">:</span>
                <div className="flex items-center justify-center min-w-[34px] px-2 py-1 rounded-lg bg-background border border-border shadow-inner text-amber-500 dark:text-amber-400">
                  {now === null ? "00" : sectionTimer.seconds}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="border border-border/80 rounded-2xl overflow-hidden bg-border/40 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[1px]">
          {validOffers.map((offer) => {
            const product = offer.product;
            return (
              <div key={offer._id || product._id} className="bg-card flex flex-col h-full">
                <ProductCard
                  id={product._id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  image={product.image}
                  category={product.category}
                  company={(product as any).company ?? undefined}
                  stock={product.stock}
                  viewMode="grid"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
