"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Package,
  Truck,
  Shield,
  Star,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import ImageCarousel from "@/components/ImageCarousel";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  stock: number;
  category: string;
  featured: boolean;
  createdAt: string;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { t, dir } = useTranslation();
  const { freeDeliveryMinPrice, returnDays } = useSiteSettings();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Product not found");
        return r.json();
      })
      .then((data) => setProduct(data))
      .catch(() => setError("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    let failed = false;
    for (let i = 0; i < quantity; i++) {
      const success = addItem({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || product.image,
      }, product.stock);
      if (!success) {
        failed = true;
        break;
      }
    }
    if (failed) {
      setError(t("detail.stockLimitError") || "Not enough stock available");
      setTimeout(() => setError(""), 3000);
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square rounded-2xl bg-surface animate-pulse" />
            <div className="space-y-6">
              <div className="h-4 w-20 bg-surface rounded animate-pulse" />
              <div className="h-10 w-3/4 bg-surface rounded animate-pulse" />
              <div className="h-8 w-32 bg-surface rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-surface rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-surface rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-surface rounded animate-pulse" />
              </div>
              <div className="h-12 w-full bg-surface rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pt-24 pb-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 text-center py-24">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-surface mb-4">
            <Package className="h-8 w-8 text-muted" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t("detail.productNotFound")}</h2>
          <p className="text-sm text-muted mb-6">
            {t("detail.productNotFoundDesc")}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
          >
            <ArrowLeft className={dir === "rtl" ? "rotate-180 h-4 w-4" : "h-4 w-4"} />
            {t("detail.backToShop")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted mb-8">
          <Link href="/products" className="hover:text-foreground transition-colors flex items-center gap-1.5">
            <ArrowLeft className={dir === "rtl" ? "rotate-180 h-3.5 w-3.5" : "h-3.5 w-3.5"} />
            {t("nav.shop")}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Carousel */}
          <div className="relative">
            <div className="sticky top-28">
              <ImageCarousel
                images={product.images?.length ? product.images : [product.image]}
                alt={product.name}
              >
                {/* Category badge */}
                <span className="absolute top-4 start-4 rounded-full glass-strong px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                  {product.category}
                </span>
                {product.featured && (
                  <span className="absolute top-4 end-4 flex items-center gap-1 rounded-full bg-amber-500/20 backdrop-blur-sm px-3 py-1.5 text-[11px] font-semibold text-amber-300">
                    <Star className="h-3 w-3 fill-amber-300" />
                    {t("detail.featured")}
                  </span>
                )}
              </ImageCarousel>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {/* Category */}
            <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              {product.category}
            </span>

            {/* Name */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold gradient-text">
                EGP {product.price.toFixed(2)}
              </span>
              {product.stock > 0 ? (
                <span className="text-xs font-medium text-green-400 bg-green-500/10 rounded-full px-2.5 py-1">
                  {t("detail.inStock")}
                </span>
              ) : (
                <span className="text-xs font-medium text-red-400 bg-red-500/10 rounded-full px-2.5 py-1">
                  {t("detail.outOfStock")}
                </span>
              )}
              {product.stock > 0 && product.stock <= 5 && (
                <span className="text-xs text-amber-400">
                  {t("detail.onlyLeft", { count: product.stock })}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                {t("detail.description")}
              </h3>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            {product.stock > 0 && (
              <div className="space-y-4 mb-8">
                {/* Quantity selector */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    {t("detail.quantity")}
                  </h3>
                  <div className="inline-flex items-center gap-0 rounded-xl border border-border bg-surface overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-10 w-10 items-center justify-center text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="flex h-10 w-12 items-center justify-center text-sm font-medium text-foreground border-x border-border">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="flex h-10 w-10 items-center justify-center text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart button */}
                <button
                  onClick={handleAddToCart}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all duration-300 shadow-lg ${
                    added
                      ? "bg-green-500 text-white shadow-green-500/20"
                      : "bg-gradient-to-r from-primary to-purple-500 text-white shadow-primary/20 hover:opacity-90 hover:shadow-xl hover:shadow-primary/30"
                  }`}
                >
                  <ShoppingBag className="h-4.5 w-4.5" />
                  {added ? t("detail.addedToCart") : t("detail.addToCart", { price: (product.price * quantity).toFixed(2) })}
                </button>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-border">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{t("detail.freeShipping")}</p>
                  <p className="text-[11px] text-muted mt-0.5">{t("detail.freeShippingSub", { price: String(freeDeliveryMinPrice) })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{t("detail.secureCheckout")}</p>
                  <p className="text-[11px] text-muted mt-0.5">{t("detail.secureCheckoutSub")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{t("detail.easyReturns")}</p>
                  <p className="text-[11px] text-muted mt-0.5">{t("detail.easyReturnsSub", { days: String(returnDays) })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
