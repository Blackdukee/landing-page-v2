"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Printer,
  PackageCheck,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

interface ReturnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShiftId: string | null;
  cashierName?: string;
  onReturnCompleted?: () => void;
}

export default function ReturnsModal({
  isOpen,
  onClose,
  activeShiftId,
  cashierName = "Cashier",
  onReturnCompleted,
}: ReturnsModalProps) {
  const { websiteName, favicon } = useSiteSettings();
  // Search query
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Selected Order
  const [foundOrders, setFoundOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Return quantities map (productId -> quantity to return)
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [restockToInventory, setRestockToInventory] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "instapay" | "vodafone_cash" | "card">("cash");
  const [returnReason, setReturnReason] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Return Receipt Modal state
  const [returnVoucher, setReturnVoucher] = useState<any | null>(null);

  if (!isOpen) return null;

  // Search orders via GET /api/cashair/orders
  const handleSearchOrders = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSelectedOrder(null);
    setFoundOrders([]);

    try {
      const res = await fetch(`/api/cashair/orders?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.orders)) {
        if (data.orders.length === 0) {
          setSearchError("لم يتم العثور على طلبات مطابقة للبحث.");
        } else {
          setFoundOrders(data.orders);
          if (data.orders.length === 1) {
            selectOrder(data.orders[0]);
          }
        }
      } else {
        setSearchError(data.error || "فشل البحث عن الفاتورة.");
      }
    } catch {
      setSearchError("خطأ في الاتصال بالخادم عند البحث.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectOrder = (order: any) => {
    setSelectedOrder(order);
    // Initialize quantities to 0
    const initialQtys: Record<string, number> = {};
    if (Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        initialQtys[item.productId || item._id] = 0;
      });
    }
    setReturnQuantities(initialQtys);
  };

  const updateReturnQty = (productId: string, newQty: number, maxQty: number) => {
    const clamped = Math.max(0, Math.min(maxQty, newQty));
    setReturnQuantities((prev) => ({
      ...prev,
      [productId]: clamped,
    }));
  };

  // Submit return
  const handleSubmitReturn = async () => {
    if (!activeShiftId) {
      setSubmitError("يجب فتح وردية أولاً للتمكن من إجراء المرتجعات.");
      return;
    }
    if (!selectedOrder) {
      setSubmitError("يرجى اختيار الطلب المراد إرجاعه أولاً.");
      return;
    }

    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (itemsToReturn.length === 0) {
      setSubmitError("يرجى تحديد كميات المنتجات المراد إرجاعها.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const returnPayload = {
        orderId: selectedOrder._id,
        shiftId: activeShiftId,
        items: itemsToReturn,
        paymentMethod,
        restockToInventory,
        reason: returnReason.trim() || "مرتجع كاشير",
      };

      const res = await fetch("/api/cashair/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(returnPayload),
      });

      const data = await res.json();

      if (data.success) {
        setReturnVoucher({
          returnId: "RET-" + Date.now().toString().slice(-6),
          orderId: selectedOrder._id,
          totalRefunded: data.totalRefunded,
          updatedOrderStatus: data.updatedOrderStatus,
          receiptText: data.receiptText,
          itemsReturned: itemsToReturn.map((it) => {
            const origItem = selectedOrder.items.find(
              (x: any) => (x.productId || x._id) === it.productId
            );
            return {
              name: origItem?.name || "منتج",
              quantity: it.quantity,
              price: origItem?.price || 0,
            };
          }),
          restockToInventory,
          paymentMethod,
          cashierName,
          date: new Date().toLocaleString("ar-EG"),
        });

        if (onReturnCompleted) onReturnCompleted();
      } else {
        setSubmitError(data.error || "فشل معالجة مرتجع الفاتورة");
      }
    } catch {
      setSubmitError("خطأ في الخادم عند إرسال المرتجع.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 no-print">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-100">إدارة المرتجعات واسترداد المبالغ</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Return Voucher / Receipt View if completed */}
        {returnVoucher ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs no-print">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-bold">تم إرجاع المبلغ وإصدار إيصال المرتجع بنجاح!</p>
                <p className="text-[11px] text-emerald-400/90">
                  إجمالي المبلغ المسترد: {returnVoucher.totalRefunded.toLocaleString()} ج.م (حالة الفاتورة: {returnVoucher.updatedOrderStatus})
                </p>
              </div>
            </div>

            {/* Printable Voucher */}
            <div
              id="printable-return-voucher"
              className="bg-white text-slate-950 p-4 rounded-xl text-xs font-mono space-y-2 border border-slate-200"
            >
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                {favicon ? (
                  <div className="flex justify-center mb-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={favicon}
                      alt={websiteName || "Store Icon"}
                      className="h-10 w-10 object-contain mx-auto"
                    />
                  </div>
                ) : null}
                <h3 className="text-base font-black text-slate-900">إيصال مرتجع - {websiteName || "M L N TOOLS"}</h3>
                <p className="text-[10px] text-slate-500">رقم الفاتورة الأصلية: #{returnVoucher.orderId}</p>
                <p className="text-[10px] text-slate-500">التاريخ: {returnVoucher.date}</p>
              </div>

              <table className="w-full text-right text-[11px]">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="py-1">الصنف المرتجع</th>
                    <th className="py-1 text-center">الكمية</th>
                    <th className="py-1 text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {returnVoucher.itemsReturned.map((it: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-1">{it.name}</td>
                      <td className="py-1 text-center font-bold">{it.quantity}</td>
                      <td className="py-1 text-left font-bold">
                        {(it.price * it.quantity).toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-2 border-t border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between font-black text-sm">
                  <span>إجمالي المبلغ المسترد:</span>
                  <span>{returnVoucher.totalRefunded.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>طريقة الاسترداد:</span>
                  <span className="font-bold uppercase">{returnVoucher.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>إعادة للمخزن:</span>
                  <span>{returnVoucher.restockToInventory ? "نعم" : "لا"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> طباعة إيصال المرتجع
              </button>
              <button
                onClick={() => {
                  setReturnVoucher(null);
                  setSelectedOrder(null);
                  setSearchQuery("");
                }}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl"
              >
                مرتجع جديد
              </button>
            </div>
          </div>
        ) : (
          /* Main Search & Selection Form */
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {/* Search Bar */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                ابحث برقم الفاتورة (Order ID) أو رقم هاتف العميل:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchOrders()}
                    placeholder="مثال: 6500a12... أو 01203441866"
                    className="w-full pr-9 pl-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={handleSearchOrders}
                  disabled={isSearching}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4" /> بحث
                    </>
                  )}
                </button>
              </div>

              {searchError && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}
            </div>

            {/* Found Orders Selection List if multiple */}
            {foundOrders.length > 1 && !selectedOrder && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">اختر الفاتورة المطلوبة:</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {foundOrders.map((ord) => (
                    <button
                      key={ord._id}
                      onClick={() => selectOrder(ord)}
                      className="w-full p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-right flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-amber-400">#{ord._id.slice(-8)}</span>
                        <span className="text-slate-400 mr-2">
                          ({new Date(ord.createdAt).toLocaleDateString("ar-EG")})
                        </span>
                      </div>
                      <span className="font-bold text-slate-200">{ord.totalPrice} ج.م</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Order Items Checklist & Return Quantities */}
            {selectedOrder && (
              <div className="space-y-4 border-t border-slate-800 pt-3">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block">الفاتورة المحددة:</span>
                    <span className="font-bold text-amber-400">#{selectedOrder._id}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-400 block">إجمالي قيمة الفاتورة:</span>
                    <span className="font-bold text-slate-100">{selectedOrder.totalPrice} ج.م</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300">حدد المنتجات والكميات المراد إرجاعها:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedOrder.items?.map((item: any) => {
                      const pId = item.productId || item._id;
                      const returnQty = returnQuantities[pId] || 0;
                      const maxQty = item.quantity;

                      return (
                        <div
                          key={pId}
                          className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-slate-100">{item.name}</p>
                            <p className="text-[11px] text-slate-400">
                              سعر القطعة: {item.price} ج.م | تم شراء {maxQty} قطعة
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                              <button
                                onClick={() => updateReturnQty(pId, returnQty - 1, maxQty)}
                                className="p-1 hover:bg-slate-800 text-slate-300 rounded"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 font-bold text-amber-400 min-w-[20px] text-center">
                                {returnQty}
                              </span>
                              <button
                                onClick={() => updateReturnQty(pId, returnQty + 1, maxQty)}
                                className="p-1 hover:bg-slate-800 text-slate-300 rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-slate-400 text-[11px]">/ {maxQty}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Restock Checkbox & Refund Options */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={restockToInventory}
                      onChange={(e) => setRestockToInventory(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                    />
                    <PackageCheck className="w-4 h-4 text-emerald-400" />
                    <span>إعادة المنتجات إلى المخزن تلقائياً (Restock to Inventory)</span>
                  </label>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      طريقة استرداد المبلغ للعميل:
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="cash">نقداً من الدرج (Cash)</option>
                      <option value="instapay">تحويل إنستا باي (InstaPay)</option>
                      <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                      <option value="card">إلغاء معاملة فيزا (Card POS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      سبب الإرجاع:
                    </label>
                    <input
                      type="text"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="مثال: تبديل مقاس / منتج تالف / تغيير رأي العميل"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {submitError && (
                  <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSubmitReturn}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>تأكيد المرتجع واسترداد المبلغ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
