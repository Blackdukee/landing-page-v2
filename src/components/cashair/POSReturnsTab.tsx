"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  DollarSign,
  Printer,
  PackageCheck,
  PackageX,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  Trash2,
} from "lucide-react";

export default function POSReturnsTab() {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [restockFilter, setRestockFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [returnsList, setReturnsList] = useState<any[]>([]);

  // Selected Return Voucher for Detail View
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);

  const handleDeleteReturn = async (returnId: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف سجل المرتجع هذا نهائياً من النظام؟")) return;
    try {
      const res = await fetch(`/api/cashair/returns/${returnId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedReturn(null);
        fetchReturns();
      }
    } catch {
      // Ignore error
    }
  };

  const fetchReturns = async () => {
    setLoading(true);
    try {
      let url = `/api/cashair/returns/list?limit=100`;
      if (search.trim()) url += `&q=${encodeURIComponent(search.trim())}`;
      if (paymentFilter !== "all") url += `&paymentMethod=${paymentFilter}`;
      if (restockFilter !== "all") url += `&restock=${restockFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReturnsList(data.returns || []);
      }
    } catch {
      // Ignore error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [paymentFilter, restockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReturns();
  };

  // KPI Calculations
  const totalRefundedSum = returnsList.reduce((acc, r) => acc + (r.totalRefunded || 0), 0);
  const totalRestockedCount = returnsList.filter((r) => r.restockToInventory).length;

  const paymentLabels: Record<string, { label: string; icon: any; color: string }> = {
    cash: { label: "نقدًا (Cash)", icon: Banknote, color: "text-emerald-400" },
    instapay: { label: "إنستا باي", icon: QrCode, color: "text-purple-400" },
    vodafone_cash: { label: "فودافون كاش", icon: Smartphone, color: "text-rose-400" },
    card: { label: "فيزا / كارت", icon: CreditCard, color: "text-blue-400" },
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-500" />
            سجل إيصالات المرتجعات (Returns Ledger)
          </h2>
          <p className="text-xs text-slate-400">
            تتبع ومراجعة عمليات إرجاع الأصناف واسترداد المبالغ المسجلة بالنظام
          </p>
        </div>

        <button
          onClick={fetchReturns}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? "animate-spin" : ""}`} /> تحديث السجل
        </button>
      </div>

      {/* KPI Cards Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 no-print">
        <div className="bg-slate-800/80 border border-rose-500/30 rounded-xl p-3.5 flex items-center justify-between bg-rose-950/20">
          <div>
            <span className="text-xs text-slate-400 block font-semibold">إجمالي المبالغ المستردة</span>
            <p className="text-lg font-black text-rose-400 mt-0.5">
              {totalRefundedSum.toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
            </p>
          </div>
          <DollarSign className="w-6 h-6 text-rose-400" />
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-semibold">إجمالي عمليات المرتجع</span>
            <p className="text-lg font-black text-amber-400 mt-0.5">
              {returnsList.length} <span className="text-xs font-normal text-slate-400">عملية</span>
            </p>
          </div>
          <RotateCcw className="w-6 h-6 text-amber-400" />
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-semibold">إعادة للمخزن</span>
            <p className="text-lg font-black text-emerald-400 mt-0.5">
              {totalRestockedCount} <span className="text-xs font-normal text-slate-400">إيصال</span>
            </p>
          </div>
          <PackageCheck className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 no-print">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الفاتورة الأصلية أو هاتف العميل..."
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

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">جميع طرق الاسترداد</option>
            <option value="cash">نقدًا (Cash)</option>
            <option value="instapay">إنستا باي (InstaPay)</option>
            <option value="vodafone_cash">فودافون كاش</option>
            <option value="card">فيزا / كارت POS</option>
          </select>

          {/* Restock Filter */}
          <select
            value={restockFilter}
            onChange={(e) => setRestockFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">حالة إعادة المخزون</option>
            <option value="yes">تمت الإعادة للمخزن</option>
            <option value="no">استرداد بدون إعادة للمخزن</option>
          </select>
        </div>
      </div>

      {/* Returns Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm font-medium">جاري تحميل سجلات المرتجعات...</p>
        </div>
      ) : returnsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-2">
          <RotateCcw className="w-12 h-12 stroke-[1.5]" />
          <p className="text-sm font-semibold">لا توجد سجلات مرتجع تطابق خيارات الفلتر</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400">
                <th className="py-3 px-3">رقم الفاتورة الأصلية</th>
                <th className="py-3 px-3">التاريخ والوقت</th>
                <th className="py-3 px-3">العميل</th>
                <th className="py-3 px-3 text-center">الأصناف المرجعة</th>
                <th className="py-3 px-3">المبلغ المسترد</th>
                <th className="py-3 px-3">طريقة الاسترداد</th>
                <th className="py-3 px-3 text-center">المخزن</th>
                <th className="py-3 px-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {returnsList.map((ret, idx) => {
                const payInfo = paymentLabels[ret.paymentMethod] || {
                  label: ret.paymentMethod,
                  icon: Banknote,
                  color: "text-slate-300",
                };
                const PayIcon = payInfo.icon;

                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      #{ret.orderId.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(ret.createdAt).toLocaleString("ar-EG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">{ret.customerName}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-300">
                      {ret.items?.length || 0} صنف
                    </td>
                    <td className="py-3 px-3 font-extrabold text-rose-400 text-sm">
                      {(ret.totalRefunded || 0).toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 font-bold ${payInfo.color}`}>
                        <PayIcon className="w-3.5 h-3.5" />
                        {payInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {ret.restockToInventory ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-bold">
                          <PackageCheck className="w-3 h-3" /> تم الإرجاع
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px]">
                          <PackageX className="w-3 h-3" /> بدون إرجاع
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedReturn(ret)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" /> معاينة الإيصال
                        </button>
                        <button
                          onClick={() => handleDeleteReturn(ret.returnId)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 rounded-lg transition-colors"
                          title="حذف/إلغاء سجل المرتجع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Voucher Detail Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 no-print">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-100">إيصال مرتجع فاتورة #{selectedReturn.orderId.slice(-6).toUpperCase()}</h3>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            {/* Printable Voucher Paper */}
            <div
              id="printable-return-voucher"
              className="bg-white text-slate-950 p-4 rounded-xl text-xs font-mono space-y-3 border border-slate-200 shadow-inner"
            >
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <h3 className="text-base font-black text-slate-900">إيصال مرتجع - M L N TOOLS POS</h3>
                <p className="text-[10px] text-slate-500">رقم الفاتورة الأصلية: #{selectedReturn.orderId.slice(-6).toUpperCase()}</p>
                <p className="text-[10px] text-slate-500">
                  التاريخ: {new Date(selectedReturn.createdAt).toLocaleString("ar-EG")}
                </p>
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
                  {selectedReturn.items?.map((it: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-1">{it.name || "صنف مرتجع"}</td>
                      <td className="py-1 text-center font-bold">{it.quantity}</td>
                      <td className="py-1 text-left font-bold">
                        {((it.price || it.refundAmount || 0) * (it.quantity || 1)).toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-2 border-t border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between font-black text-sm text-slate-900">
                  <span>إجمالي المبلغ المسترد:</span>
                  <span>{(selectedReturn.totalRefunded || 0).toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>طريقة الاسترداد:</span>
                  <span className="font-bold uppercase">{selectedReturn.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>إعادة للمخزن:</span>
                  <span>{selectedReturn.restockToInventory ? "نعم" : "لا"}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> طباعة إيصال المرتجع
              </button>
              <button
                onClick={() => handleDeleteReturn(selectedReturn.returnId)}
                className="py-2.5 px-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs rounded-xl flex items-center gap-1.5"
                title="حذف هذا المرتجع"
              >
                <Trash2 className="w-4 h-4" /> حذف المرتجع
              </button>
              <button
                onClick={() => setSelectedReturn(null)}
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
