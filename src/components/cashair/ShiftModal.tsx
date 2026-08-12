"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  X,
  Lock,
  Unlock,
  Coins,
} from "lucide-react";

interface ShiftModalProps {
  isOpen: boolean;
  mode: "start" | "end";
  onClose: () => void;
  activeShift: any | null;
  onShiftUpdated: () => void;
}

export default function ShiftModal({
  isOpen,
  mode,
  onClose,
  activeShift,
  onShiftUpdated,
}: ShiftModalProps) {
  // Start Shift Fields
  const [cashierName, setCashierName] = useState(
    activeShift?.cashierName || "كاشير 1"
  );
  const [openingFloat, setOpeningFloat] = useState<string>("500");

  // End Shift Fields
  const [actualCash, setActualCash] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeShift && isOpen) {
      setCashierName(activeShift.cashierName || "كاشير 1");
      setActualCash(activeShift.expectedCash !== undefined ? activeShift.expectedCash.toString() : "");
    }
  }, [activeShift, isOpen]);

  if (!isOpen) return null;

  // Expected Cash calculation for End Shift
  const expectedCash = activeShift?.expectedCash ?? 0;
  const parsedActualCash = parseFloat(actualCash);
  const variance = isNaN(parsedActualCash) ? 0 : parsedActualCash - expectedCash;

  // Submit Start Shift
  const handleStartShift = async () => {
    if (!cashierName.trim()) {
      setError("يرجى إدخال اسم الكاشير.");
      return;
    }
    const floatVal = parseFloat(openingFloat);
    if (isNaN(floatVal) || floatVal < 0) {
      setError("يرجى إدخال رصيد عهدة الدرج بشكل صحيح (أكبر من أو يساوي 0).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/cashair/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashierName: cashierName.trim(),
          openingFloat: floatVal,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onShiftUpdated();
        onClose();
      } else {
        setError(data.error || "فشل فتح وردية جديدة.");
      }
    } catch {
      setError("خطأ في الاتصال بالخادم عند فتح الوردية.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit End Shift
  const handleEndShift = async () => {
    if (!activeShift?._id) {
      setError("لا يوجد معرف وردية نشطة حالياً.");
      return;
    }
    const actualVal = parseFloat(actualCash);
    if (isNaN(actualVal) || actualVal < 0) {
      setError("يرجى إدخال النقدية الفعلية المحسوبة في الدرج بصورة صحيحة.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/cashair/shift", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: activeShift._id,
          actualCash: actualVal,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onShiftUpdated();
        onClose();
      } else {
        setError(data.error || "فشل إغلاق الوردية.");
      }
    } catch {
      setError("خطأ في الاتصال بالخادم عند إغلاق الوردية.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {mode === "start" ? (
              <Unlock className="w-5 h-5 text-emerald-400" />
            ) : (
              <Lock className="w-5 h-5 text-amber-500" />
            )}
            <h2 className="text-base font-bold text-slate-100">
              {mode === "start" ? "فتح وردية كاشير جديدة (Start Shift)" : "إغلاق الوردية (End Shift)"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === "start" ? (
          /* Start Shift Inputs */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-400" /> اسم الكاشير المسؤول:
              </label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="أدخل اسم الكاشير"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-400" /> عهدة بداية الوردية / رصيد افتتاح الدرج (EGP):
              </label>
              <input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                placeholder="500"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-extrabold focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                العهدة النقدية المسلّمة للكاشير في بداية الوردية لتيسير المعاملات (الفكة).
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={handleStartShift}
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> فتح الوردية وتفعيل البيع
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* End Shift Inputs & Variance Calculation */
          <div className="space-y-4">
            {/* Shift Metrics Breakdown */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>اسم الكاشير:</span>
                <span className="font-bold text-amber-400">{activeShift?.cashierName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>عهدة افتتاح الدرج:</span>
                <span>{(activeShift?.openingFloat || 0).toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>مبيعات الكاش النقدية:</span>
                <span className="text-emerald-400 font-bold">
                  +{(activeShift?.totalCashSales || 0).toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>مرتجعات الكاش النقدية:</span>
                <span className="text-rose-400 font-bold">
                  -{(activeShift?.totalCashRefunds || 0).toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex justify-between text-slate-200 pt-2 border-t border-slate-700 font-bold">
                <span>النقدية المتوقعة بالدرج (Expected):</span>
                <span className="text-amber-400 text-sm">
                  {expectedCash.toLocaleString()} ج.م
                </span>
              </div>
            </div>

            {/* Actual Count Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" /> المبلغ النقدي الفعلي بالدرج (بعد الجرد):
              </label>
              <input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="أدخل المبلغ بعد الجرد"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Automatic Variance Display */}
            {actualCash !== "" && !isNaN(parsedActualCash) && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  variance === 0
                    ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-300"
                    : variance > 0
                    ? "bg-cyan-950/60 border-cyan-800/80 text-cyan-300"
                    : "bg-rose-950/60 border-rose-800/80 text-rose-300"
                }`}
              >
                <span>فرق الجرد (Variance):</span>
                <span>
                  {variance > 0 ? `+${variance.toLocaleString()}` : variance.toLocaleString()} ج.م
                  {variance === 0
                    ? " (مطابق تماماً)"
                    : variance > 0
                    ? " (فائض بالدرج)"
                    : " (عجز بالدرج)"}
                </span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                ملاحظات إغلاق الوردية:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات حول الجرد أو التسلّم..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={handleEndShift}
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> اعتماد وإغلاق الوردية
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
