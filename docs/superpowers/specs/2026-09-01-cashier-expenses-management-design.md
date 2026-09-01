# Shop Expenses & Petty Cash Management Design Spec

## Overview
This feature introduces a comprehensive **Expenses Management (قسم المصروفات ومصاريف المحل)** module in the Cashier POS. It allows administrators and cashiers to record shop operating expenses (utilities, rent, hospitality, maintenance, staff advances, supplies), track spending metrics in real time, and automatically sync payment sources with the Cash Drawer (Shift `expectedCash`) and the InstaPay Wallet Ledger.

---

## 1. Requirements & User Workflow

1. **Expense Recording**:
   - Title/Description (e.g., "فاتورة الكهرباء لشهر أغسطس", "شراء أكياس تغليف ومطبوعات", "صيانة الإضاءة").
   - Amount in EGP.
   - Category (*فواتير ومرافق, إيجار المحل, ضيافة وبوفيه, مستلزمات ونظافة, صيانة, نقل وشحن, سلف ورواتب, بضاعة نقدية, مصاريف أخرى*).
   - Payment Source (*نقدية الدرج, إنستا باي, فودافون كاش, حساب بنكي, حساب خارجي*).
   - Paid To / Recipient (optional).
   - Receipt / Invoice reference number (optional).
   - Cashier / Performer name.
   - Linked Shift ID.

2. **Automatic Balance & Shift Syncing**:
   - When paid via `cash_drawer`:
     - Increments `shift.totalExpenses`.
     - Deducts from `shift.expectedCash` so that closing shift calculations remain 100% exact.
   - When paid via `instapay`:
     - Automatically calls `InstaPayLedgerEngine.recordTransaction` with `type: "withdrawal"`, `category: "expense"`.

3. **Cashier POS Navigation & Dashboard**:
   - Header tab: `[البيع (POS)] [الطلبات] [المرتجعات] [إنستا باي] [المصروفات] [المنتجات] [التقارير]`.
   - KPI Cards: **مصروفات اليوم (Today's Expenses)**, **مصروفات الوردية الحالية (Current Shift Expenses)**, **مصروفات هذا الشهر (Monthly Total)**, **أعلى بند صرف (Top Category)**.
   - **"+ تسجيل مصروف جديد"** modal dialog with amount presets (+50, +100, +200, +500, +1000).
   - Filter bar with category filter, payment source filter, date range filter (*اليوم, الوردية الحالية, آخر 7 أيام, هذا الشهر, الكل*), and text search.
   - Full history table with ability to delete/void mistaken entries (with atomic reverse adjustment).

---

## 2. Architecture & Data Models

### 2.1 Model: `src/models/Expense.ts`
```ts
export interface IExpense extends Document {
  title: string;
  amount: number;
  category: "utilities" | "rent" | "hospitality" | "supplies" | "maintenance" | "transport" | "salaries_advances" | "inventory" | "other";
  paymentSource: "cash_drawer" | "instapay" | "vodafone_cash" | "bank" | "external";
  paidTo?: string;
  receiptNumber?: string;
  notes?: string;
  performedBy: string;
  shiftId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Shift Model Update: `src/models/Shift.ts`
- Add `totalExpenses: { type: Number, default: 0 }` to `IShift` and `ShiftSchema`.

### 2.3 Engine: `src/modules/cashair/ExpensesEngine.ts`
- `recordExpense(data)`: Validates, creates expense, updates Shift `expectedCash` and `totalExpenses` if `cash_drawer`, and logs to `InstaPayLedgerEngine` if `instapay`.
- `deleteExpense(id)`: Reverses Shift and InstaPay adjustments if needed, then deletes.
- `getExpensesSummary(filters)`: Computes `todayExpenses`, `shiftExpenses`, `monthExpenses`, `totalExpenses`, category breakdown, and paginated records.

### 2.4 API Routes: `/api/cashair/expenses` & `/api/cashair/expenses/[id]`
- `GET`: Summary stats and filterable records.
- `POST`: Create new expense.
- `DELETE /api/cashair/expenses/[id]`: Void/delete expense.

### 2.5 UI Component: `src/components/cashair/POSExpensesTab.tsx`
- Complete responsive dashboard tab in dark POS aesthetic.
