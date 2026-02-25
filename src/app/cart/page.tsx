"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useSyncExternalStore } from "react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const totalItems = useCartStore((s) => s.totalItems);
  const { t, dir } = useTranslation();
  const { freeDeliveryMinPrice } = useSiteSettings();

  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

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
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white px-7 py-3 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            {t("cart.continueShopping")}
            <ArrowRight className={`h-4 w-4 transition-transform ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
          </Link>
        </div>
      </div>
    );
  }

  const shipping = totalPrice() >= freeDeliveryMinPrice ? 0 : 9.99;
  const total = totalPrice() + shipping;

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("cart.title")}</h1>
            <p className="text-sm text-muted mt-1">
              {t("cart.itemCount", { count: totalItems(), s: totalItems() !== 1 ? "s" : "" })}
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs font-medium text-muted hover:text-danger transition-colors"
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
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground transition-colors"
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
                        className="text-muted hover:text-danger transition-colors"
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
                  <p className="text-[11px] text-primary-light">
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
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white py-3.5 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                {t("cart.proceedToCheckout")}
                <ArrowRight className={`h-4 w-4 transition-transform ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
              </Link>

              <Link
                href="/products"
                className="mt-3 flex w-full items-center justify-center text-xs font-medium text-muted hover:text-foreground transition-colors"
              >
                {t("cart.continueShopping")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
