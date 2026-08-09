"use client";

import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
  Printer,
  MessageSquare,
  CheckCircle2,
  X,
  AlertCircle,
  Edit3,
} from "lucide-react";
import { calculatePOSDiscounts, OrderDiscountInput } from "@/modules/cashair/DiscountEngine";

export interface CartItemWithOverride {
  productId: string;
  name: string;
  price: number;
  overridePrice?: number;
  quantity: number;
  stock?: number;
  image?: string;
  itemDiscount?: {
    type: "percentage" | "fixed";
    value: number;
  };
}

interface POSCartPanelProps {
  items: CartItemWithOverride[];
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onUpdatePrice: (productId: string, newPrice: number | undefined) => void;
  onUpdateItemDiscount: (
    productId: string,
    discount?: { type: "percentage" | "fixed"; value: number }
  ) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  activeShiftId: string | null;
  cashierName?: string;
  onSaleCompleted?: () => void;
}

export default function POSCartPanel({
  items,
  onUpdateQuantity,
  onUpdatePrice,
  onUpdateItemDiscount,
  onRemoveItem,
  onClearCart,
  activeShiftId,
  cashierName = "الكاشير",
  onSaleCompleted,
}: POSCartPanelProps) {
  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "instapay" | "vodafone_cash" | "card"
  >("cash");

  // Customer info & notes
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Whole order discount
  const [orderDiscount, setOrderDiscount] = useState<OrderDiscountInput>({
    type: "fixed",
    value: 0,
  });
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Price override modal / inline state
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [tempOverridePrice, setTempOverridePrice] = useState<string>("");

  // Item Discount inline state
  const [editingDiscountProductId, setEditingDiscountProductId] = useState<string | null>(null);
  const [tempDiscountType, setTempDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [tempDiscountValue, setTempDiscountValue] = useState<string>("");

  // Processing checkout state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Completed sale receipt modal state
  const [receiptData, setReceiptData] = useState<any | null>(null);

  // Calculate totals via DiscountEngine
  const totals = useMemo(() => {
    const discountItemsInput = items.map((item) => ({
      basePrice: item.price,
      priorPrice: item.overridePrice !== undefined ? item.overridePrice : item.price,
      quantity: item.quantity,
      newDiscountType: item.itemDiscount?.type,
      newDiscountValue: item.itemDiscount?.value,
      stacked: true,
    }));

    return calculatePOSDiscounts(
      discountItemsInput,
      orderDiscount.value > 0 ? orderDiscount : undefined
    );
  }, [items, orderDiscount]);

  // Handle Checkout submission
  const handleCheckout = async () => {
    if (!activeShiftId) {
      setCheckoutError("لا توجد وردية مفتوحة حالياً! يجب فتح وردية جديدة من الشريط العلوي أعلاه.");
      return;
    }
    if (items.length === 0) {
      setCheckoutError("السلة فارغة! اختر منتجات من الكتالوج لإتمام البيع.");
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const checkoutPayload = {
        shiftId: activeShiftId,
        items: items.map((item, index) => {
          const adj = totals.itemAdjustments[index];
          return {
            productId: item.productId,
            name: item.name,
            price: item.overridePrice !== undefined ? item.overridePrice : item.price,
            quantity: item.quantity,
            finalUnitPrice: adj ? adj.finalUnitPrice : item.price,
          };
        }),
        paymentMethod,
        discountDetails: {
          originalTotal: totals.originalTotal,
          itemsTotal: totals.itemsTotal,
          orderDiscountType: orderDiscount.type,
          orderDiscountValue: orderDiscount.value,
          totalDiscount: totals.totalDiscount,
          finalTotal: totals.finalTotal,
        },
        customerInfo: customerPhone.trim()
          ? {
              phone: customerPhone.trim(),
              name: customerName.trim() || undefined,
            }
          : undefined,
        notes: orderNotes.trim() || undefined,
      };

      const res = await fetch("/api/cashair/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      });

      const data = await res.json();

      if (data.success) {
        setReceiptData({
          orderId: data.orderId || data.order?._id || "POS-" + Date.now().toString().slice(-6),
          receiptText: data.receiptText,
          items: [...items],
          totals,
          paymentMethod,
          customerPhone,
          customerName,
          cashierName,
          date: new Date().toLocaleString("ar-EG"),
        });

        onClearCart();
        setOrderDiscount({ type: "fixed", value: 0 });
        setCustomerPhone("");
        setCustomerName("");
        setOrderNotes("");
        if (onSaleCompleted) onSaleCompleted();
      } else {
        setCheckoutError(data.error || "فشل إتمام عملية البيع");
      }
    } catch (err: any) {
      setCheckoutError("خطأ في الشبكة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethodsList = [
    { id: "cash", label: "نقدًا (كاش)", icon: Banknote, color: "text-emerald-300 border-emerald-500/40 bg-emerald-950/40" },
    { id: "instapay", label: "إنستا باي", icon: QrCode, color: "text-purple-300 border-purple-700 bg-purple-950/30 hover:bg-purple-900/40" },
    { id: "vodafone_cash", label: "فودافون كاش", icon: Smartphone, color: "text-rose-300 border-rose-500/40 bg-rose-950/40" },
    { id: "card", label: "فيزا / كارت", icon: CreditCard, color: "text-blue-300 border-blue-500/40 bg-blue-950/40" },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-900/60 text-slate-100 rounded-2xl border border-slate-800/80 p-4 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-100">سلة البيع</h2>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
            {items.reduce((s, i) => s + i.quantity, 0)} قطعة
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-800/40 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" /> مسح
          </button>
        )}
      </div>

      {/* Cart Items List Area */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-700/60">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-slate-500 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-center text-slate-600">
              <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-300">السلة فارغة</p>
              <p className="text-[11px] text-slate-500">اختر من المنتجات في الكتالوج لإضافتها للسلة</p>
            </div>
          </div>
        ) : (
          items.map((item) => {
            const effectiveUnitPrice = item.overridePrice !== undefined ? item.overridePrice : item.price;
            const hasPriceOverride = item.overridePrice !== undefined && item.overridePrice !== item.price;

            return (
              <div
                key={item.productId}
                className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3 flex flex-col gap-2 relative transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                      <span className="text-amber-400 font-bold">
                        {effectiveUnitPrice.toLocaleString()} ج.م
                      </span>
                      {hasPriceOverride && (
                        <span className="line-through text-slate-500 text-[10px]">
                          {item.price.toLocaleString()} ج.م
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setEditingPriceProductId(item.productId);
                          setTempOverridePrice(effectiveUnitPrice.toString());
                        }}
                        className="text-slate-400 hover:text-amber-400 flex items-center gap-0.5 text-[10px] font-medium"
                        title="تعديل سعر الوحدة"
                      >
                        <Edit3 className="w-3 h-3" /> سعر خاص
                      </button>

                      <button
                        onClick={() => {
                          setEditingDiscountProductId(item.productId);
                          setTempDiscountType(item.itemDiscount?.type || "percentage");
                          setTempDiscountValue(item.itemDiscount?.value?.toString() || "");
                        }}
                        className={`flex items-center gap-0.5 text-[10px] font-bold transition-all px-1.5 py-0.5 rounded-md ${
                          item.itemDiscount && item.itemDiscount.value > 0
                            ? "text-rose-300 bg-rose-950/80 border border-rose-800/80 shadow-sm"
                            : "text-slate-400 hover:text-rose-400 bg-slate-900/60 border border-slate-800"
                        }`}
                        title="إضافة خصم خاص على هذا الصنف"
                      >
                        <Tag className="w-3 h-3 text-rose-400" />
                        {item.itemDiscount && item.itemDiscount.value > 0
                          ? `خصم (${item.itemDiscount.value}${item.itemDiscount.type === "percentage" ? "%" : " ج.م"})`
                          : "خصم صنف"}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Inline Price Override input */}
                {editingPriceProductId === item.productId && (
                  <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-amber-500/40">
                    <span className="text-[11px] text-slate-300 font-medium">سعر جديد:</span>
                    <input
                      type="number"
                      value={tempOverridePrice}
                      onChange={(e) => setTempOverridePrice(e.target.value)}
                      className="w-20 bg-slate-950 border border-slate-700 text-xs px-2 py-1 rounded text-amber-400 font-bold focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const parsed = parseFloat(tempOverridePrice);
                        onUpdatePrice(
                          item.productId,
                          isNaN(parsed) || parsed < 0 ? undefined : parsed
                        );
                        setEditingPriceProductId(null);
                      }}
                      className="px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-md"
                    >
                      حفظ
                    </button>
                    <button
                      onClick={() => {
                        onUpdatePrice(item.productId, undefined);
                        setEditingPriceProductId(null);
                      }}
                      className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] rounded-md hover:text-slate-200"
                    >
                      إلغاء
                    </button>
                  </div>
                )}

                {/* Inline Item Discount Editor Panel */}
                {editingDiscountProductId === item.productId && (
                  <div className="flex flex-col gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-rose-500/40 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-200 font-bold flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-rose-400" /> خصم صنف ({item.name})
                      </span>
                      <button
                        onClick={() => setEditingDiscountProductId(null)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="grid grid-cols-2 gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex-1">
                        <button
                          onClick={() => setTempDiscountType("percentage")}
                          className={`py-1 text-[10px] font-bold rounded-md transition-all ${
                            tempDiscountType === "percentage"
                              ? "bg-rose-500 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          نسبة (%)
                        </button>
                        <button
                          onClick={() => setTempDiscountType("fixed")}
                          className={`py-1 text-[10px] font-bold rounded-md transition-all ${
                            tempDiscountType === "fixed"
                              ? "bg-rose-500 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          مبلغ (ج.م)
                        </button>
                      </div>

                      <input
                        type="number"
                        value={tempDiscountValue}
                        onChange={(e) => setTempDiscountValue(e.target.value)}
                        placeholder="القيمة"
                        className="w-20 bg-slate-950 border border-slate-700 text-xs px-2 py-1 rounded-lg text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          onUpdateItemDiscount(item.productId, undefined);
                          setEditingDiscountProductId(null);
                        }}
                        className="text-[10px] text-slate-400 hover:text-rose-400 font-medium"
                      >
                        إزالة الخصم
                      </button>

                      <button
                        onClick={() => {
                          const val = parseFloat(tempDiscountValue);
                          if (!isNaN(val) && val > 0) {
                            onUpdateItemDiscount(item.productId, {
                              type: tempDiscountType,
                              value: val,
                            });
                          } else {
                            onUpdateItemDiscount(item.productId, undefined);
                          }
                          setEditingDiscountProductId(null);
                        }}
                        className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-extrabold rounded-lg transition-all shadow-sm"
                      >
                        تطبيق الخصم
                      </button>
                    </div>
                  </div>
                )}

                {/* Quantity Controls & Subtotal */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-bold text-amber-400 min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-xs font-extrabold text-slate-200">
                    {(effectiveUnitPrice * item.quantity).toLocaleString()} ج.م
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer Info Fields */}
      <div className="py-2.5 border-t border-slate-800 space-y-2 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="رقم هاتف العميل"
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="اسم العميل (اختياري)"
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* Discount & Payment Method Selector */}
      <div className="py-2.5 border-t border-slate-800 space-y-2.5 shrink-0">
        {/* Discount Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsDiscountModalOpen(true)}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 bg-amber-950/30 border border-amber-800/40 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            {orderDiscount.value > 0
              ? `خصم الفاتورة: ${orderDiscount.value}${orderDiscount.type === "percentage" ? "%" : " ج.م"}`
              : "خصم كلي على الفاتورة"}
          </button>

          {totals.totalDiscount > 0 && (
            <span className="text-xs font-bold text-rose-400">
              مجموع الخصم: -{totals.totalDiscount.toLocaleString()} ج.م
            </span>
          )}
        </div>

        {/* Payment Methods Grid */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 mb-1.5 block">طريقة الدفع في المحل:</span>
          <div className="grid grid-cols-2 gap-1.5">
            {paymentMethodsList.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? `${method.color} ring-1 ring-amber-500/40 shadow-sm`
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Checkout Totals Summary & CTA */}
      <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>المجموع قبل الخصم:</span>
          <span>{totals.originalTotal.toLocaleString()} ج.م</span>
        </div>
        {totals.totalDiscount > 0 && (
          <div className="flex justify-between text-xs text-rose-400 font-bold">
            <span>إجمالي الخصم المطبق:</span>
            <span>-{totals.totalDiscount.toLocaleString()} ج.م</span>
          </div>
        )}
        <div className="flex justify-between text-base font-black text-amber-400 pt-1.5 border-t border-slate-800">
          <span>الصافي النهائي للمدفوع:</span>
          <span>{totals.finalTotal.toLocaleString()} ج.م</span>
        </div>

        {checkoutError && (
          <div className="flex items-center gap-2 p-2.5 bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="flex-1 font-medium">{checkoutError}</span>
          </div>
        )}

        {/* Complete Sale Action Button */}
        <button
          onClick={handleCheckout}
          disabled={isSubmitting || items.length === 0}
          className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
            isSubmitting || items.length === 0
              ? "bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800"
              : "bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-[0.99] shadow-amber-500/20"
          }`}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>إتمام العملية وطباعة الفاتورة</span>
            </>
          )}
        </button>
      </div>

      {/* Order Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" /> خصم الفاتورة (Order Discount)
              </h3>
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">نوع الخصم:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrderDiscount((prev) => ({ ...prev, type: "fixed" }))}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      orderDiscount.type === "fixed"
                        ? "bg-amber-500 text-slate-950 border-amber-400"
                        : "bg-slate-950 text-slate-300 border-slate-800"
                    }`}
                  >
                    مبلغ ثابت (ج.م)
                  </button>
                  <button
                    onClick={() => setOrderDiscount((prev) => ({ ...prev, type: "percentage" }))}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      orderDiscount.type === "percentage"
                        ? "bg-amber-500 text-slate-950 border-amber-400"
                        : "bg-slate-950 text-slate-300 border-slate-800"
                    }`}
                  >
                    نسبة مئوية (%)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">قيمة الخصم:</label>
                <input
                  type="number"
                  value={orderDiscount.value || ""}
                  onChange={(e) =>
                    setOrderDiscount((prev) => ({
                      ...prev,
                      value: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-extrabold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setOrderDiscount({ type: "fixed", value: 0 });
                  setIsDiscountModalOpen(false);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold"
              >
                إلغاء الخصم
              </button>
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl"
              >
                تطبيق الخصم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt & Print Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 no-print">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-slate-100">تم إتمام الفاتورة بنجاح</h3>
              </div>
              <button
                onClick={() => setReceiptData(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview Paper */}
            <div
              id="printable-pos-receipt"
              className="bg-white text-slate-950 p-4 rounded-xl text-xs font-mono space-y-3 shadow-inner border border-slate-200"
            >
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <h2 className="text-base font-black text-slate-900">كاش إير POS - QuesnaShop</h2>
                <p className="text-[11px] text-slate-600">فاتورة بيع مباشرة</p>
                <p className="text-[10px] text-slate-500">رقم الفاتورة: #{receiptData.orderId}</p>
                <p className="text-[10px] text-slate-500">التاريخ: {receiptData.date}</p>
                <p className="text-[10px] text-slate-500">الكاشير: {receiptData.cashierName}</p>
              </div>

              {receiptData.customerPhone && (
                <div className="border-b border-dashed border-slate-400 pb-2 text-[11px]">
                  <p>العميل: {receiptData.customerName || "عميل مباشر"}</p>
                  <p>الهاتف: {receiptData.customerPhone}</p>
                </div>
              )}

              {/* Items Table */}
              <table className="w-full text-right text-[11px]">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-700">
                    <th className="py-1">الصنف</th>
                    <th className="py-1 text-center">الكمية</th>
                    <th className="py-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items.map((it: any, i: number) => {
                    const price = it.overridePrice !== undefined ? it.overridePrice : it.price;
                    return (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-1 font-sans">{it.name}</td>
                        <td className="py-1 text-center font-bold">{it.quantity}</td>
                        <td className="py-1 text-left font-bold">
                          {(price * it.quantity).toLocaleString()} ج.م
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-left">
                <div className="flex justify-between">
                  <span>المجموع:</span>
                  <span>{receiptData.totals.originalTotal.toLocaleString()} ج.م</span>
                </div>
                {receiptData.totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>الخصم:</span>
                    <span>-{receiptData.totals.totalDiscount.toLocaleString()} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300">
                  <span>الصافي المدفوع:</span>
                  <span>{receiptData.totals.finalTotal.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>طريقة الدفع:</span>
                  <span className="font-bold uppercase">{receiptData.paymentMethod}</span>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[10px] text-slate-500">
                شكراً لزيارتكم متجر قويسنا - نتمنى لكم يوماً سعيداً
              </div>
            </div>

            {/* Print & Share Actions */}
            <div className="flex items-center gap-2 pt-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> طباعة الفاتورة
              </button>

              {receiptData.customerPhone && (
                <a
                  href={`https://wa.me/2${receiptData.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `شكراً لتسوقكم من كاش إير!\nرقم الفاتورة: #${receiptData.orderId}\nالإجمالي المدفوع: ${receiptData.totals.finalTotal} ج.م`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                >
                  <MessageSquare className="w-4 h-4" /> واتساب
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
