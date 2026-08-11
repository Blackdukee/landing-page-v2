"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Flame, Clock, Zap, ShoppingBag, Check, AlertCircle } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings, IDailyOfferItem } from "@/lib/SiteSettingsContext";
import { useCartStore } from "@/store/cart";

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
  const addItem = useCartStore((s) => s.addItem);
  const getItemQuantity = useCartStore((s) => s.getItemQuantity);
  const canAddMore = useCartStore((s) => s.canAddMore);

  const [now, setNow] = useState<number | null>(null);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-card border border-border/80 overflow-hidden animate-pulse motion-reduce:animate-none flex flex-col"
              >
                <div className="aspect-square bg-surface" />
                <div className="p-5 flex flex-1 flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted/20 rounded w-3/4" />
                    <div className="h-4 bg-muted/20 rounded w-full" />
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="h-6 bg-muted/20 rounded w-1/2" />
                    <div className="h-4 bg-muted/20 rounded w-1/3" />
                  </div>
                  <div className="h-11 bg-muted/20 rounded-xl w-full min-h-[44px]" />
                </div>
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

  const handleAddToCart = (
    e: React.MouseEvent,
    offer: IDailyOfferItem & { product: NonNullable<IDailyOfferItem["product"]> }
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const product = offer.product;
    const originalPrice = product.price;
    const salePrice = Number((originalPrice * (1 - offer.discountPercentage / 100)).toFixed(2));

    const quantityInCart = getItemQuantity(product._id);
    const canAdd = canAddMore(product._id, product.stock);
    const isOutOfStock = product.stock <= 0 || quantityInCart >= product.stock || !canAdd;

    if (isOutOfStock) return;

    const success = addItem(
      {
        productId: product._id,
        name: product.name,
        price: salePrice,
        image: product.image,
      },
      product.stock,
      1
    );

    if (success) {
      setErrorMap((prev) => ({ ...prev, [product._id]: "" }));
      setAddedMap((prev) => ({ ...prev, [product._id]: true }));
      setTimeout(() => {
        setAddedMap((prev) => ({ ...prev, [product._id]: false }));
      }, 1500);
    } else {
      setErrorMap((prev) => ({ ...prev, [product._id]: t("cart.insufficientStock") }));
      setTimeout(() => {
        setErrorMap((prev) => ({ ...prev, [product._id]: "" }));
      }, 3000);
    }
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {validOffers.map((offer) => {
            const product = offer.product;
            const originalPrice = product.price;
            const salePrice = Number(
              (originalPrice * (1 - offer.discountPercentage / 100)).toFixed(2)
            );
            const savings = Number((originalPrice - salePrice).toFixed(2));

            const quantityInCart = getItemQuantity(product._id);
            const canAdd = canAddMore(product._id, product.stock);
            const isOutOfStock =
              product.stock <= 0 || quantityInCart >= product.stock || !canAdd;
            const isAdded = Boolean(addedMap[product._id]);
            const errorMsg = errorMap[product._id];

            const stockLeft = Math.max(0, product.stock - quantityInCart);

            return (
              <article
                key={offer._id || product._id}
                className="group relative flex flex-col rounded-2xl bg-card border border-border/80 overflow-hidden transition-all duration-500 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
              >
                {/* Product Image Box */}
                <div className="relative aspect-square overflow-hidden bg-surface">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Corner Discount Flame Badge */}
                  <div className="absolute top-3 start-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 via-amber-600 to-orange-500 text-white px-3 py-1 text-xs font-black shadow-lg shadow-red-500/30 backdrop-blur-sm animate-pulse motion-reduce:animate-none">
                    <Flame className="h-3.5 w-3.5 fill-white text-white shrink-0" />
                    <span>-{offer.discountPercentage}% {t("home.off")}</span>
                  </div>

                  {/* Category Pill */}
                  <span className="absolute top-3 end-3 z-10 rounded-full bg-black/65 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white border border-white/20 shadow-sm">
                    {product.category}
                  </span>

                  {/* Error Toast on Card */}
                  {errorMsg && (
                    <div className="absolute bottom-3 start-3 end-3 z-20 flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-[11px] font-medium text-white shadow-md border border-red-700 animate-shake">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-white" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>

                {/* Info Container */}
                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-base leading-snug text-foreground line-clamp-1 group-hover:text-amber-500 transition-colors">
                      <Link href={`/products/${product._id}`}>
                        {product.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted leading-relaxed line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  </div>

                  {/* Pricing Details */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-500 dark:text-amber-400">
                        EGP {salePrice.toFixed(2)}
                      </span>
                      <span className="text-xs sm:text-sm text-muted/70 line-through">
                        EGP {originalPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-bold">
                        <Zap className="h-3 w-3 shrink-0" />
                        <span>{t("home.saveAmount", { amount: savings.toFixed(2) })}</span>
                      </span>

                      {stockLeft > 0 && stockLeft <= 5 && (
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0 text-amber-500" />
                          <span>{t("card.onlyLeft", { count: stockLeft })}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Claim Deal / Add to Cart Button */}
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, offer)}
                    disabled={isOutOfStock}
                    aria-label={`${t("home.claimDeal")} - ${product.name}`}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-4.5 w-4.5 shrink-0 text-white stroke-[3]" />
                        <span>
                          {t("card.added")} {quantityInCart > 0 ? `(${quantityInCart})` : ""}
                        </span>
                      </>
                    ) : isOutOfStock ? (
                      <span>{t("card.soldOut")}</span>
                    ) : (
                      <>
                        <ShoppingBag className="h-4.5 w-4.5 shrink-0" />
                        <span>
                          {t("home.claimDeal")}{" "}
                          {quantityInCart > 0 ? `(${quantityInCart})` : ""}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
