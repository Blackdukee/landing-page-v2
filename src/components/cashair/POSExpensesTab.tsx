"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Banknote,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  Wallet,
  Building2,
  Receipt,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Tag,
  Zap,
  Coffee,
  Package,
  Wrench,
  Truck,
  Users,
  ShoppingBag,
  CreditCard,
  QrCode,
  Smartphone,
  Sparkles,
  Clock,
} from "lucide-react";

interface ExpenseItem {
  _id: string;
  title: string;
  amount: number;
  category: string;
  paymentSource: string;
  paidTo?: string;
  receiptNumber?: string;
  notes?: string;
  performedBy: string;
  shiftId?: string;
  createdAt: string;
}

interface ExpensesSummary {
  totalExpenses: number;
  todayExpenses: number;
  monthExpenses: number;
  shiftExpenses: number;
  categoryBreakdown: { _id: string; total: number; count: number }[];
}

interface POSExpensesTabProps {
  activeShift?: any;
  onShiftUpdated?: () => void;
}

export default function POSExpensesTab({ activeShift, onShiftUpdated }: POSExpensesTabProps) {
  // Data State
  const [summary, setSummary] = useState<ExpensesSummary>({
    totalExpenses: 0,
    todayExpenses: 0,
    monthExpenses: 0,
    shiftExpenses: 0,
    categoryBreakdown: [],
  });
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"today" | "shift" | "week" | "month" | "all">("all");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("utilities");
  const [formSource, setFormSource] = useState("cash_drawer");
  const [formPaidTo, setFormPaidTo] = useState("");
  const [formReceiptNo, setFormReceiptNo] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPerformer, setFormPerformer] = useState(activeShift?.cashierName || "الكاشير");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Expenses
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedSource !== "all") params.set("paymentSource", selectedSource);
      if (dateRange !== "all") params.set("dateRange", dateRange);
      if (activeShift?._id) params.set("shiftId", String(activeShift._id));
      params.set("page", String(page));
      params.set("limit", "25");

      const res = await fetch(`/api/cashair/expenses?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSummary({
          totalExpenses: data.totalExpenses || 0,
          todayExpenses: data.todayExpenses || 0,
          monthExpenses: data.monthExpenses || 0,
          shiftExpenses: data.shiftExpenses || 0,
          categoryBreakdown: data.categoryBreakdown || [],
        });
        setExpenses(data.expenses || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedSource, dateRange, activeShift, page]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Open modal helper
  const openAddModal = () => {
    setFormTitle("");
    setFormAmount("");
    setFormCategory("utilities");
    setFormSource("cash_drawer");
    setFormPaidTo("");
    setFormReceiptNo("");
    setFormNotes("");
    setFormPerformer(activeShift?.cashierName || "الكاشير");
    setFormError(null);
    setFormSuccess(null);
    setIsAddModalOpen(true);
  };

  // Submit expense
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("يرجى إدخال مبلغ صحيح أكبر من صفر");
      return;
    }

    if (!formTitle.trim()) {
      setFormError("يرجى كتابة عنوان أو بيان المصروف");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cashair/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          amount: numAmount,
          category: formCategory,
          paymentSource: formSource,
          paidTo: formPaidTo.trim() || undefined,
          receiptNumber: formReceiptNo.trim() || undefined,
          notes: formNotes.trim() || undefined,
          performedBy: formPerformer.trim() || "الكاشير",
          shiftId: activeShift?._id ? String(activeShift._id) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || "فشل تسجيل المصروف");
      } else {
        setFormSuccess("تم تسجيل المصروف بنجاح وتحديث النقدية");
        if (onShiftUpdated && formSource === "cash_drawer") {
          onShiftUpdated();
        }
        setTimeout(() => {
          setIsAddModalOpen(false);
          fetchExpenses();
        }, 700);
      }
    } catch (err) {
      setFormError("خطأ في الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete expense handler
  const handleDeleteExpense = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cashair/expenses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeletingId(null);
        if (onShiftUpdated) onShiftUpdated();
        fetchExpenses();
      } else {
        alert(data.error || "فشل حذف المصروف");
      }
    } catch (err) {
      alert("خطأ في الاتصال بالخادم");
    } finally {
      setIsDeleting(false);
    }
  };

  // Categories config
  const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
    utilities: { label: "فواتير ومرافق", icon: Zap, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    rent: { label: "إيجار المحل", icon: Building2, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
    hospitality: { label: "ضيافة وبوفيه", icon: Coffee, color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
    supplies: { label: "مستلزمات ونظافة", icon: Package, color: "text-teal-400 bg-teal-500/10 border-teal-500/30" },
    maintenance: { label: "صيانة وإصلاحات", icon: Wrench, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
    transport: { label: "نقل وشحن", icon: Truck, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
    salaries_advances: { label: "سلف ورواتب", icon: Users, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    inventory: { label: "بضاعة نقدية", icon: ShoppingBag, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
    other: { label: "مصاريف أخرى", icon: Tag, color: "text-slate-300 bg-slate-700/30 border-slate-700" },
  };

  // Payment sources config
  const sourceConfig: Record<string, { label: string; icon: any; color: string }> = {
    cash_drawer: { label: "نقدية الدرج (الوردية)", icon: Banknote, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    instapay: { label: "إنستا باي (InstaPay)", icon: QrCode, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
    vodafone_cash: { label: "فودافون كاش", icon: Smartphone, color: "text-red-400 bg-red-500/10 border-red-500/30" },
    bank: { label: "حساب بنكي / فيزا", icon: CreditCard, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
    external: { label: "حساب خارجي / المالك", icon: Wallet, color: "text-slate-300 bg-slate-700/30 border-slate-700" },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Action Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-950 border border-rose-900/40 p-6 shadow-xl">
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-60 h-60 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600/20 border border-rose-500/30 text-rose-400 shadow-inner shadow-rose-500/20">
              <Receipt className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-100">
                  سجل مصروفات المحل (Expenses)
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <Sparkles className="w-3 h-3 text-rose-300" />
                  إدارة المصاريف
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                تسجيل ومتابعة مصاريف التشغيل، الفواتير، الإيجارات وسلف العمال مع خصم تلقائي من نقدية الدرج أو إنستا باي
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={openAddModal}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white px-5 py-2.5 text-xs font-bold shadow-lg shadow-rose-950/50 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4" />
              تسجيل مصروف جديد
            </button>
            <button
              onClick={fetchExpenses}
              disabled={loading}
              type="button"
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
              title="تحديث البيانات"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-rose-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Expenses */}
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-900 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-300">مصروفات اليوم</span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-400 font-mono tracking-tight">
              {summary.todayExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-semibold text-rose-400/80">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            إجمالي المصروفات المسجلة اليوم
          </p>
        </div>

        {/* Card 2: Current Shift Expenses */}
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-300">مصروفات الوردية الحالية</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
              {summary.shiftExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-semibold text-amber-400/80">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {activeShift ? `وردية: ${activeShift.cashierName}` : "لا توجد وردية مفتوحة حالياً"}
          </p>
        </div>

        {/* Card 3: Month Expenses */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">مصروفات هذا الشهر</span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-100 font-mono">
              {summary.monthExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-slate-400">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            الشهر الميلادي الحالي
          </p>
        </div>

        {/* Card 4: Top Category */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">أعلى بند صرف</span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-slate-100 truncate">
              {summary.categoryBreakdown[0]
                ? categoryConfig[summary.categoryBreakdown[0]._id]?.label || summary.categoryBreakdown[0]._id
                : "لا يوجد"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {summary.categoryBreakdown[0]
              ? `${summary.categoryBreakdown[0].total.toLocaleString()} ج.م (${summary.categoryBreakdown[0].count} عمليات)`
              : "لم تسجل مصاريف"}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="بحث في البيان، المستلم، رقم الإيصال..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl ps-9 pe-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/40 transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "كل البنود" },
              { id: "utilities", label: "فواتير ومرافق" },
              { id: "rent", label: "إيجار" },
              { id: "hospitality", label: "ضيافة وبوفيه" },
              { id: "supplies", label: "مستلزمات ونظافة" },
              { id: "maintenance", label: "صيانة" },
              { id: "transport", label: "نقل وشحن" },
              { id: "salaries_advances", label: "سلف ورواتب" },
              { id: "inventory", label: "بضاعة" },
              { id: "other", label: "أخرى" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Dropdown Filters (Source & Date) */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer"
            >
              <option value="all">كل طرق الصرف</option>
              <option value="cash_drawer">نقدية الدرج</option>
              <option value="instapay">إنستا باي</option>
              <option value="vodafone_cash">فودافون كاش</option>
              <option value="bank">حساب بنكي</option>
              <option value="external">حساب خارجي</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as any);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer"
            >
              <option value="all">كل الفترات</option>
              <option value="today">اليوم فقط</option>
              <option value="shift">الوردية الحالية</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">هذا الشهر</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-sm text-slate-100">سجل المصروفات</h3>
            <span className="text-xs text-slate-500">({totalCount} حركة)</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-rose-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">جاري تحميل سجل المصروفات...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500 mb-1">
              <Receipt className="h-8 w-8" />
            </div>
            <p className="text-sm font-semibold text-slate-300">لا توجد مصروفات مسجلة</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              لم يتم العثور على مصروفات مطابقة للبحث. يمكنك إضافة مصروف جديد بالنقر على زر تسجيل مصروف.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                  <th className="px-4 py-3 text-start font-semibold">التاريخ</th>
                  <th className="px-4 py-3 text-start font-semibold">البيان والملاحظات</th>
                  <th className="px-4 py-3 text-start font-semibold">البند والتصنيف</th>
                  <th className="px-4 py-3 text-start font-semibold">مصدر الصرف</th>
                  <th className="px-4 py-3 text-start font-semibold">المستلم / الإيصال</th>
                  <th className="px-4 py-3 text-start font-semibold">المسؤول</th>
                  <th className="px-4 py-3 text-start font-semibold">المبلغ</th>
                  <th className="px-4 py-3 text-start font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.map((item) => {
                  const cat = categoryConfig[item.category] || categoryConfig.other;
                  const src = sourceConfig[item.paymentSource] || sourceConfig.cash_drawer;
                  const CatIcon = cat.icon;
                  const SrcIcon = src.icon;

                  return (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {new Date(item.createdAt).toLocaleString("ar-EG", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Title & Notes */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-100">{item.title}</span>
                          {item.notes && (
                            <span className="text-[11px] text-slate-400 line-clamp-1">{item.notes}</span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${cat.color}`}>
                          <CatIcon className="w-3 h-3" />
                          {cat.label}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${src.color}`}>
                          <SrcIcon className="w-3 h-3" />
                          {src.label}
                        </span>
                      </td>

                      {/* Recipient & Receipt */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                        <div className="flex flex-col gap-0.5">
                          {item.paidTo ? (
                            <span className="text-slate-200">{item.paidTo}</span>
                          ) : (
                            <span className="text-slate-500">---</span>
                          )}
                          {item.receiptNumber && (
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 w-fit">
                              {item.receiptNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cashier */}
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.performedBy || "الكاشير"}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 font-mono font-black text-rose-400 whitespace-nowrap text-sm">
                        -{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ج.م
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {deletingId === item._id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteExpense(item._id)}
                              disabled={isDeleting}
                              className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-500 cursor-pointer disabled:opacity-50"
                            >
                              {isDeleting ? "..." : "تأكيد الحذف"}
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-1.5 py-1 bg-slate-800 text-slate-300 rounded text-[10px] hover:bg-slate-700 cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(item._id)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="حذف / إلغاء المصروف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>صفحة {page} من {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                السابق
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">تسجيل مصروف جديد</h3>
                  <p className="text-xs text-slate-400">إضافة بند صرف من نقدية المحل أو الحسابات</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  قيمة المصروف (ج.م) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg font-bold font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-400">
                    ج.م
                  </span>
                </div>
                {/* Quick amount pills */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[20, 50, 100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormAmount(String(amt))}
                      className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition-colors cursor-pointer"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  بيان وعنوان المصروف <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: فاتورة الكهرباء، ضيافة عمال، شراء أكياس ومطبوعات..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              {/* Category & Payment Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    بند / تصنيف المصروف <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40 cursor-pointer"
                  >
                    <option value="utilities">فواتير ومرافق (كهرباء، مياه، نت)</option>
                    <option value="rent">إيجار المحل أو المخزن</option>
                    <option value="hospitality">ضيافة وبوفيه ومشروبات</option>
                    <option value="supplies">مستلزمات وأكياس ونظافة</option>
                    <option value="maintenance">صيانة وإصلاحات</option>
                    <option value="transport">نقل ومشاوير وشحن</option>
                    <option value="salaries_advances">سلف ورواتب عمال</option>
                    <option value="inventory">مشتريات بضاعة نقدية</option>
                    <option value="other">مصاريف أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    مصدر الصرف والدفع <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40 cursor-pointer"
                  >
                    <option value="cash_drawer">نقدية الدرج (تخصم من الوردية)</option>
                    <option value="instapay">إنستا باي (تخصم من المحفظة)</option>
                    <option value="vodafone_cash">فودافون كاش</option>
                    <option value="bank">حساب بنكي / فيزا</option>
                    <option value="external">حساب خارجي / المالك</option>
                  </select>
                </div>
              </div>

              {/* Paid To & Receipt Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    الجهة / المستلم (اختياري)
                  </label>
                  <input
                    type="text"
                    value={formPaidTo}
                    onChange={(e) => setFormPaidTo(e.target.value)}
                    placeholder="مثال: شركة الكهرباء، المعلم حسام..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    رقم الإيصال / الفاتورة (اختياري)
                  </label>
                  <input
                    type="text"
                    value={formReceiptNo}
                    onChange={(e) => setFormReceiptNo(e.target.value)}
                    placeholder="رقم مرجعي"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  تفاصيل وملاحظات إضافية (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="أي تفاصيل أخرى تخص عملية الصرف..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
                />
              </div>

              {/* Messages */}
              {formError && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-md shadow-rose-950 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ المصروف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
