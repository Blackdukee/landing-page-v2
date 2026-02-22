"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState, useEffect } from "react";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const totalItems = useCartStore((s) => s.totalItems);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
          <h1 className="text-2xl font-bold mb-3">Your cart is empty</h1>
          <p className="text-sm text-muted mb-8 max-w-sm mx-auto">
            Looks like you haven&apos;t added anything yet. Browse our collection
            to find something you love.
          </p>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white px-7 py-3 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            Continue Shopping
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  const shipping = totalPrice() >= 99 ? 0 : 9.99;
  const total = totalPrice() + shipping;

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
            <p className="text-sm text-muted mt-1">
              {totalItems()} item{totalItems() !== 1 ? "s" : ""} in your cart
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs font-medium text-muted hover:text-danger transition-colors"
          >
            Clear all
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
                      ${item.price.toFixed(2)} each
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
                        ${(item.price * item.quantity).toFixed(2)}
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
              <h2 className="font-semibold text-base mb-5 text-foreground">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium text-foreground">${totalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-success">Free</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-[11px] text-primary-light">
                    Add ${(99 - totalPrice()).toFixed(2)} more for free shipping
                  </p>
                )}
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-lg gradient-text">${total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white py-3.5 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/products"
                className="mt-3 flex w-full items-center justify-center text-xs font-medium text-muted hover:text-foreground transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
