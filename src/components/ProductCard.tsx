"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Plus, AlertCircle, Flame } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState } from "react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  company?: { _id: string; name: string; logo: string } | string;
  stock: number;
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
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const getItemQuantity = useCartStore((s) => s.getItemQuantity);
  const canAddMore = useCartStore((s) => s.canAddMore);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();
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

  // Check quantity already in cart
  const quantityInCart = getItemQuantity(id);
  const canAdd = canAddMore(id, stock);
  const isOutOfStock = stock <= 0 || quantityInCart >= stock || !canAdd;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    const success = addItem({ productId: id, name, price: salePrice, image }, stock, 1);
    if (!success) {
      setError(t("cart.insufficientStock"));
      setTimeout(() => setError(""), 3000);
    } else {
      setError("");
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    }
  };

  const buttonLabel = isOutOfStock
    ? t("card.soldOut")
    : quantityInCart > 0
    ? `${t("card.addToCart")} (${quantityInCart})`
    : t("card.addToCart");

  return (
    <Link href={`/products/${id}`} className="block group">
      <article className="relative flex flex-col rounded-2xl bg-card border border-border overflow-hidden transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-surface">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Error notification */}
          {error && (
            <div className="absolute bottom-3 start-3 end-3 z-10 flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-[11px] font-medium text-white shadow-md border border-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-white" />
              {error}
            </div>
          )}

          {/* Category & Company badges */}
          <div className="absolute top-3 start-3 z-10 flex items-center gap-1.5 flex-wrap max-w-[calc(100%-4rem)]">
            <span className="rounded-full bg-black/65 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white border border-white/20 shadow-sm">
              {category}
            </span>
            {(() => {
              const compObj = typeof company === "object" && company !== null ? company : null;
              if (!compObj || !compObj.name) return null;
              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white border border-white/20 shadow-sm">
                  {compObj.logo && (
                    <img
                      src={compObj.logo}
                      alt={compObj.name}
                      className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
                    />
                  )}
                  <span>{compObj.name}</span>
                </span>
              );
            })()}
          </div>

          {/* Daily Offer Discount Badge */}
          {activeOffer && (
            <span className="absolute top-3 end-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 via-amber-600 to-orange-500 text-white px-2.5 py-1 text-[10px] font-black shadow-md shadow-red-500/20 backdrop-blur-sm animate-pulse motion-reduce:animate-none">
              <Flame className="h-3 w-3 fill-white text-white shrink-0" />
              <span>-{discountPercentage}% {t("home.off")}</span>
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between p-3 sm:p-5">
          <div>
            <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-1 text-foreground">
              {name}
            </h3>
            <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">
              {description}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`text-base font-bold tracking-tight ${activeOffer ? "text-amber-500 dark:text-amber-400" : "gradient-text"}`}>
                EGP {salePrice.toFixed(2)}
              </span>
              {activeOffer && (
                <span className="text-xs text-muted/70 line-through">
                  EGP {price.toFixed(2)}
                </span>
              )}
            </div>
            {!isOutOfStock && stock > 0 && stock - quantityInCart <= 5 && (
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                {t("card.onlyLeft", { count: stock - quantityInCart })}
              </span>
            )}
          </div>

          {/* Add to Cart button - visible and accessible on all viewports */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            aria-label={buttonLabel}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 mt-3 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
      </article>
    </Link>
  );
}

