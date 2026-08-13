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
  Copy,
  Check,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const { t, dir } = useTranslation();
  const { whatsappNumber: settingsWhatsapp, websiteName, freeDeliveryMinPrice, shippingCost } = useSiteSettings();

  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{
    whatsappUrl: string;
    orderText: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

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
            className="cursor-pointer rounded-full bg-gradient-to-r from-primary to-purple-500 text-white px-6 py-3 text-sm font-semibold inline-block"
          >
            {t("checkout.browseProducts")}
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyDetails = () => {
    if (!submittedOrder?.orderText) return;
    navigator.clipboard
      .writeText(submittedOrder.orderText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch((err) => {
        console.error("Failed to copy order details:", err);
      });
  };

  if (submitted) {
    return (
      <div className="pt-28 pb-20 mx-auto max-w-xl px-6 text-center">
        <div className="py-12 px-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-6">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-3">{t("checkout.successTitle")}</h1>
          <p className="text-sm text-muted mb-8 leading-relaxed max-w-md mx-auto">
            {t("checkout.successDesc")}
          </p>

          <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
            {submittedOrder?.whatsappUrl && (
              <a
                href={submittedOrder.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-green-600 hover:bg-green-700 text-white px-6 py-3.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all w-full"
              >
                <MessageCircle className="h-5 w-5" />
                {t("checkout.openWhatsapp")}
              </a>
            )}

            {submittedOrder?.orderText && (
              <button
                type="button"
                onClick={handleCopyDetails}
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface hover:bg-card text-foreground px-6 py-3 text-sm font-medium transition-all w-full"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? t("checkout.copied") : t("checkout.copyDetails")}
              </button>
            )}

            <Link
              href="/"
              className="cursor-pointer inline-flex items-center justify-center text-sm font-semibold text-primary hover:underline pt-4"
            >
              {t("checkout.backToHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shipping = totalPrice() >= freeDeliveryMinPrice ? 0 : shippingCost;
  const total = totalPrice() + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !form.name || !form.address || !form.phone) return;

    setSubmitting(true);

    const whatsappNumber = settingsWhatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+201025571092";
    const itemLines = items
      .map(
        (item) =>
          `• ${item.name} × ${item.quantity} — EGP ${(item.price * item.quantity).toFixed(2)}`
      )
      .join("\n");

    const message = `${t("checkout.whatsappMessage", { shopName: websiteName })}

*Customer Info:*
Name: ${form.name}
Phone: ${form.phone}
${form.email ? `Email: ${form.email}\n` : ""}Address: ${form.address}
${form.notes ? `Notes: ${form.notes}\n` : ""}
*Order Items:*
${itemLines}

Subtotal: EGP ${totalPrice().toFixed(2)}
Shipping: ${shipping === 0 ? "Free" : `EGP ${shipping.toFixed(2)}`}
*Total: EGP ${total.toFixed(2)}*`;

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${whatsappNumber}?text=${encoded}`;

    try {
      await fetch("/api/orders", {
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
      });
    } catch (error) {
      console.error("Failed to save order:", error);
    } finally {
      setSubmittedOrder({ whatsappUrl: url, orderText: message });
      clearCart();
      setSubmitted(true);
      setSubmitting(false);

      // Trigger navigation
      try {
        window.location.href = url;
      } catch (e) {
        console.error("WhatsApp navigation error:", e);
      }
    }
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
          className="cursor-pointer inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
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
                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label htmlFor="checkout-name" className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("checkout.fullNameLabel")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                      <input
                        id="checkout-name"
                        type="text"
                        placeholder={t("checkout.fullName")}
                        required
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="checkout-phone" className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("checkout.phoneLabel")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                      <input
                        id="checkout-phone"
                        type="tel"
                        placeholder={t("checkout.phone")}
                        required
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="checkout-email" className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("checkout.emailLabel")} <span className="text-muted text-[11px] font-normal">({t("checkout.optional")})</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                      <input
                        id="checkout-email"
                        type="email"
                        placeholder={t("checkout.email")}
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="checkout-address" className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("checkout.addressLabel")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute start-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
                      <textarea
                        id="checkout-address"
                        placeholder={t("checkout.addressPlaceholder")}
                        required
                        rows={3}
                        value={form.address}
                        onChange={(e) => updateField("address", e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all resize-none"
                      />
                    </div>
                    <p className="text-[11px] text-muted mt-1.5 leading-normal">
                      {t("checkout.addressHelp")}
                    </p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="checkout-notes" className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("checkout.notesLabel")} <span className="text-muted text-[11px] font-normal">({t("checkout.optional")})</span>
                    </label>
                    <div className="relative">
                      <FileText className="absolute start-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
                      <textarea
                        id="checkout-notes"
                        placeholder={t("checkout.notesPlaceholder")}
                        rows={2}
                        value={form.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all resize-none"
                      />
                    </div>
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
                      <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-surface flex items-center justify-center">
                        {item.image && item.image.trim() !== "" ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        ) : (
                          <ShoppingBag className="h-5 w-5 text-muted/40" />
                        )}
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
                        EGP {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted">{t("checkout.subtotal")}</span>
                    <span className="text-foreground">EGP {totalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{t("checkout.shipping")}</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-success">{t("checkout.free")}</span>
                      ) : (
                        `EGP ${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="font-semibold text-foreground">{t("checkout.total")}</span>
                    <span className="font-bold gradient-text">EGP {total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className="cursor-pointer mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-green-600 text-white py-3.5 text-sm font-semibold transition-all hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("checkout.submitting")}
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4" />
                      {t("checkout.completeOrder")}
                    </>
                  )}
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
