# Shop Expenses & Petty Cash Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive Shop Expenses Management tab in Cashier POS with automatic sync to active shift expected cash (cash drawer) and InstaPay wallet ledger.

**Architecture:** `Expense` model, `Shift` model extension, `ExpensesEngine`, Next.js API routes `/api/cashair/expenses` and `/api/cashair/expenses/[id]`, and `POSExpensesTab.tsx` dashboard.

**Tech Stack:** Next.js 15, TypeScript, MongoDB / Mongoose, Tailwind CSS, Lucide React.

---

### Task 1: Expense Model & Shift Model Update

**Files:**
- Create: `src/models/Expense.ts`
- Modify: `src/models/Shift.ts`

- [ ] **Step 1: Create `src/models/Expense.ts`**
- [ ] **Step 2: Update `src/models/Shift.ts` with `totalExpenses`**
- [ ] **Step 3: Verify compilation (`npx tsc --noEmit`)**

---

### Task 2: Expenses Engine

**Files:**
- Create: `src/modules/cashair/ExpensesEngine.ts`

- [ ] **Step 1: Implement `recordExpense`, `deleteExpense`, and `getExpensesSummary`**
- [ ] **Step 2: Verify compilation (`npx tsc --noEmit`)**

---

### Task 3: Expenses API Routes

**Files:**
- Create: `src/app/api/cashair/expenses/route.ts`
- Create: `src/app/api/cashair/expenses/[id]/route.ts`

- [ ] **Step 1: Implement `GET` and `POST` in `/api/cashair/expenses/route.ts`**
- [ ] **Step 2: Implement `DELETE` in `/api/cashair/expenses/[id]/route.ts`**
- [ ] **Step 3: Verify compilation (`npx tsc --noEmit`)**

---

### Task 4: Cashier POS Expenses Tab Component

**Files:**
- Create: `src/components/cashair/POSExpensesTab.tsx`

- [ ] **Step 1: Build `POSExpensesTab.tsx` with KPI cards, Add Modal, Category Filters, and Audit Table**
- [ ] **Step 2: Verify compilation (`npx tsc --noEmit`)**

---

### Task 5: Cashier Main Page Integration

**Files:**
- Modify: `src/app/cashier/page.tsx`

- [ ] **Step 1: Add `"expenses"` to `activeTab` and navigation header**
- [ ] **Step 2: Render `<POSExpensesTab activeShift={activeShift} onShiftUpdated={fetchActiveShift} />`**
- [ ] **Step 3: Verify compilation (`npx tsc --noEmit`)**

---

### Task 6: Build Verification & Final Validation

- [ ] **Step 1: Run production build check (`npm run build`)**
- [ ] **Step 2: Commit all changes locally**
