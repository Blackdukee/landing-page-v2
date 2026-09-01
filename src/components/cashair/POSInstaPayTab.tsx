"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  QrCode,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
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
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  CreditCard,
} from "lucide-react";

interface InstaPayTx {
  _id: string;
  type: "sale" | "deposit" | "withdrawal" | "refund" | "adjustment";
  amount: number;
  runningBalance: number;
  description: string;
  category: string;
  referenceNumber?: string;
  performedBy: string;
  createdAt: string;
}

interface LedgerSummary {
  currentBalance: number;
  totalIn: number;
  totalOut: number;
  todayIn: number;
  todayOut: number;
  todayNet: number;
}

interface POSInstaPayTabProps {
  activeShift?: any;
}

export default function POSInstaPayTab({ activeShift }: POSInstaPayTabProps) {
  // Data State
  const [summary, setSummary] = useState<LedgerSummary>({
    currentBalance: 0,
    totalIn: 0,
    totalOut: 0,
    todayIn: 0,
    todayOut: 0,
    todayNet: 0,
  });
  const [transactions, setTransactions] = useState<InstaPayTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"deposit" | "withdrawal">("deposit");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("deposit");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formRefNumber, setFormRefNumber] = useState<string>("");
  const [formPerformer, setFormPerformer] = useState<string>(
    activeShift?.cashierName || "الكاشير"
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Copy indicator state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Ledger data
  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedType !== "all") params.set("type", selectedType);
      if (dateRange !== "all") params.set("dateRange", dateRange);
      params.set("page", String(page));
      params.set("limit", "25");

      const res = await fetch(`/api/cashair/instapay?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSummary({
          currentBalance: data.currentBalance || 0,
          totalIn: data.totalIn || 0,
          totalOut: data.totalOut || 0,
          todayIn: data.todayIn || 0,
          todayOut: data.todayOut || 0,
          todayNet: data.todayNet || 0,
        });
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to load InstaPay ledger:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, dateRange, page]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // Open modal helper
  const openActionModal = (type: "deposit" | "withdrawal") => {
    setModalType(type);
    setFormAmount("");
    setFormCategory(type === "deposit" ? "deposit" : "expense");
    setFormDescription("");
    setFormRefNumber("");
    setFormPerformer(activeShift?.cashierName || "الكاشير");
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Submit manual transaction
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("يرجى إدخال مبلغ صحيح أكبر من صفر");
      return;
    }

    if (!formDescription.trim()) {
      setFormError("يرجى كتابة بيان أو سبب العملية");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cashair/instapay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: modalType,
          amount: numAmount,
          category: formCategory,
          description: formDescription.trim(),
          referenceNumber: formRefNumber.trim() || undefined,
          performedBy: formPerformer.trim() || "الكاشير",
          shiftId: activeShift?._id ? String(activeShift._id) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || "فشل تسجيل العملية");
      } else {
        setFormSuccess("تم تسجيل الحركة بنجاح وتحديث الرصيد");
        setTimeout(() => {
          setIsModalOpen(false);
          fetchLedger();
        }, 700);
      }
    } catch (err) {
      setFormError("خطأ في الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  // Copy reference text helper
  const handleCopyRef = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Category labels and badges
  const categoryMap: Record<string, { label: string; color: string }> = {
    sales: { label: "مبيعات", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    deposit: { label: "إيداع وارد", color: "bg-purple-500/10 text-purple-300 border-purple-500/30" },
    seed_capital: { label: "رأس مال", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    supplier_payment: { label: "دفعة لمورد", color: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
    expense: { label: "مصروفات تشغيل", color: "bg-rose-500/10 text-rose-300 border-rose-500/30" },
    bank_transfer: { label: "تحويل للبنك", color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30" },
    owner_withdrawal: { label: "سحب للمالك", color: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" },
    refund: { label: "مرتجع", color: "bg-rose-500/15 text-rose-400 border-rose-500/40" },
    other: { label: "أخرى", color: "bg-slate-700/30 text-slate-300 border-slate-700" },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 border border-purple-900/40 p-6 shadow-xl">
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 shadow-inner shadow-purple-500/20">
              <QrCode className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-100">
                  محفظة إنستا باي (InstaPay Ledger)
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  مباشر
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                تتبع رصيد وحركات إنستا باي اللحظية، مبيعات الكاشير، الإيداعات والسحوبات
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => openActionModal("deposit")}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4" />
              تسجيل إيداع وارد
            </button>
            <button
              onClick={() => openActionModal("withdrawal")}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white px-4 py-2.5 text-xs font-bold shadow-lg shadow-rose-950/50 transition-all cursor-pointer active:scale-95"
            >
              <Minus className="h-4 w-4" />
              تسجيل سحب / مصاريف
            </button>
            <button
              onClick={fetchLedger}
              disabled={loading}
              type="button"
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
              title="تحديث البيانات"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Balance */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-900 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-300">الرصيد الحالي بالمحفظة</span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-100 font-mono tracking-tight">
              {summary.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-semibold text-purple-400">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            رصيد لحظي محدث تلقائياً
          </p>
        </div>

        {/* Card 2: Total Inbound */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">إجمالي الوارد (مبيعات + إيداعات)</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-400 font-mono">
              +{summary.totalIn.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-emerald-400/80">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            وارد اليوم: +{summary.todayIn.toLocaleString("en-US", { minimumFractionDigits: 2 })} ج.م
          </p>
        </div>

        {/* Card 3: Total Outbound */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">إجمالي الصادر (سحوبات + مرتجعات)</span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-rose-400 font-mono">
              -{summary.totalOut.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-rose-400/80">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            صادر اليوم: -{summary.todayOut.toLocaleString("en-US", { minimumFractionDigits: 2 })} ج.م
          </p>
        </div>

        {/* Card 4: Today Net */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">صافي حركات اليوم</span>
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
              summary.todayNet >= 0 ? "bg-cyan-500/15 text-cyan-400" : "bg-amber-500/15 text-amber-400"
            }`}>
              {summary.todayNet >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-bold font-mono ${summary.todayNet >= 0 ? "text-cyan-400" : "text-amber-400"}`}>
              {summary.todayNet >= 0 ? "+" : ""}
              {summary.todayNet.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-slate-400">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            مجموع عمليات اليوم
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
              placeholder="بحث في البيان، رقم الإيصال، الكاشير..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl ps-9 pe-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 transition-all"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "الكل" },
              { id: "sale", label: "مبيعات" },
              { id: "deposit", label: "إيداعات" },
              { id: "withdrawal", label: "سحوبات ومصاريف" },
              { id: "refund", label: "مرتجعات" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedType(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? "bg-purple-600 text-white shadow-md shadow-purple-950"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
            <Calendar className="h-4 w-4 text-slate-500" />
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as any);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer"
            >
              <option value="all">كل الفترات</option>
              <option value="today">اليوم فقط</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">هذا الشهر</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-slate-100">سجل حركات المحفظة</h3>
            <span className="text-xs text-slate-500">({totalCount} حركة)</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">جاري تحميل سجل الحركات...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500 mb-1">
              <QrCode className="h-8 w-8" />
            </div>
            <p className="text-sm font-semibold text-slate-300">لا توجد حركات مسجلة</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              لم يتم العثور على حركات إنستا باي مطابقة لخيارات البحث. يمكنك تسجيل إيداع وارد أو سحب جديد.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                  <th className="px-4 py-3 text-start font-semibold">التاريخ والوقت</th>
                  <th className="px-4 py-3 text-start font-semibold">النوع / التصنيف</th>
                  <th className="px-4 py-3 text-start font-semibold">بيان الحركة / المرجع</th>
                  <th className="px-4 py-3 text-start font-semibold">بواسطة</th>
                  <th className="px-4 py-3 text-start font-semibold">قيمة الحركة</th>
                  <th className="px-4 py-3 text-start font-semibold">الرصيد بعدها</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => {
                  const isCredit = tx.type === "sale" || tx.type === "deposit" || (tx.type === "adjustment" && tx.amount >= 0);
                  const cat = categoryMap[tx.category] || categoryMap.other;

                  return (
                    <tr key={tx._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {new Date(tx.createdAt).toLocaleString("ar-EG", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Type & Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${cat.color}`}>
                          {cat.label}
                        </span>
                      </td>

                      {/* Description & Reference */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-200">{tx.description}</span>
                          {tx.referenceNumber && (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                                {tx.referenceNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyRef(tx._id, tx.referenceNumber!)}
                                className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                                title="نسخ المرجع"
                              >
                                {copiedId === tx._id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Performed By */}
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{tx.performedBy || "الكاشير"}</span>
                        </div>
                      </td>

                      {/* Amount In / Out */}
                      <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                        <span className={isCredit ? "text-emerald-400" : "text-rose-400"}>
                          {isCredit ? "+" : "-"}
                          {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ج.م
                        </span>
                      </td>

                      {/* Running Balance */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-100 whitespace-nowrap">
                        {tx.runningBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} ج.م
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

      {/* Add Deposit / Withdrawal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${
                  modalType === "deposit"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/20 text-rose-400"
                }`}>
                  {modalType === "deposit" ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {modalType === "deposit" ? "تسجيل إيداع وارد (إنستا باي)" : "تسجيل سحب / مصاريف (إنستا باي)"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalType === "deposit" ? "إضافة رصيد وارد إلى المحفظة" : "خصم مبالغ مسحوبة أو مدفوعات من المحفظة"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Type Switcher Chips */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setModalType("deposit");
                    setFormCategory("deposit");
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modalType === "deposit"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  + إيداع وارد (Deposit)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalType("withdrawal");
                    setFormCategory("expense");
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modalType === "withdrawal"
                      ? "bg-rose-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  − سحب / مصروف (Withdrawal)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  المبلغ (ج.م) <span className="text-rose-400">*</span>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg font-bold font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400">
                    ج.م
                  </span>
                </div>
                {/* Quick amount pills */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[100, 250, 500, 1000, 2000].map((amt) => (
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

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  التصنيف <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 cursor-pointer"
                >
                  {modalType === "deposit" ? (
                    <>
                      <option value="deposit">إيداع / تحويل وارد عادي</option>
                      <option value="seed_capital">رأس مال تشغيلي للمحفظة</option>
                      <option value="other">أخرى (تسوية / تصحيح)</option>
                    </>
                  ) : (
                    <>
                      <option value="expense">مصروفات تشغيلية</option>
                      <option value="supplier_payment">دفعة لمورد / بضاعة</option>
                      <option value="bank_transfer">تحويل للحساب البنكي</option>
                      <option value="owner_withdrawal">سحب أرباح للمالك</option>
                      <option value="other">أخرى</option>
                    </>
                  )}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  بيان وسبب العملية <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={
                    modalType === "deposit"
                      ? "مثال: تحويل وارد من الإدارة لدعم الرصيد"
                      : "مثال: سداد فاتورة مورد شركة الأمل للعدد"
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>

              {/* Reference Number & Performer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    رقم الإيصال / الحوالة
                  </label>
                  <input
                    type="text"
                    value={formRefNumber}
                    onChange={(e) => setFormRefNumber(e.target.value)}
                    placeholder="رقم مرجعي اختياري"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    اسم المسؤول / الكاشير
                  </label>
                  <input
                    type="text"
                    value={formPerformer}
                    onChange={(e) => setFormPerformer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
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
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 ${
                    modalType === "deposit"
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950"
                      : "bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950"
                  }`}
                >
                  {submitting
                    ? "جاري الحفظ..."
                    : modalType === "deposit"
                    ? "تأكيد الإيداع"
                    : "تأكيد السحب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
