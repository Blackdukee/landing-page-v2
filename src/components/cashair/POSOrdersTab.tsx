"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  RotateCcw,
  Printer,
  Globe,
  Store,
  User,
  Phone,
  MapPin,
  Trash2,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { printElement } from "@/lib/printer/printHelper";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

export default function POSOrdersTab() {
  const { websiteName, favicon } = useSiteSettings();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editCustomerAddress, setEditCustomerAddress] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/cashair/orders?limit=100`;
      if (search.trim()) url += `&q=${encodeURIComponent(search.trim())}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (sourceFilter !== "all") url += `&source=${sourceFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        setTotalCount(data.total || 0);
      }
    } catch {
      // Ignore fetch error
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder?._id) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSelectedOrder((prev: any) => (prev ? { ...prev, status: newStatus } : null));
        fetchOrders();
      }
    } catch {
      // Ignore error
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذه الفاتورة نهائياً؟ سيتم استرجاع كميات الأصناف المباعة تلقائياً إلى المخزن.")) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch {
      // Ignore error
    }
  };

  const handleUpdateCustomerInfo = async () => {
    if (!selectedOrder?._id) return;
    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerInfo: {
            ...selectedOrder.customerInfo,
            name: editCustomerName,
            phone: editCustomerPhone,
            address: editCustomerAddress,
          },
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedOrder(updated);
        setIsEditingCustomer(false);
        fetchOrders();
      }
    } catch {
      // Ignore error
    }
  };

  const statusBadges: Record<string, { label: string; bg: string; icon: any }> = {
    pending: { label: "قيد الانتظار", bg: "bg-amber-950/80 border-amber-800 text-amber-300", icon: Clock },
    confirmed: { label: "مؤكد", bg: "bg-blue-950/80 border-blue-800 text-blue-300", icon: CheckCircle2 },
    shipped: { label: "جاري الشحن", bg: "bg-cyan-950/80 border-cyan-800 text-cyan-300", icon: Truck },
    delivered: { label: "تم التسليم", bg: "bg-emerald-950/80 border-emerald-800 text-emerald-300", icon: CheckCircle2 },
    cancelled: { label: "ملغى", bg: "bg-rose-950/80 border-rose-800 text-rose-300", icon: XCircle },
    returned: { label: "مرتجع بالكامل", bg: "bg-purple-950/80 border-purple-800 text-purple-300", icon: RotateCcw },
    partially_returned: { label: "مرتجع جزئي", bg: "bg-purple-950/60 border-purple-800/80 text-purple-300", icon: RotateCcw },
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
      {/* Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            إدارة الطلبات والمبيعات (Orders Manager)
          </h2>
          <p className="text-xs text-slate-400">
            تصفح ومتابعة كافة طلبات كاشير المحل والمتجر الإلكتروني ({totalCount} طلب مسجل)
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? "animate-spin" : ""}`} /> تحديث البيانات
        </button>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="my-4 flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 no-print">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الفاتورة، اسم العميل، أو الهاتف..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
          >
            بحث
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Source Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 text-[11px] px-2 font-medium">القناة:</span>
            <button
              onClick={() => setSourceFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                sourceFilter === "all" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSourceFilter("pos")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                sourceFilter === "pos" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              المحل (POS)
            </button>
            <button
              onClick={() => setSourceFilter("online")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                sourceFilter === "online" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              أونلاين (Web)
            </button>
          </div>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">كافة الحالات</option>
            <option value="pending">قيد الانتظار (Pending)</option>
            <option value="confirmed">مؤكد (Confirmed)</option>
            <option value="shipped">جاري الشحن (Shipped)</option>
            <option value="delivered">تم التسليم (Delivered)</option>
            <option value="cancelled">ملغى (Cancelled)</option>
            <option value="returned">مرتجع (Returned)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-72 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm font-medium">جاري تحميل سجل الطلبات...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 text-slate-500 gap-2">
          <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
          <p className="text-sm font-semibold">لا توجد طلبات تطابق الفلتر المحدد</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400">
                <th className="py-3 px-3">رقم الطلب</th>
                <th className="py-3 px-3">التاريخ والوقت</th>
                <th className="py-3 px-3">بيانات العميل</th>
                <th className="py-3 px-3">القناة</th>
                <th className="py-3 px-3 text-center">عدد الأصناف</th>
                <th className="py-3 px-3">الإجمالي</th>
                <th className="py-3 px-3 text-center">الحالة</th>
                <th className="py-3 px-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {orders.map((ord) => {
                const stInfo = statusBadges[ord.status] || {
                  label: ord.status,
                  bg: "bg-slate-800 text-slate-300 border-slate-700",
                  icon: Clock,
                };
                const StatusIcon = stInfo.icon;
                const isPOS = ord.source === "pos";

                return (
                  <tr key={ord._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      #{ord._id.toString().slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(ord.createdAt).toLocaleString("ar-EG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-200">{ord.customerInfo?.name || "عميل مباشر"}</p>
                      <p className="text-[10px] text-slate-400 dir-ltr text-right">
                        {ord.customerInfo?.phone || "---"}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      {isPOS ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-400 text-[10px] font-bold">
                          <Store className="w-3 h-3" /> POS المحلي
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-[10px] font-bold">
                          <Globe className="w-3 h-3" /> متجر أونلاين
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-300">
                      {ord.items?.length || 0} صنف
                    </td>
                    <td className="py-3 px-3 font-extrabold text-emerald-400 text-sm">
                      {(ord.totalPrice || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${stInfo.bg}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {stInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 mx-auto transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 no-print">
              <div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  تفاصيل الفاتورة #{selectedOrder._id.toString().slice(-6).toUpperCase()}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {new Date(selectedOrder.createdAt).toLocaleString("ar-EG")}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Customer & Shipping Summary */}
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                  <div className="flex items-center gap-2 text-slate-300 font-bold">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>بيانات العميل</span>
                  </div>
                  {!isEditingCustomer ? (
                    <button
                      onClick={() => {
                        setEditCustomerName(selectedOrder.customerInfo?.name || "");
                        setEditCustomerPhone(selectedOrder.customerInfo?.phone || "");
                        setEditCustomerAddress(selectedOrder.customerInfo?.address || "");
                        setIsEditingCustomer(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px] no-print"
                    >
                      <Pencil className="w-3 h-3" /> تعديل البيانات
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 no-print">
                      <button
                        onClick={handleUpdateCustomerInfo}
                        className="px-2 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-[10px]"
                      >
                        حفظ
                      </button>
                      <button
                        onClick={() => setIsEditingCustomer(false)}
                        className="px-2 py-1 bg-slate-700 text-slate-300 rounded-lg text-[10px]"
                      >
                        إلغاء
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingCustomer ? (
                  <>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span>الاسم: {selectedOrder.customerInfo?.name || "عميل مباشر"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      <span>رقم الهاتف: {selectedOrder.customerInfo?.phone || "---"}</span>
                    </div>
                    {selectedOrder.customerInfo?.address && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-4 h-4 text-rose-400" />
                        <span>عنوان الشحن: {selectedOrder.customerInfo?.address}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2 pt-1 no-print">
                    <input
                      type="text"
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      placeholder="اسم العميل"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs"
                    />
                    <input
                      type="text"
                      value={editCustomerPhone}
                      onChange={(e) => setEditCustomerPhone(e.target.value)}
                      placeholder="رقم الهاتف"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs"
                    />
                    <input
                      type="text"
                      value={editCustomerAddress}
                      onChange={(e) => setEditCustomerAddress(e.target.value)}
                      placeholder="عنوان الشحن"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Status Update Quick Bar */}
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 text-xs space-y-2 no-print">
                <span className="font-bold text-slate-300 block">تحديث حالة الفاتورة/الطلب:</span>
                <div className="flex flex-wrap gap-1.5">
                  {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((st) => (
                    <button
                      key={st}
                      disabled={isUpdatingStatus || selectedOrder.status === st}
                      onClick={() => handleUpdateStatus(st)}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] border transition-all ${
                        selectedOrder.status === st
                          ? "bg-amber-500 text-slate-950 border-amber-400"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {statusBadges[st]?.label || st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">قائمة الأصناف بالطلب:</h4>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 pb-2">
                        <th className="py-1">الصنف</th>
                        <th className="py-1 text-center">الكمية</th>
                        <th className="py-1 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {selectedOrder.items?.map((it: any, i: number) => {
                        const isLoss = it.costPrice && it.costPrice > 0 && it.price < it.costPrice;
                        return (
                          <tr key={i} className="text-slate-300">
                            <td className="py-2.5 font-semibold">
                              <div>
                                <span>{it.name}</span>
                                {isLoss && (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-md w-fit mt-1 animate-pulse">
                                    <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                    <span>
                                      تحذير: بيع بأقل من سعر الشراء ({it.costPrice} ج.م) | خسارة: {((it.costPrice - it.price) * it.quantity).toLocaleString()} ج.م
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 text-center font-bold text-amber-400">{it.quantity}</td>
                            <td className="py-2.5 text-left font-bold text-emerald-400">
                              {(it.price * it.quantity).toLocaleString()} ج.م
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="border-t border-slate-800 pt-3 mt-3 space-y-1 text-left">
                    <div className="flex justify-between text-slate-400">
                      <span>إجمالي الفاتورة:</span>
                      <span>{(selectedOrder.totalPrice || 0).toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-emerald-400 pt-1 border-t border-slate-800">
                      <span>الصافي المطلوب:</span>
                      <span>{(selectedOrder.totalPrice || 0).toLocaleString()} ج.م</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated Printable Thermal Receipt for Selected Order */}
            <div
              id="printable-pos-receipt"
              className="hidden print:block bg-white text-slate-950 px-5 py-4 text-xs font-mono space-y-3"
            >
              <div className="text-center border-b border-slate-300 pb-2.5">
                <div className="flex justify-center mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={favicon || "/favicon.png"}
                    alt={websiteName || "Store Logo"}
                    className="h-12 w-12 object-contain mx-auto"
                  />
                </div>
                <h2 className="text-base font-black text-slate-900">{websiteName || "M L N TOOLS"}</h2>
                <p className="text-[11px] text-slate-600">فاتورة بيع رسمية - POS</p>
                <p className="text-[10px] text-slate-500">رقم الفاتورة: #{selectedOrder._id}</p>
                <p className="text-[10px] text-slate-500">
                  التاريخ: {new Date(selectedOrder.createdAt).toLocaleString("ar-EG")}
                </p>
                <p className="text-[10px] text-slate-500">
                  الكاشير: {selectedOrder.cashierName || "كاشير المحل"}
                </p>
              </div>

              {selectedOrder.customerInfo?.name && (
                <div className="border-b border-slate-300 pb-2 text-[11px]">
                  <p>العميل: {selectedOrder.customerInfo.name}</p>
                  {selectedOrder.customerInfo.phone && <p>الهاتف: {selectedOrder.customerInfo.phone}</p>}
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
                  {selectedOrder.items?.map((it: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1 font-sans">{it.name}</td>
                      <td className="py-1 text-center font-bold">{it.quantity}</td>
                      <td className="py-1 text-left font-bold">
                        {(it.price * it.quantity).toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-300 pt-2 space-y-1 text-left">
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300">
                  <span>الإجمالي النهائي:</span>
                  <span>{(selectedOrder.totalPrice || 0).toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>طريقة الدفع:</span>
                  <span className="font-bold uppercase">{selectedOrder.paymentMethod || "CASH"}</span>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[10px] text-slate-500">
                شكراً لزيارتكم ونتمنى خدمتكم دائماً
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800 no-print">
              <button
                onClick={() =>
                  printElement("printable-pos-receipt", {
                    type: "receipt",
                    title: `فاتورة-${selectedOrder._id}`,
                  })
                }
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> طباعة الفاتورة
              </button>
              <button
                onClick={() => handleDeleteOrder(selectedOrder._id)}
                className="py-2.5 px-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs rounded-xl flex items-center gap-1.5"
                title="حذف هذه الفاتورة نهائياً وإعادة الكميات للمخزن"
              >
                <Trash2 className="w-4 h-4" /> حذف الفاتورة
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
