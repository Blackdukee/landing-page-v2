"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Plus } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState } from "react";
import { useTranslation } from "@/i18n/LanguageContext";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  image,
  category,
  stock,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const { t } = useTranslation();

  const handleAdd = () => {
    addItem({ productId: id, name, price, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Link href={`/products/${id}`} className="block">
      <article className="group relative flex flex-col rounded-2xl bg-card border border-border overflow-hidden transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-surface">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Quick Add button — desktop only (hover) */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdd(); }}
            disabled={stock === 0}
            className="hidden sm:flex absolute bottom-3 end-3 items-center gap-1.5 rounded-full bg-primary/90 backdrop-blur-sm px-3.5 py-2 text-xs font-medium text-white shadow-lg shadow-primary/20 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
          {added ? (
            <>
              <ShoppingBag className="h-3.5 w-3.5" />
              {t("card.added")}
            </>
          ) : stock === 0 ? (
            t("card.soldOut")
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              {t("card.addToCart")}
            </>
          )}
        </button>

        {/* Category badge */}
        <span className="absolute top-3 start-3 rounded-full glass-strong px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90">
          {category}
        </span>
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
          <span className="text-base font-bold tracking-tight gradient-text">
            EGP {price.toFixed(2)}
          </span>
          {stock > 0 && stock <= 5 && (
            <span className="text-[10px] font-medium text-primary-light">
              {t("card.onlyLeft", { count: stock })}
            </span>
          )}
        </div>

        {/* Mobile Add to Cart button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdd(); }}
          disabled={stock === 0}
          className="sm:hidden flex w-full items-center justify-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5 mt-2 text-[11px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {added ? (
            <>
              <ShoppingBag className="h-3 w-3" />
              {t("card.added")}
            </>
          ) : stock === 0 ? (
            t("card.soldOut")
          ) : (
            <>
              <Plus className="h-3 w-3" />
              {t("card.addToCart")}
            </>
          )}
        </button>
      </div>
    </article>
    </Link>
  );
}
