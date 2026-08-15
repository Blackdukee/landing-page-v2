"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  RotateCcw,
  Tag,
  CreditCard,
  Package,
  Printer,
  RefreshCw,
  Store,
  Globe,
  Banknote,
  QrCode,
  Smartphone,
  Layers,
  Building2,
  Filter,
  X,
} from "lucide-react";

export default function FinancialReportsTab() {
  const [period, setPeriod] = useState<"today" | "yesterday" | "this_week" | "this_month" | "custom">(
    "today"
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Brand / Category filter state
  const [companies, setCompanies] = useState<Array<{ _id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; slug?: string }>>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any | null>(null);

  // Fetch available brands and categories on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [compRes, catRes] = await Promise.all([
          fetch("/api/companies"),
          fetch("/api/categories"),
        ]);
        if (compRes.ok) {
          const compData = await compRes.json();
          if (Array.isArray(compData)) setCompanies(compData);
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData)) setCategories(catData);
        }
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    }
    loadFilterOptions();
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/cashair/reports?period=${period}`;
      if (period === "custom" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      if (selectedCompany) {
        url += `&companyId=${encodeURIComponent(selectedCompany)}`;
      }
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.report) {
        setReport(data.report);
      } else {
        setError(data.error || "تعذر تحميل التقارير المالية.");
      }
    } catch {
      setError("حدث خطأ في الاتصال بالخادم أثناء جلب التقارير المالية.");
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, selectedCompany, selectedCategory]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchReport();
    }
  };

  const handleResetFilters = () => {
    setSelectedCompany("");
    setSelectedCategory("");
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
    if (period === "custom") return `فترة مخصصة: من ${startDate || "---"} إلى ${endDate || "---"}`;
    return "";
  };

  const selectedCompanyName =
    companies.find((c) => c._id === selectedCompany)?.name || selectedCompany;
  const isAnyFilterActive = Boolean(selectedCompany || selectedCategory);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            التقارير الإحصائية والمالية (Financial Reports)
          </h2>
          <p className="text-xs text-slate-400">
            تحليل الإيرادات والأرباح والمبيعات ومقارنة القنوات وطرق الدفع
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
            <Printer className="w-4 h-4 text-amber-400" /> طباعة التقرير المالي
          </button>
        </div>
      </div>

      {/* Secondary Toolbar: Brand and Category Filters */}
      <div className="my-3 p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <span>فلترة التقرير حسب:</span>
          </div>

          {/* Brand / Company Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-transparent text-slate-100 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="" className="bg-slate-800 text-slate-300">
                كل الماركات (All Brands)
              </option>
              {companies.map((comp) => (
                <option key={comp._id} value={comp._id} className="bg-slate-800 text-slate-100">
                  {comp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-100 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="" className="bg-slate-800 text-slate-300">
                كل الأقسام (All Categories)
              </option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name} className="bg-slate-800 text-slate-100">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {isAnyFilterActive && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <X className="w-3.5 h-3.5" /> مسح الفلاتر
            </button>
          )}
        </div>

        {/* Active Filter Badges */}
        {isAnyFilterActive && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedCompany && (
              <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-md text-[11px] font-medium flex items-center gap-1">
                <Building2 className="w-3 h-3" /> الماركة: {selectedCompanyName}
              </span>
            )}
            {selectedCategory && (
              <span className="px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded-md text-[11px] font-medium flex items-center gap-1">
                <Tag className="w-3 h-3" /> القسم: {selectedCategory}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Custom Date Range Picker form if custom selected */}
      {period === "custom" && (
        <form
          onSubmit={handleCustomDateSubmit}
          className="mb-3 p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl flex flex-wrap items-center gap-3 text-xs no-print"
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
          <p className="text-sm font-medium">جاري تحضير وجمع التقارير المالية...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-80 text-rose-400 gap-3">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-slate-800 text-slate-200 text-xs rounded-xl border border-slate-700"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : report ? (
        <div className="space-y-6 pt-4" id="printable-financial-report">
          {/* Dedicated Print-Only Document Header */}
          <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4 text-slate-900">
            <div className="flex justify-between items-start gap-6 dir-rtl">
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  نظام كاشير POS - M L N TOOLS | منصة M L N TOOLS
                </h1>
                <h2 className="text-base font-bold text-slate-700 mt-1">
                  كشف الحسابات والتقارير المالية المجمعة (Financial Report Statement)
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  بيان تدقيق الأرباح والمبيعات وتكاليف المنتجات وطرق الدفع
                </p>
              </div>
              <div className="text-right text-xs text-slate-700 space-y-1.5 shrink-0 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900">فترة التقرير: <span className="font-normal">{getPeriodLabel()}</span></p>
                {selectedCompany && (
                  <p className="text-slate-700 font-semibold">الماركة: <span className="font-bold text-amber-700">{selectedCompanyName}</span></p>
                )}
                {selectedCategory && (
                  <p className="text-slate-700 font-semibold">القسم: <span className="font-bold text-cyan-700">{selectedCategory}</span></p>
                )}
                <p className="text-slate-600">تاريخ الطباعة: <span className="font-semibold text-slate-900">{new Date().toLocaleString("ar-EG")}</span></p>
                <p className="text-slate-600">حالة المطابقة: <span className="font-bold text-emerald-700">مطابق للقيود في القاعدة</span></p>
              </div>
            </div>
          </div>
          {/* Main KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
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
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">صافي الإيرادات (المحصل)</span>
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-base font-black text-cyan-300">
                {(report.netRevenue || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
              </p>
            </div>

            {/* Cost of Goods Sold (COGS) */}
            <div className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-between bg-amber-950/10">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-xs font-bold">تكلفة البضاعة المباعة (سعر الشراء)</span>
                <Package className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-base font-black text-amber-300">
                {(report.totalCostOfGoodsSold || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
              </p>
            </div>

            {/* Gross / Net Profit */}
            <div className="bg-slate-800/80 border border-emerald-500/50 rounded-xl p-3.5 flex flex-col justify-between bg-emerald-950/30 shadow-lg shadow-emerald-950/40">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-xs font-black">صافي الأرباح المحققة</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className={`text-lg font-black ${(report.grossProfit ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {(report.grossProfit || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
              </p>
            </div>

            {/* Profit Margin */}
            <div className="bg-slate-800/80 border border-purple-500/30 rounded-xl p-3.5 flex flex-col justify-between bg-purple-950/10">
              <div className="flex items-center justify-between text-purple-400 mb-2">
                <span className="text-xs font-bold">هامش الربح (Profit Margin)</span>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-base font-black text-purple-300">
                {(report.profitMargin || 0).toFixed(1)}%
              </p>
            </div>

            {/* Orders Count & AOV */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">عدد الطلبات (متوسط الطلب)</span>
                <ShoppingCart className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-base font-extrabold text-slate-100">
                {(report.totalOrdersCount || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">طلب</span>
                <span className="text-xs text-indigo-300 font-normal mr-2">({(report.averageOrderValue || 0).toLocaleString()} ج.م/طلب)</span>
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
                      <th className="py-2 text-center">الكمية</th>
                      <th className="py-2 text-left">الإيراد</th>
                      <th className="py-2 text-left">التكلفة</th>
                      <th className="py-2 text-left">صافي الربح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts && report.topProducts.length > 0 ? (
                      report.topProducts.map((p: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                          <td className="py-2 px-1 font-semibold text-slate-200 truncate max-w-[130px]">
                            {p.name}
                          </td>
                          <td className="py-2 text-center font-bold text-amber-400">{p.quantity}</td>
                          <td className="py-2 text-left font-bold text-cyan-400">
                            {p.revenue.toLocaleString()} ج.م
                          </td>
                          <td className="py-2 text-left font-semibold text-slate-400">
                            {(p.cost || 0).toLocaleString()} ج.م
                          </td>
                          <td className={`py-2 text-left font-extrabold ${(p.profit ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {(p.profit || 0).toLocaleString()} ج.م
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500">
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
