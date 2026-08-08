"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, AlertCircle } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useSyncExternalStore, useState, useEffect } from "react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

interface ProductStock {
  [productId: string]: number;
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const totalItems = useCartStore((s) => s.totalItems);
  const { t, dir } = useTranslation();
  const { freeDeliveryMinPrice, shippingCost } = useSiteSettings();
  const [productStock, setProductStock] = useState<ProductStock>({});
  const [stockError, setStockError] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  // Fetch stock information for cart items
  useEffect(() => {
    if (items.length === 0) return;
    const productIds = items.map((item) => item.productId);
    Promise.all(productIds.map((id) => fetch(`/api/products/${id}`).then((r) => r.json())))
      .then((products) => {
        const stock: ProductStock = {};
        products.forEach((product) => {
          stock[product._id] = product.stock;
        });
        setProductStock(stock);
      })
      .catch(console.error);
  }, [items]);

  if (!mounted) {
    return (
      <div className="pt-28 pb-20 mx-auto max-w-4xl px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface rounded w-32" />
          <div className="h-32 bg-surface rounded-2xl" />
          <div className="h-32 bg-surface rounded-2xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-28 pb-20 mx-auto max-w-4xl px-6 text-center">
        <div className="py-24">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-surface mb-6">
            <ShoppingBag className="h-8 w-8 text-muted" />
          </div>
          <h1 className="text-2xl font-bold mb-3">{t("cart.emptyTitle")}</h1>
          <p className="text-sm text-muted mb-8 max-w-sm mx-auto">
            {t("cart.emptyDesc")}
          </p>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white px-7 py-3 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
          >
            {t("cart.continueShopping")}
            <ArrowRight className={`h-4 w-4 transition-transform ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
          </Link>
        </div>
      </div>
    );
  }

  const shipping = totalPrice() >= freeDeliveryMinPrice ? 0 : shippingCost;
  const total = totalPrice() + shipping;

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Stock error notification */}
        {stockError && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{stockError}</p>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("cart.title")}</h1>
            <p className="text-sm text-muted mt-1">
              {t("cart.itemCount", { count: totalItems(), s: totalItems() !== 1 ? "s" : "" })}
            </p>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-xs font-medium text-muted hover:text-danger transition-colors cursor-pointer"
          >
            {t("cart.clearAll")}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 sm:gap-6 rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all hover:border-primary/20"
              >
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-surface">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-semibold text-sm truncate text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      EGP {item.price.toFixed(2)} {t("cart.each")}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface">
                      <button
                        onClick={() => {
                          setStockError("");
                          updateQuantity(item.productId, item.quantity - 1, productStock[item.productId]);
                        }}
                        aria-label="Decrease quantity"
                        className="flex h-11 w-11 min-w-[44px] min-h-[44px] items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          const stock = productStock[item.productId] || item.stock || Infinity;
                          if (item.quantity + 1 > stock) {
                            setStockError(`${item.name}: ${t("cart.insufficientStock")}`);
                            setTimeout(() => setStockError(""), 3000);
                          } else {
                            setStockError("");
                            updateQuantity(item.productId, item.quantity + 1, stock);
                          }
                        }}
                        disabled={item.quantity >= (productStock[item.productId] || item.stock || Infinity)}
                        aria-label="Increase quantity"
                        className="flex h-11 w-11 min-w-[44px] min-h-[44px] items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-sm gradient-text">
                        EGP {(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="text-muted hover:text-danger transition-colors cursor-pointer p-2 flex items-center justify-center min-w-[44px] min-h-[44px]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold text-base mb-5 text-foreground">{t("cart.orderSummary")}</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">{t("cart.subtotal")}</span>
                  <span className="font-medium text-foreground">EGP {totalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t("cart.shipping")}</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-success">{t("cart.free")}</span>
                    ) : (
                      `EGP ${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-primary font-medium mt-1">
                    {t("cart.freeShippingHint", { amount: (freeDeliveryMinPrice - totalPrice()).toFixed(2) })}
                  </p>
                )}
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground">{t("cart.total")}</span>
                  <span className="font-bold text-lg gradient-text">EGP {total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white py-3.5 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
              >
                {t("cart.proceedToCheckout")}
                <ArrowRight className={`h-4 w-4 transition-transform ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
              </Link>

              <Link
                href="/products"
                className="mt-3 flex w-full items-center justify-center text-xs font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                {t("cart.continueShopping")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold text-foreground">Clear Cart?</h3>
            </div>
            <p className="text-sm text-muted">
              Are you sure you want to remove all items from your shopping cart? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground rounded-lg border border-border hover:bg-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-danger hover:bg-danger/90 rounded-lg transition-colors cursor-pointer"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

