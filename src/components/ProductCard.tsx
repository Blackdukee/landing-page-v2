"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Plus, AlertCircle } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState } from "react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

export interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  company?: { _id: string; name: string; logo: string } | string;
  stock: number;
  viewMode?: "grid" | "list" | "card";
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  image,
  category,
  company,
  stock,
  viewMode = "grid",
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const getItemQuantity = useCartStore((s) => s.getItemQuantity);
  const canAddMore = useCartStore((s) => s.canAddMore);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const { t, locale } = useTranslation();
  const { dailyOffers } = useSiteSettings();

  // Check active daily offer
  const activeOffer = dailyOffers.find(
    (o) =>
      String(o.productId) === String(id) &&
      o.active &&
      (!o.expiresAt || new Date(o.expiresAt).getTime() > Date.now())
  );
  const discountPercentage = activeOffer ? activeOffer.discountPercentage : 0;
  const salePrice = activeOffer
    ? Number((price * (1 - discountPercentage / 100)).toFixed(2))
    : price;
  const savingsAmount = activeOffer
    ? Number((price - salePrice).toFixed(2))
    : 0;

  // Check quantity already in cart
  const quantityInCart = getItemQuantity(id);
  const canAdd = canAddMore(id, stock);
  const isOutOfStock = stock <= 0 || quantityInCart >= stock || !canAdd;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    const success = addItem(
      { productId: id, name, price: salePrice, image },
      stock,
      1
    );
    if (!success) {
      setError(t("cart.insufficientStock"));
      setTimeout(() => setError(""), 3000);
    } else {
      setError("");
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    }
  };

  // Determine brand / company name
  const companyName =
    (typeof company === "object" && company !== null
      ? company.name
      : typeof company === "string"
      ? company
      : "") || category;

  const formattedPrice = price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedSalePrice = salePrice.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedSavings = savingsAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isList = viewMode === "list";
  const isCard = viewMode === "card";

  return (
    <Link href={`/products/${id}`} className="block group h-full">
      <article
        className={`relative flex ${
          isList
            ? "flex-col sm:flex-row items-stretch rounded-xl border border-border"
            : isCard
            ? "flex-col rounded-2xl border border-border"
            : "flex-col rounded-none border-0 shadow-none"
        } bg-card overflow-hidden transition-all duration-300 hover:bg-surface/60 h-full`}
      >
        {/* Product Image Area */}
        <div
          className={`relative aspect-square bg-white dark:bg-card overflow-hidden p-4 flex items-center justify-center shrink-0 ${
            isList ? "w-full sm:w-48" : "w-full"
          }`}
        >
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Savings Badge */}
          {activeOffer && savingsAmount > 0 && (
            <span className="absolute top-2 start-2 z-10 inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-[11px] font-extrabold text-white shadow-sm">
              {locale === "ar"
                ? `وفر EGP ${formattedSavings}`
                : `Save EGP ${formattedSavings}`}
            </span>
          )}

          {/* Cart error alert */}
          {error && (
            <div className="absolute bottom-2 start-2 end-2 z-20 flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-md border border-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-white" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Card Content Area */}
        <div
          className={`flex flex-1 flex-col justify-between p-4 ${
            isList ? "text-start items-start" : "text-center items-center"
          }`}
        >
          {/* Top section: Brand & Title */}
          <div className="w-full">
            {/* Brand / Company Name */}
            <p
              className={`text-[11px] sm:text-xs font-bold text-muted-foreground/70 uppercase tracking-wider mb-1 ${
                isList ? "text-start" : "text-center"
              }`}
            >
              {companyName}
            </p>

            {/* Product Title */}
            <h3
              className={`text-xs sm:text-sm font-bold text-foreground leading-snug line-clamp-3 ${
                isList ? "text-start" : "text-center min-h-[2.5rem] flex items-center justify-center"
              }`}
            >
              {name}
            </h3>

            {isList && description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                {description}
              </p>
            )}
          </div>

          {/* Bottom section: Stock, Pricing, Action Button */}
          <div className="w-full mt-3 flex flex-col gap-2">
            {/* Stock Availability Indicator */}
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                isList ? "justify-start" : "justify-center"
              }`}
            >
              {!isOutOfStock ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {locale === "ar" ? "متوفرة" : t("card.inStockStatus")}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  <span className="text-red-600 dark:text-red-400">
                    {locale === "ar" ? "غير متوفر" : t("card.outOfStockStatus")}
                  </span>
                </>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div
              className={`flex items-baseline gap-2 flex-wrap ${
                isList ? "justify-start" : "justify-center"
              }`}
            >
              {activeOffer ? (
                <>
                  <span className="text-red-600 font-extrabold text-sm sm:text-base">
                    EGP {formattedSalePrice}
                  </span>
                  <span className="text-xs text-muted-foreground/70 line-through">
                    EGP {formattedPrice}
                  </span>
                </>
              ) : (
                <span className="text-primary font-extrabold text-sm sm:text-base">
                  EGP {formattedPrice}
                </span>
              )}
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock}
              aria-label={
                isOutOfStock
                  ? t("card.soldOut")
                  : quantityInCart > 0
                  ? `${t("card.addToCart")} (${quantityInCart})`
                  : t("card.addToCart")
              }
              className="bg-[#0096c7] hover:bg-[#0077b6] text-white font-bold py-2.5 px-3 rounded-lg w-full text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {added ? (
                <>
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span>
                    {t("card.added")} {quantityInCart > 0 ? `(${quantityInCart})` : ""}
                  </span>
                </>
              ) : isOutOfStock ? (
                <span>{t("card.soldOut")}</span>
              ) : (
                <>
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>
                    {t("card.addToCart")}{" "}
                    {quantityInCart > 0 ? `(${quantityInCart})` : ""}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}


