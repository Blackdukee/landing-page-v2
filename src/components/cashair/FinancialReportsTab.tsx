"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  RotateCcw,
  Tag,
  CreditCard,
  Building2,
  Package,
  Calendar,
  Printer,
  RefreshCw,
  Store,
  Globe,
  Banknote,
  QrCode,
  Smartphone,
  Layers,
} from "lucide-react";

export default function FinancialReportsTab() {
  const [period, setPeriod] = useState<"today" | "yesterday" | "this_week" | "this_month" | "custom">(
    "today"
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/cashair/reports?period=${period}`;
      if (period === "custom" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.report) {
        setReport(data.report);
      } else {
        setError(data.error || "فشل تحميل التقارير المالية.");
      }
    } catch (err) {
      setError("خطأ في الاتصال بالخادم عند جلب التقرير المالي.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchReport();
    }
  };

  const periodOptions = [
    { id: "today", label: "اليوم (Today)" },
    { id: "yesterday", label: "أمس (Yesterday)" },
    { id: "this_week", label: "هذا الأسبوع (This Week)" },
    { id: "this_month", label: "هذا الشهر (This Month)" },
    { id: "custom", label: "تاريخ مخصص (Custom)" },
  ];

  const getPeriodLabel = () => {
    if (period === "today") return "اليوم (Today)";
    if (period === "yesterday") return "أمس (Yesterday)";
    if (period === "this_week") return "هذا الأسبوع (This Week)";
    if (period === "this_month") return "هذا الشهر (This Month)";
    if (period === "custom") return `تاريخ مخصص: من ${startDate || "---"} إلى ${endDate || "---"}`;
    return "";
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            التقارير والإحصائيات المالية (Financial Reports)
          </h2>
          <p className="text-xs text-slate-400">
            تحليل المبيعات، الأرباح، المرتجعات، وتوزيع القنوات والدفع
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {periodOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === opt.id
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-amber-400" /> طباعة البيان المالي
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker form if custom selected */}
      {period === "custom" && (
        <form
          onSubmit={handleCustomDateSubmit}
          className="my-3 p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl flex flex-wrap items-center gap-3 text-xs no-print"
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-400">من:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">إلى:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all"
          >
            تطبيق
          </button>
        </form>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm font-medium">جاري استخراج البيان والتقارير المالية...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-80 text-rose-400 gap-3">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-slate-800 text-slate-200 text-xs rounded-xl border border-slate-700"
          >
            إعادة التحديث
          </button>
        </div>
      ) : report ? (
        <div className="space-y-6 pt-4" id="printable-financial-report">
          {/* Dedicated Print-Only Document Header */}
          <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4 text-slate-900">
            <div className="flex justify-between items-start gap-6 dir-rtl">
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  كاش إير POS - M L N TOOLS | متجر M L N TOOLS
                </h1>
                <h2 className="text-base font-bold text-slate-700 mt-1">
                  بيان التقارير والإحصائيات المالية التفصيلية (Financial Report Statement)
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  نظام إدارة المبيعات وتتبع الإيرادات وحركات الخزانة
                </p>
              </div>
              <div className="text-right text-xs text-slate-700 space-y-1.5 shrink-0 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900">فترة التقرير: <span className="font-normal">{getPeriodLabel()}</span></p>
                <p className="text-slate-600">تاريخ الإصدار: <span className="font-semibold text-slate-900">{new Date().toLocaleString("ar-EG")}</span></p>
                <p className="text-slate-600">حالة البيانات: <span className="font-bold text-emerald-700">محدثة ومحققة من النظام</span></p>
              </div>
            </div>
          </div>
          {/* Main KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Gross Sales */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">إجمالي المبيعات</span>
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-base font-extrabold text-slate-100">
                {(report.grossSales || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
              </p>
            </div>

            {/* Discounts */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">الخصومات</span>
                <Tag className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-base font-extrabold text-amber-400">
                -{(report.totalDiscounts || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
              </p>
            </div>

            {/* Returns */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">المرتجعات</span>
                <RotateCcw className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-base font-extrabold text-rose-400">
                -{(report.totalRefunds || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
              </p>
            </div>

            {/* Net Revenue */}
            <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col justify-between bg-emerald-950/20">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-xs font-bold">صافي الأرباح والإيرادات</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-lg font-black text-emerald-400">
                {(report.netRevenue || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
              </p>
            </div>

            {/* Orders Count */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">عدد الطلبات</span>
                <ShoppingCart className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-base font-extrabold text-slate-100">
                {(report.totalOrdersCount || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">طلب</span>
              </p>
            </div>

            {/* AOV */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">متوسط قيمة الطلب (AOV)</span>
                <CreditCard className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-base font-extrabold text-purple-300">
                {(report.averageOrderValue || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
              </p>
            </div>
          </div>

          {/* Channels & Payment Breakdown Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales Channel Split */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500" /> توزيع القنوات (In-Store POS vs Online Storefront)
              </h3>
              <div className="space-y-3 pt-1">
                {/* POS Channel */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-400" /> كاشير المحل (POS)
                    </span>
                    <span className="font-bold text-amber-400">
                      {(report.salesChannels?.pos?.revenue || 0).toLocaleString()} ج.م (
                      {report.salesChannels?.pos?.ordersCount || 0} طلب)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          report.netRevenue > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  ((report.salesChannels?.pos?.revenue || 0) / report.netRevenue) *
                                    100
                                )
                              )
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Online Store Channel */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" /> المتجر الإلكتروني (Web Storefront)
                    </span>
                    <span className="font-bold text-cyan-400">
                      {(report.salesChannels?.online?.revenue || 0).toLocaleString()} ج.م (
                      {report.salesChannels?.online?.ordersCount || 0} طلب)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          report.netRevenue > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  ((report.salesChannels?.online?.revenue || 0) /
                                    report.netRevenue) *
                                    100
                                )
                              )
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" /> وسائل التحصيل والدفع (Payment Methods)
              </h3>
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Banknote className="w-3.5 h-3.5 text-emerald-400" /> نقدًا (Cash)
                  </span>
                  <span className="font-bold text-emerald-400 block mt-1">
                    {(report.paymentMethods?.cash || 0).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <QrCode className="w-3.5 h-3.5 text-purple-400" /> إنستا باي (InstaPay)
                  </span>
                  <span className="font-bold text-purple-400 block mt-1">
                    {(report.paymentMethods?.instapay || 0).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Smartphone className="w-3.5 h-3.5 text-rose-400" /> فودافون كاش
                  </span>
                  <span className="font-bold text-rose-400 block mt-1">
                    {(report.paymentMethods?.vodafone_cash || 0).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" /> فيزا / كارت POS
                  </span>
                  <span className="font-bold text-blue-400 block mt-1">
                    {(report.paymentMethods?.card || 0).toLocaleString()} ج.م
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products Table & Volume Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" /> الأكثر مبيعاً (Top Selling Products)
              </h3>
              <div className="overflow-x-auto max-h-56 scrollbar-thin scrollbar-thumb-slate-700">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-2 px-1">المنتج</th>
                      <th className="py-2 text-center">الكمية المباعة</th>
                      <th className="py-2 text-left">الإيراد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts && report.topProducts.length > 0 ? (
                      report.topProducts.map((p: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                          <td className="py-2 px-1 font-semibold text-slate-200 truncate max-w-[140px]">
                            {p.name}
                          </td>
                          <td className="py-2 text-center font-bold text-amber-400">{p.quantity}</td>
                          <td className="py-2 text-left font-bold text-emerald-400">
                            {p.revenue.toLocaleString()} ج.م
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-500">
                          لا توجد مبيعات مسجلة خلال الفترة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category & Brand Breakdown */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> مبيعات الأقسام والماركات (Category & Brand)
              </h3>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                {/* Category Volume */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    أعلى الأقسام مبيعاً:
                  </span>
                  {report.categorySales && report.categorySales.length > 0 ? (
                    report.categorySales.map((cat: any, i: number) => (
                      <div
                        key={i}
                        className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex justify-between items-center text-xs"
                      >
                        <span className="font-semibold text-slate-300">{cat.categoryName}</span>
                        <span className="font-bold text-cyan-400">{cat.revenue.toLocaleString()} ج.م</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">لا تتوفر بيانات أقسام</p>
                  )}
                </div>

                {/* Company Revenue */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    أعلى الماركات إيراداً:
                  </span>
                  {report.companySales && report.companySales.length > 0 ? (
                    report.companySales.map((comp: any, i: number) => (
                      <div
                        key={i}
                        className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex justify-between items-center text-xs"
                      >
                        <span className="font-semibold text-slate-300">{comp.companyName}</span>
                        <span className="font-bold text-amber-400">{comp.revenue.toLocaleString()} ج.م</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">لا تتوفر بيانات ماركات</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Print-Only Document Footer */}
          <div className="hidden print:block pt-6 mt-6 border-t-2 border-slate-900 text-xs text-slate-800 print-avoid-break">
            <div className="flex justify-between items-center">
              <p className="font-semibold">
                تم إصدار هذا البيان المالي تلقائياً بواسطة منظومة كاش إير POS 
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
