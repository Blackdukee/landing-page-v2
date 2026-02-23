"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import {
  ArrowLeft,
  MessageCircle,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const { t, dir } = useTranslation();

  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    notes: "",
  });

  if (!mounted) {
    return (
      <div className="pt-28 pb-20 mx-auto max-w-4xl px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface rounded w-48" />
          <div className="h-64 bg-surface rounded-2xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && !submitted) {
    return (
      <div className="pt-28 pb-20 mx-auto max-w-4xl px-6 text-center">
        <div className="py-24">
          <h1 className="text-2xl font-bold mb-3">{t("checkout.emptyTitle")}</h1>
          <p className="text-sm text-muted mb-6">
            {t("checkout.emptyDesc")}
          </p>
          <Link
            href="/products"
            className="rounded-full bg-gradient-to-r from-primary to-purple-500 text-white px-6 py-3 text-sm font-semibold"
          >
            {t("checkout.browseProducts")}
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="pt-28 pb-20 mx-auto max-w-xl px-6 text-center">
        <div className="py-16">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-6">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-3">{t("checkout.successTitle")}</h1>
          <p className="text-sm text-muted mb-8 leading-relaxed max-w-sm mx-auto">
            {t("checkout.successDesc")}
          </p>
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-primary to-purple-500 text-white px-6 py-3 text-sm font-semibold"
          >
            {t("checkout.backToHome")}
          </Link>
        </div>
      </div>
    );
  }

  const shipping = totalPrice() >= 99 ? 0 : 9.99;
  const total = totalPrice() + shipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+201025571092";
    const itemLines = items
      .map(
        (item) =>
          `• ${item.name} × ${item.quantity} — $${(item.price * item.quantity).toFixed(2)}`
      )
      .join("\n");

    const message = `${t("checkout.whatsappMessage")}

*Customer Info:*
Name: ${form.name}
Phone: ${form.phone}
${form.email ? `Email: ${form.email}` : ""}
Address: ${form.address}
${form.notes ? `Notes: ${form.notes}` : ""}

*Order Items:*
${itemLines}

Subtotal: $${totalPrice().toFixed(2)}
Shipping: ${shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
*Total: $${total.toFixed(2)}*`;

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${whatsappNumber}?text=${encoded}`;

    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerInfo: form,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        totalPrice: total,
      }),
    }).catch(console.error);

    window.open(url, "_blank");
    clearCart();
    setSubmitted(true);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isValid = form.name && form.address && form.phone;

  const inputClass =
    "w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all";

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className={dir === "rtl" ? "rotate-180 h-4 w-4" : "h-4 w-4"} />
          {t("checkout.backToCart")}
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-10">{t("checkout.title")}</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Customer Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-semibold text-base mb-6 text-foreground">
                  {t("checkout.customerInfo")}
                </h2>
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="text"
                      placeholder={t("checkout.fullName")}
                      required
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="tel"
                      placeholder={t("checkout.phone")}
                      required
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="email"
                      placeholder={t("checkout.email")}
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute start-3.5 top-3 h-4 w-4 text-muted" />
                    <textarea
                      placeholder={t("checkout.address")}
                      required
                      rows={3}
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all resize-none"
                    />
                  </div>
                  <div className="relative">
                    <FileText className="absolute start-3.5 top-3 h-4 w-4 text-muted" />
                    <textarea
                      placeholder={t("checkout.notes")}
                      rows={2}
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 rounded-2xl border border-border bg-card p-6">
                <h2 className="font-semibold text-base mb-5 text-foreground">{t("checkout.orderSummary")}</h2>

                <div className="space-y-3 mb-5">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-surface">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-foreground">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-muted">
                          {t("checkout.qty", { count: item.quantity })}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted">{t("checkout.subtotal")}</span>
                    <span className="text-foreground">${totalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{t("checkout.shipping")}</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-success">{t("checkout.free")}</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="font-semibold text-foreground">{t("checkout.total")}</span>
                    <span className="font-bold gradient-text">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isValid}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-green-600 text-white py-3.5 text-sm font-semibold transition-all hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("checkout.completeOrder")}
                </button>

                <p className="text-[11px] text-center text-muted mt-3 leading-relaxed">
                  {t("checkout.whatsappRedirect")}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
