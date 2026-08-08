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
  AlertCircle,
  Trash2,
  Flame,
  Zap,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import ImageCarousel from "@/components/ImageCarousel";

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  stock: number;
  category: string;
  company?: { _id: string; name: string; logo: string } | string | null;
  featured: boolean;
  createdAt: string;
}

interface Props {
  initialProduct: Product;
}

export default function ProductDetailClient({ initialProduct }: Props) {
  const { id } = useParams();
  const [product, setProduct] = useState<Product>(initialProduct);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stockError, setStockError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const items = useCartStore((s) => s.items);
  const { t, dir } = useTranslation();
  const { dailyOffers, freeDeliveryMinPrice, returnDays } = useSiteSettings();

  // Re-fetch on client side for fresh stock/price data
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

  // Check active daily offer
  const activeOffer = product
    ? dailyOffers.find(
        (o) =>
          String(o.productId) === String(product._id) &&
          o.active &&
          (!o.expiresAt || new Date(o.expiresAt).getTime() > Date.now())
      )
    : undefined;

  const discountPercentage = activeOffer ? activeOffer.discountPercentage : 0;
  const salePrice =
    activeOffer && product
      ? Number((product.price * (1 - discountPercentage / 100)).toFixed(2))
      : product?.price ?? 0;

  const handleAddToCart = () => {
    if (!product) return;

    // Check if trying to add more than available stock
    const cartItem = items.find((i) => i.productId === product._id);
    const quantityInCart = cartItem?.quantity || 0;
    const availableStock = product.stock - quantityInCart;

    if (availableStock <= 0 || quantity > availableStock) {
      setStockError(t("cart.insufficientStock"));
      setTimeout(() => setStockError(""), 3000);
      return;
    }

    const success = addItem(
      {
        productId: product._id,
        name: product.name,
        price: salePrice,
        image: product.images?.[0] || product.image,
      },
      product.stock,
      quantity
    );

    if (!success) {
      setStockError(t("cart.insufficientStock"));
      setTimeout(() => setStockError(""), 3000);
    } else {
      setStockError("");
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleRemoveFromCart = () => {
    if (!product) return;
    removeItem(product._id);
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
                {/* Category & Company badges */}
                <div className="absolute top-4 start-4 z-10 flex items-center gap-2 flex-wrap max-w-[calc(100%-4rem)]">
                  <span className="rounded-full bg-black/65 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white border border-white/20 shadow-sm">
                    {product.category}
                  </span>
                  {(() => {
                    const comp =
                      typeof product.company === "object" && product.company !== null
                        ? product.company
                        : null;
                    if (!comp || !comp.name) return null;
                    return (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white border border-white/20 shadow-sm">
                        {comp.logo && (
                          <img
                            src={comp.logo}
                            alt={comp.name}
                            className="h-4 w-4 rounded-full object-cover shrink-0"
                          />
                        )}
                        <span>{comp.name}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Daily Offer Discount Badge */}
                {activeOffer && (
                  <span className="absolute top-4 end-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 via-amber-600 to-orange-500 text-white px-3.5 py-1.5 text-xs font-black shadow-lg shadow-red-500/30 backdrop-blur-sm animate-pulse motion-reduce:animate-none">
                    <Flame className="h-3.5 w-3.5 fill-white text-white shrink-0" />
                    <span>
                      -{discountPercentage}% {t("home.off")}
                    </span>
                  </span>
                )}

                {product.featured && !activeOffer && (
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
            {/* Category & Company badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {product.category}
              </span>
              {(() => {
                const comp =
                  typeof product.company === "object" && product.company !== null
                    ? product.company
                    : null;
                if (!comp || !comp.name) return null;
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                    {comp.logo && (
                      <img
                        src={comp.logo}
                        alt={comp.name}
                        className="h-4 w-4 rounded-full object-cover shrink-0"
                      />
                    )}
                    <span>{comp.name}</span>
                  </span>
                );
              })()}
            </div>

            {/* Name */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap mb-6">
              <span
                className={`text-3xl font-bold ${
                  activeOffer ? "text-amber-500 dark:text-amber-400" : "gradient-text"
                }`}
              >
                EGP {salePrice.toFixed(2)}
              </span>
              {activeOffer && (
                <span className="text-lg text-muted/70 line-through">
                  EGP {product.price.toFixed(2)}
                </span>
              )}
              {activeOffer && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-xs font-bold">
                  <Zap className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {t("home.saveAmount", {
                      amount: (product.price - salePrice).toFixed(2),
                    })}
                  </span>
                </span>
              )}
              {product.stock > 0 ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                  {t("detail.inStock")}
                </span>
              ) : (
                <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
                  {t("detail.outOfStock")}
                </span>
              )}
              {product.stock > 0 && product.stock <= 5 && (
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
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
                {/* Stock error notification */}
                {stockError && (
                  <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                    <AlertCircle className="h-5 w-5 text-red-700 shrink-0" />
                    <p className="text-sm font-medium text-red-700">{stockError}</p>
                  </div>
                )}

                {/* Quantity selector */}
                {(() => {
                  const cartItem = items.find((i) => i.productId === product._id);
                  const quantityInCart = cartItem?.quantity || 0;
                  const availableStock = Math.max(0, product.stock - quantityInCart);
                  const canIncrement = availableStock > 0 && quantity < availableStock;

                  return (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                        {t("detail.quantity")}
                      </h3>
                      <div className="inline-flex items-center gap-0 rounded-xl border border-border bg-surface overflow-hidden">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          aria-label="Decrease quantity"
                          className="flex h-11 w-11 min-w-[44px] min-h-[44px] items-center justify-center text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="flex h-11 w-12 items-center justify-center text-sm font-medium text-foreground border-x border-border">
                          {quantity}
                        </span>
                        <button
                          onClick={() =>
                            availableStock > 0 &&
                            setQuantity(Math.min(availableStock, quantity + 1))
                          }
                          disabled={!canIncrement}
                          aria-label="Increase quantity"
                          className="flex h-11 w-11 min-w-[44px] min-h-[44px] items-center justify-center text-muted hover:bg-card-hover hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {availableStock <= 0 && (
                        <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1 mt-2 inline-block">
                          {t("cart.insufficientStock")}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Add/Remove to Cart button */}
                {(() => {
                  const cartItem = items.find((i) => i.productId === product._id);
                  const quantityInCart = cartItem?.quantity || 0;
                  const isInCart = quantityInCart > 0;
                  const availableStock = Math.max(0, product.stock - quantityInCart);
                  const isDisabled = availableStock <= 0 || quantity > availableStock;

                  if (isInCart) {
                    return (
                      <div className="flex gap-3">
                        <button
                          onClick={handleAddToCart}
                          disabled={isDisabled}
                          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all duration-300 shadow-lg ${
                            added
                              ? "bg-green-500 text-white shadow-green-500/20"
                              : isDisabled
                              ? "bg-gray-400 text-white shadow-gray-400/20 cursor-not-allowed opacity-60"
                              : "bg-gradient-to-r from-primary to-purple-500 text-white shadow-primary/20 hover:opacity-90 hover:shadow-xl hover:shadow-primary/30"
                          }`}
                        >
                          <ShoppingBag className="h-4.5 w-4.5" />
                          {added
                            ? t("detail.addedToCart")
                            : availableStock <= 0
                            ? t("detail.outOfStock")
                            : t("detail.addToCart", {
                                price: (salePrice * quantity).toFixed(2),
                              })}
                        </button>
                        <button
                          onClick={handleRemoveFromCart}
                          className="inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-300 shadow-lg bg-danger/90 text-white shadow-danger/20 hover:bg-danger hover:shadow-xl hover:shadow-danger/30"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                          {t("cart.removeFromCart")}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={handleAddToCart}
                      disabled={isDisabled}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all duration-300 shadow-lg ${
                        added
                          ? "bg-green-500 text-white shadow-green-500/20"
                          : isDisabled
                          ? "bg-gray-400 text-white shadow-gray-400/20 cursor-not-allowed opacity-60"
                          : "bg-gradient-to-r from-primary to-purple-500 text-white shadow-primary/20 hover:opacity-90 hover:shadow-xl hover:shadow-primary/30"
                      }`}
                    >
                      <ShoppingBag className="h-4.5 w-4.5" />
                      {added
                        ? t("detail.addedToCart")
                        : availableStock <= 0
                        ? t("detail.outOfStock")
                        : t("detail.addToCart", {
                            price: (salePrice * quantity).toFixed(2),
                          })}
                    </button>
                  );
                })()}
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-border">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {t("detail.freeShipping")}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {t("detail.freeShippingSub", { price: String(freeDeliveryMinPrice) })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {t("detail.secureCheckout")}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {t("detail.secureCheckoutSub")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {t("detail.easyReturns")}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {t("detail.easyReturnsSub", { days: String(returnDays) })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
