# InstaPay Wallet & Transaction Ledger Tracking Design Spec

## Overview
This feature introduces a dedicated **InstaPay Ledger & Balance Tracking System** in the Cashier POS interface. It maintains a continuous running account balance for InstaPay, automatically synchronizes with POS sales and refunds, and enables administrators/cashiers to manually add (deposit) or withdraw (expenses, supplier payments, owner cash out) funds with complete audit trails.

---

## 1. Requirements & User Workflow

1. **Continuous Wallet Balance**:
   - Real-time `currentBalance` in EGP representing the InstaPay account balance.
   - Automatically credited (+ amount) on POS sales completed via InstaPay.
   - Automatically debited (- amount) on POS returns refunded via InstaPay.
   - Manually credited on deposits (e.g., initial seed capital, bank-to-instapay transfers).
   - Manually debited on withdrawals (e.g., supplier payments, operating expenses, cash withdrawals, transfers to bank).

2. **Cashier POS Navigation & Dashboard**:
   - Add a dedicated **"إنستا باي (InstaPay)"** tab in the Cashier navigation header:
     `[الرئيسية (POS)] [الطلبات] [المرتجعات] [إنستا باي (InstaPay)] [المنتجات] [التقارير]`.
   - **KPI Metrics Cards**:
     - **الرصيد الحالي (Current Balance)** in bold purple gradient.
     - **إجمالي الوارد (Total In)** (Sales + Deposits).
     - **إجمالي الصادر (Total Out)** (Withdrawals + Refunds + Expenses).
     - **صافي اليوم (Today's Net Change)**.
   - **Quick Action Modals**:
     - **"+ تسجيل إيداع وارد (Deposit)"**: Add funds with amount, category (إيداع/تحويل وارد, رأس مال, تصحيح, أخرى), description, reference number, and cashier name.
     - **"− تسجيل سحب / مصاريف (Withdrawal)"**: Deduct funds with amount, category (دفع لمورد, مصاريف تشغيل, تحويل بنكي, سحب للمالك, أخرى), description, reference number, and cashier name.
   - **Audit Log & History Table**:
     - Columns: Date/Time, Type & Category, Description & Reference No., In/Out Amount, Running Balance, Cashier Name.
     - Search by description, cashier, or reference number.
     - Filter by type (All, Sales, Deposits, Withdrawals, Refunds).
     - Filter by date range (Today, Last 7 Days, This Month, All).

---

## 2. Architecture & Data Model

### 2.1 Model: `src/models/InstaPayTransaction.ts`
```ts
export interface IInstaPayTransaction extends Document {
  type: "sale" | "deposit" | "withdrawal" | "refund" | "adjustment";
  amount: number;
  runningBalance: number;
  description: string;
  category?: "sales" | "supplier_payment" | "expense" | "bank_transfer" | "owner_withdrawal" | "deposit" | "refund" | "other";
  referenceNumber?: string;
  performedBy: string;
  shiftId?: string;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Engine: `src/modules/cashair/InstaPayLedgerEngine.ts`
- `getCurrentBalance(): Promise<number>`
- `recordTransaction(data: { type, amount, description, category, referenceNumber, performedBy, shiftId?, orderId? }): Promise<IInstaPayTransaction>`
- `getLedgerSummary(filters: { search?, type?, dateRange?, page?, limit? }): Promise<{ summary: LedgerSummary, transactions: IInstaPayTransaction[], total: number }>`

### 2.3 API Route: `src/app/api/cashair/instapay/route.ts`
- `GET`: Returns summary statistics and filtered transaction history.
- `POST`: Validates and records manual deposits and withdrawals.

### 2.4 POS Checkout & Returns Integration
- In `POSCheckoutEngine.ts`: Call `InstaPayLedgerEngine.recordTransaction` when `paymentMethod === "instapay"`.
- In `src/app/api/cashair/returns/route.ts` & returns processing: Call `InstaPayLedgerEngine.recordTransaction` on InstaPay refunds.

### 2.5 Cashier UI: `src/components/cashair/POSInstaPayTab.tsx`
- Comprehensive and responsive component with purple InstaPay theme, interactive KPI cards, live transaction list, search/filters, and clean Add/Withdraw dialog modals.

---

## 3. Verification Plan

1. **Model & Engine Integrity**:
   - Create transactions and verify running balances are strictly computed in order.
2. **POS Sale Sync**:
   - Complete a POS sale using InstaPay payment method and verify automatic credit transaction.
3. **Manual Deposit & Withdrawal**:
   - Add a manual deposit and verify balance increases with proper category and notes.
   - Record a manual withdrawal (e.g. supplier payment) and verify balance decreases.
4. **Returns Sync**:
   - Process an InstaPay return and verify debit record.
5. **Search & Filter**:
   - Test filtering by transaction type and search query.
6. **Build & Typecheck**:
   - Run `npx tsc --noEmit` and `npm run build`.
