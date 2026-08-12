"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList,
  Search,
  Eye,
  X,
  ChevronDown,
  Trash2,
  Tag,
  Copy,
  Check,
  Percent,
  Coins,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import type { TranslationKey } from "@/i18n/en";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  costPrice?: number;
  quantity: number;
}

interface Order {
  _id: string;
  customerInfo: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    notes?: string;
  };
  items: OrderItem[];
  totalPrice: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}

interface ItemAdj {
  discountType: "percentage" | "fixed";
  discountValue: number;
  stacked: boolean;
}

const statusOptions = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

function calcItemFinal(item: OrderItem, adj: ItemAdj | undefined): number {
  if (!adj || adj.discountValue <= 0) return item.price;
  const source = item.price; // priorPrice === item.price (already baked-in offer price)
  if (adj.discountType === "percentage") {
    return Math.max(0, source * (1 - adj.discountValue / 100));
  }
  return Math.max(0, source - adj.discountValue);
}

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const { websiteName } = useSiteSettings();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Discount modal state
  const [discountOrder, setDiscountOrder] = useState<Order | null>(null);
  const [itemAdjs, setItemAdjs] = useState<Record<string, ItemAdj>>({});
  const [orderDiscType, setOrderDiscType] = useState<"percentage" | "fixed">("percentage");
  const [orderDiscValue, setOrderDiscValue] = useState(0);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: newStatus as Order["status"] } : o
          )
        );
        if (selectedOrder?._id === orderId) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, status: newStatus as Order["status"] } : null
          );
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm(t("admin.orders.deleteConfirm" as TranslationKey))) return;
    try {
      await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      fetchOrders();
      if (selectedOrder?._id === orderId) setSelectedOrder(null);
    } catch (error) {
      console.error(error);
    }
  };

  // --- Discount Modal ---
  const openDiscountModal = (order: Order) => {
    setDiscountOrder(order);
    setItemAdjs({});
    setOrderDiscType("percentage");
    setOrderDiscValue(0);
    setCopied(false);
  };

  const closeDiscountModal = () => {
    setDiscountOrder(null);
    setSavingDiscount(false);
  };

  const setItemAdj = (productId: string, patch: Partial<ItemAdj>) => {
    setItemAdjs((prev) => {
      const existing = prev[productId] ?? { discountType: "percentage" as const, discountValue: 0, stacked: false };
      return {
        ...prev,
        [productId]: { ...existing, ...patch },
      };
    });
  };

  const calcDiscount = useCallback(() => {
    if (!discountOrder) return { originalTotal: 0, itemSubtotal: 0, finalTotal: 0, savings: 0 };
    const originalTotal = discountOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const itemSubtotal = discountOrder.items.reduce((s, item) => {
      const finalUnit = calcItemFinal(item, itemAdjs[item.productId]);
      return s + finalUnit * item.quantity;
    }, 0);
    let finalTotal = itemSubtotal;
    if (orderDiscValue > 0) {
      if (orderDiscType === "percentage") {
        finalTotal = Math.max(0, itemSubtotal * (1 - orderDiscValue / 100));
      } else {
        finalTotal = Math.max(0, itemSubtotal - orderDiscValue);
      }
    }
    const savings = originalTotal - finalTotal;
    return { originalTotal, itemSubtotal, finalTotal, savings };
  }, [discountOrder, itemAdjs, orderDiscType, orderDiscValue]);

  const handleSaveDiscount = async () => {
    if (!discountOrder) return;
    setSavingDiscount(true);
    const { originalTotal, finalTotal } = calcDiscount();
    const itemAdjustments = discountOrder.items
      .filter((item) => itemAdjs[item.productId]?.discountValue > 0)
      .map((item) => {
        const adj = itemAdjs[item.productId];
        return {
          productId: item.productId,
          discountType: adj.discountType,
          discountValue: adj.discountValue,
          stacked: adj.stacked,
          basePrice: item.price,
          priorPrice: item.price,
          finalPrice: calcItemFinal(item, adj),
        };
      });

    const discountDetails = {
      itemAdjustments,
      orderDiscountType: orderDiscValue > 0 ? orderDiscType : null,
      orderDiscountValue: orderDiscValue > 0 ? orderDiscValue : undefined,
      originalTotal,
      finalTotal,
    };

    try {
      const res = await fetch(`/api/orders/${discountOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "confirmed",
          totalPrice: finalTotal,
          discountDetails,
        }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === discountOrder._id
              ? { ...o, status: "confirmed", totalPrice: finalTotal }
              : o
          )
        );
        closeDiscountModal();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleCopyWhatsApp = async () => {
    if (!discountOrder) return;
    const { originalTotal, finalTotal, savings } = calcDiscount();
    const storeName = websiteName || "M L N TOOLS";

    const itemLines = discountOrder.items
      .map((item) => {
        const finalUnit = calcItemFinal(item, itemAdjs[item.productId]);
        const lineTotal = (finalUnit * item.quantity).toFixed(2);
        return `• ${item.name} × ${item.quantity}: ${lineTotal} ج.م`;
      })
      .join("\n");

    const message = `مرحباً ${discountOrder.customerInfo.name}! 🛍️
تم تأكيد طلبك بنجاح من متجر ${storeName}.

📋 تفاصيل الأصناف:
${itemLines}

💰 تفاصيل الحساب:
• إجمالي المنتجات: ${originalTotal.toFixed(2)} ج.م
• الخصم المطبق: ${savings.toFixed(2)} ج.م
• المبلغ النهائي للدفع: ${finalTotal.toFixed(2)} ج.م

📍 عنوان التوصيل: ${discountOrder.customerInfo.address}
📱 رقم الهاتف: ${discountOrder.customerInfo.phone}

🚚 جاري تجهيز الطلب وسنتواصل معك فور الشحن. شكراً لتسوقك معنا!`;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = message;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.customerInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o._id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const { finalTotal, savings } = calcDiscount();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.orders.title" as TranslationKey)}</h1>
        <p className="text-sm text-muted mt-1">
          {t("admin.orders.subtitle" as TranslationKey)}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder={t("admin.orders.searchPlaceholder" as TranslationKey)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none rounded-xl border border-border bg-surface text-foreground px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all capitalize"
          >
            <option value="all">{t("admin.orders.allStatuses" as TranslationKey)}</option>
            {statusOptions.map((s) => (
              <option key={s} value={s} className="capitalize">
                {t(`admin.status.${s}` as TranslationKey)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-surface rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <ClipboardList className="h-10 w-10 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">
              {search || filterStatus !== "all"
                ? t("admin.orders.noMatch" as TranslationKey)
                : t("admin.orders.noOrders" as TranslationKey)}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-start px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.orders.order" as TranslationKey)}
                  </th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.orders.customer" as TranslationKey)}
                  </th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.orders.items" as TranslationKey)}
                  </th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.orders.total" as TranslationKey)}
                  </th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.orders.status" as TranslationKey)}
                  </th>
                  <th className="text-start px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.orders.date" as TranslationKey)}
                  </th>
                  <th className="text-end px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                    {t("admin.orders.actions" as TranslationKey)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => (
                  <tr key={order._id} className="hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-muted">
                        #{order._id.slice(-6)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {order.customerInfo?.name}
                        </p>
                        <p className="text-[11px] text-muted">
                          {order.customerInfo?.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {order.items?.length || 0} {(order.items?.length || 0) !== 1 ? t("admin.orders.itemPlural" as TranslationKey) : t("admin.orders.item" as TranslationKey)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      EGP {order.totalPrice?.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="relative inline-block">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order._id, e.target.value)
                          }
                          disabled={updatingStatus === order._id}
                          className={`appearance-none rounded-full border px-3 py-1 pr-7 text-[11px] font-medium capitalize cursor-pointer focus:outline-none disabled:opacity-50 ${
                            statusColor[order.status] || ""
                          }`}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s} className="capitalize">
                              {t(`admin.status.${s}` as TranslationKey)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDiscountModal(order)}
                          aria-label="Apply discount and confirm order"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                          title="تطبيق خصم وتأكيد الطلب"
                        >
                          <Tag className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          aria-label="View order details"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(order._id)}
                          aria-label="Delete order"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Discount & Confirm Modal ── */}
      {discountOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h2 className="font-bold text-base text-foreground">
                  تطبيق خصم وتأكيد الطلب
                </h2>
                <p className="text-xs text-muted mt-0.5">طلب #{discountOrder._id.slice(-6)} — {discountOrder.customerInfo.name}</p>
              </div>
              <button
                onClick={closeDiscountModal}
                aria-label="Close discount modal"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Items Table */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">خصم على أصناف محددة</h3>
                <div className="space-y-3">
                  {discountOrder.items.map((item) => {
                    const adj = itemAdjs[item.productId];
                    const finalUnit = calcItemFinal(item, adj);
                    const hasDiscount = adj && adj.discountValue > 0;
                    return (
                      <div key={item.productId} className="rounded-xl border border-border bg-surface/50 p-4 space-y-3">
                        {/* Item info */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted">
                              {item.quantity} × {item.price.toFixed(2)} ج.م
                              {hasDiscount && (
                                <span className="ms-2 text-green-500 font-semibold">
                                  → {finalUnit.toFixed(2)} ج.م / قطعة
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                            {(finalUnit * item.quantity).toFixed(2)} ج.م
                          </span>
                        </div>

                        {/* Discount controls */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Type toggle */}
                          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() => setItemAdj(item.productId, { discountType: "percentage" })}
                              className={`flex min-h-[36px] items-center gap-1 px-3 py-1.5 transition-colors ${(adj?.discountType ?? "percentage") === "percentage" ? "bg-primary text-white" : "bg-surface text-muted hover:text-foreground"}`}
                            >
                              <Percent className="h-3 w-3" />%
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemAdj(item.productId, { discountType: "fixed" })}
                              className={`flex min-h-[36px] items-center gap-1 px-3 py-1.5 transition-colors ${adj?.discountType === "fixed" ? "bg-primary text-white" : "bg-surface text-muted hover:text-foreground"}`}
                            >
                              <Coins className="h-3 w-3" />ج.م
                            </button>
                          </div>
                          {/* Value input */}
                          <input
                            type="number"
                            min={0}
                            max={(adj?.discountType ?? "percentage") === "percentage" ? 100 : undefined}
                            placeholder={(adj?.discountType ?? "percentage") === "percentage" ? "0 %" : "0 ج.م"}
                            value={adj?.discountValue ?? ""}
                            onChange={(e) => setItemAdj(item.productId, { discountValue: parseFloat(e.target.value) || 0 })}
                            className="w-28 min-h-[36px] rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          {/* Stack checkbox */}
                          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border text-primary cursor-pointer"
                              checked={adj?.stacked ?? false}
                              onChange={(e) => setItemAdj(item.productId, { stacked: e.target.checked })}
                            />
                            دمج مع الخصم الحالي
                          </label>
                        </div>

                        {/* Below Cost / Loss Warning */}
                        {item.costPrice !== undefined && item.costPrice > 0 && finalUnit < item.costPrice && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-danger bg-danger/10 border border-danger/30 px-3 py-1.5 rounded-lg animate-pulse">
                            <span>
                              ⚠️ تحذير: سعر البيع ({finalUnit.toFixed(2)} ج.م) أقل من سعر الشراء ({item.costPrice.toFixed(2)} ج.م) — بيع بخسارة {((item.costPrice - finalUnit) * item.quantity).toFixed(2)} ج.م!
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order-level discount */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">خصم إضافي على إجمالي الطلب</h3>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/50 p-4">
                  <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setOrderDiscType("percentage")}
                      className={`flex min-h-[36px] items-center gap-1 px-3 py-1.5 transition-colors ${orderDiscType === "percentage" ? "bg-primary text-white" : "bg-surface text-muted hover:text-foreground"}`}
                    >
                      <Percent className="h-3 w-3" />%
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderDiscType("fixed")}
                      className={`flex min-h-[36px] items-center gap-1 px-3 py-1.5 transition-colors ${orderDiscType === "fixed" ? "bg-primary text-white" : "bg-surface text-muted hover:text-foreground"}`}
                    >
                      <Coins className="h-3 w-3" />ج.م
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={orderDiscType === "percentage" ? 100 : undefined}
                    placeholder={orderDiscType === "percentage" ? "0 %" : "0 ج.م"}
                    value={orderDiscValue || ""}
                    onChange={(e) => setOrderDiscValue(parseFloat(e.target.value) || 0)}
                    className="w-32 min-h-[36px] rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Live Summary */}
              <div className="rounded-xl border border-border bg-gradient-to-br from-surface to-surface/50 p-4 space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">ملخص الفاتورة</h3>
                <div className="flex justify-between text-sm text-muted">
                  <span>إجمالي المنتجات الأصلي</span>
                  <span className="font-medium text-foreground">{discountOrder.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)} ج.م</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span>إجمالي الخصومات المطبقة</span>
                    <span className="font-semibold">-{savings.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-2 mt-1">
                  <span>المبلغ النهائي للدفع</span>
                  <span className="text-primary">{finalTotal.toFixed(2)} ج.م</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleSaveDiscount}
                  disabled={savingDiscount}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-semibold text-sm px-5 transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {savingDiscount ? "جاري الحفظ..." : "حفظ وتأكيد الطلب بالخصم"}
                </button>
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/40 bg-green-500/10 text-green-500 hover:bg-green-500/20 font-semibold text-sm px-5 transition-all"
                >
                  {copied ? (
                    <><Check className="h-4 w-4" />تم النسخ!</>
                  ) : (
                    <><Copy className="h-4 w-4" />نسخ رسالة واتساب</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-base text-foreground">
                {t("admin.orders.orderDetail" as TranslationKey)} #{selectedOrder._id.slice(-6)}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order detail"
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  {t("admin.orders.statusLabel" as TranslationKey)}
                </h3>
                <span
                  className={`inline-block rounded-full border px-3 py-1 text-[11px] font-medium capitalize ${
                    statusColor[selectedOrder.status] || ""
                  }`}
                >
                  {t(`admin.status.${selectedOrder.status}` as TranslationKey)}
                </span>
              </div>

              {/* Customer */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  {t("admin.orders.customerLabel" as TranslationKey)}
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium text-foreground">{selectedOrder.customerInfo?.name}</p>
                  <p className="text-muted">{selectedOrder.customerInfo?.phone}</p>
                  {selectedOrder.customerInfo?.email && (
                    <p className="text-muted">{selectedOrder.customerInfo.email}</p>
                  )}
                  <p className="text-muted">{selectedOrder.customerInfo?.address}</p>
                  {selectedOrder.customerInfo?.notes && (
                    <p className="text-xs text-muted italic mt-2">
                      {t("admin.orders.notes" as TranslationKey)}: {selectedOrder.customerInfo.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  {t("admin.orders.itemsLabel" as TranslationKey)}
                </h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted">
                          {t("admin.orders.qty" as TranslationKey)}: {item.quantity} &times; EGP {item.price.toFixed(2)}
                          {item.costPrice !== undefined && item.costPrice > 0 && (
                            <span className="ms-2 text-amber-500 font-medium">
                              (شراء: EGP {item.costPrice.toFixed(2)})
                            </span>
                          )}
                        </p>
                        {item.costPrice !== undefined && item.costPrice > 0 && item.price < item.costPrice && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-danger bg-danger/10 border border-danger/30 px-2 py-0.5 rounded mt-1">
                            ⚠️ بيع بأقل من سعر الشراء (خسارة: EGP {(item.costPrice - item.price).toFixed(2)}/قطعة)
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-foreground">
                        EGP {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold text-foreground">{t("admin.orders.totalLabel" as TranslationKey)}</span>
                <span className="text-lg font-bold text-foreground">
                  EGP {selectedOrder.totalPrice?.toFixed(2)}
                </span>
              </div>

              {/* Date */}
              <p className="text-xs text-muted">
                {t("admin.orders.ordered" as TranslationKey)}: {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
