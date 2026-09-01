# InstaPay Wallet & Transaction Ledger Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an ongoing InstaPay wallet & transaction tracking ledger in Cashier POS allowing the admin/cashier to track current balances, log manual deposits/withdrawals with notes and categories, and automatically sync sales & refunds.

**Architecture:** Mongoose model for `InstaPayTransaction`, an atomic ledger engine for computing running balances, a Next.js API route `/api/cashair/instapay`, checkout/return hook integration, and a dedicated `POSInstaPayTab.tsx` dashboard with filters, KPI cards, and modals.

**Tech Stack:** Next.js 15, TypeScript, MongoDB / Mongoose, Tailwind CSS, Lucide React.

## Global Constraints
- All transactions must maintain an accurate non-negative running balance calculation.
- POS sales and returns paid via InstaPay must automatically create corresponding ledger records.
- Manual transactions must capture reason/description, category, cashier name, and optional reference number.
- Fully bilingual (Arabic & English) UI with rich aesthetic matching the POS purple InstaPay branding.

---

### Task 1: InstaPay Transaction Model

**Files:**
- Create: `src/models/InstaPayTransaction.ts`

**Interfaces:**
- Produces: `IInstaPayTransaction`, `InstaPayTransaction` Mongoose model.

- [ ] **Step 1: Create `src/models/InstaPayTransaction.ts`**

```ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInstaPayTransaction extends Document {
  type: "sale" | "deposit" | "withdrawal" | "refund" | "adjustment";
  amount: number;
  runningBalance: number;
  description: string;
  category: "sales" | "supplier_payment" | "expense" | "bank_transfer" | "owner_withdrawal" | "deposit" | "refund" | "other";
  referenceNumber?: string;
  performedBy: string;
  shiftId?: string;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstaPayTransactionSchema = new Schema<IInstaPayTransaction>(
  {
    type: {
      type: String,
      enum: ["sale", "deposit", "withdrawal", "refund", "adjustment"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    runningBalance: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["sales", "supplier_payment", "expense", "bank_transfer", "owner_withdrawal", "deposit", "refund", "other"],
      default: "other",
    },
    referenceNumber: { type: String, trim: true },
    performedBy: { type: String, required: true, trim: true },
    shiftId: { type: String },
    orderId: { type: String },
  },
  { timestamps: true }
);

InstaPayTransactionSchema.index({ createdAt: -1 });
InstaPayTransactionSchema.index({ type: 1 });
InstaPayTransactionSchema.index({ category: 1 });

const InstaPayTransaction: Model<IInstaPayTransaction> =
  mongoose.models.InstaPayTransaction ||
  mongoose.model<IInstaPayTransaction>("InstaPayTransaction", InstaPayTransactionSchema);

export default InstaPayTransaction;
```

- [ ] **Step 2: Verify compilation**
Run: `npx tsc --noEmit`
Expected: PASS.

---

### Task 2: InstaPay Ledger Engine

**Files:**
- Create: `src/modules/cashair/InstaPayLedgerEngine.ts`

**Interfaces:**
- Consumes: `InstaPayTransaction` model
- Produces: `InstaPayLedgerEngine` with `getCurrentBalance`, `recordTransaction`, and `getLedgerSummary`.

- [ ] **Step 1: Implement `src/modules/cashair/InstaPayLedgerEngine.ts`**

```ts
import dbConnect from "@/lib/mongodb";
import InstaPayTransaction, { IInstaPayTransaction } from "@/models/InstaPayTransaction";

export interface RecordTransactionParams {
  type: "sale" | "deposit" | "withdrawal" | "refund" | "adjustment";
  amount: number;
  description: string;
  category?: "sales" | "supplier_payment" | "expense" | "bank_transfer" | "owner_withdrawal" | "deposit" | "refund" | "other";
  referenceNumber?: string;
  performedBy: string;
  shiftId?: string;
  orderId?: string;
}

export class InstaPayLedgerEngine {
  static async getCurrentBalance(): Promise<number> {
    await dbConnect();
    const latest = await InstaPayTransaction.findOne().sort({ createdAt: -1, _id: -1 }).lean();
    return latest?.runningBalance || 0;
  }

  static async recordTransaction(params: RecordTransactionParams): Promise<IInstaPayTransaction> {
    await dbConnect();
    const currentBalance = await this.getCurrentBalance();
    const isCredit = params.type === "sale" || params.type === "deposit" || (params.type === "adjustment" && params.amount >= 0);
    const amount = Math.abs(params.amount);
    
    let newBalance = isCredit ? currentBalance + amount : currentBalance - amount;
    newBalance = Math.round(newBalance * 100) / 100;

    const defaultCategory = params.category || (
      params.type === "sale" ? "sales" :
      params.type === "refund" ? "refund" :
      params.type === "deposit" ? "deposit" :
      params.type === "withdrawal" ? "expense" : "other"
    );

    const doc = await InstaPayTransaction.create({
      type: params.type,
      amount,
      runningBalance: newBalance,
      description: params.description.trim(),
      category: defaultCategory,
      referenceNumber: params.referenceNumber?.trim() || undefined,
      performedBy: params.performedBy.trim(),
      shiftId: params.shiftId,
      orderId: params.orderId,
    });

    return doc;
  }

  static async getLedgerSummary(filters: {
    search?: string;
    type?: string;
    category?: string;
    dateRange?: "today" | "week" | "month" | "all";
    page?: number;
    limit?: number;
  }) {
    await dbConnect();
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 30));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (filters.type && filters.type !== "all") {
      query.type = filters.type;
    }
    if (filters.category && filters.category !== "all") {
      query.category = filters.category;
    }

    if (filters.search && filters.search.trim()) {
      const s = filters.search.trim();
      query.$or = [
        { description: { $regex: s, $options: "i" } },
        { referenceNumber: { $regex: s, $options: "i" } },
        { performedBy: { $regex: s, $options: "i" } },
      ];
    }

    if (filters.dateRange && filters.dateRange !== "all") {
      const now = new Date();
      if (filters.dateRange === "today") {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.createdAt = { $gte: startOfDay };
      } else if (filters.dateRange === "week") {
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: startOfWeek };
      } else if (filters.dateRange === "month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query.createdAt = { $gte: startOfMonth };
      }
    }

    const [transactions, totalCount, currentBalance, aggregates] = await Promise.all([
      InstaPayTransaction.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      InstaPayTransaction.countDocuments(query),
      this.getCurrentBalance(),
      InstaPayTransaction.aggregate([
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    let totalIn = 0;
    let totalOut = 0;
    aggregates.forEach((item) => {
      if (item._id === "sale" || item._id === "deposit") {
        totalIn += item.totalAmount;
      } else if (item._id === "withdrawal" || item._id === "refund") {
        totalOut += item.totalAmount;
      }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayAggregates = await InstaPayTransaction.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    let todayIn = 0;
    let todayOut = 0;
    todayAggregates.forEach((item) => {
      if (item._id === "sale" || item._id === "deposit") {
        todayIn += item.totalAmount;
      } else if (item._id === "withdrawal" || item._id === "refund") {
        todayOut += item.totalAmount;
      }
    });

    return {
      currentBalance,
      totalIn,
      totalOut,
      todayIn,
      todayOut,
      todayNet: todayIn - todayOut,
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}
```

- [ ] **Step 2: Verify compilation**
Run: `npx tsc --noEmit`
Expected: PASS.

---

### Task 3: API Route for InstaPay Ledger

**Files:**
- Create: `src/app/api/cashair/instapay/route.ts`

**Interfaces:**
- Consumes: `InstaPayLedgerEngine`
- Produces: `GET /api/cashair/instapay` and `POST /api/cashair/instapay` endpoints.

- [ ] **Step 1: Implement `src/app/api/cashair/instapay/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { InstaPayLedgerEngine } from "@/modules/cashair/InstaPayLedgerEngine";
import { logError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const category = searchParams.get("category") || undefined;
    const dateRange = (searchParams.get("dateRange") as any) || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const data = await InstaPayLedgerEngine.getLedgerSummary({
      search,
      type,
      category,
      dateRange,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    const details = logError("GET /api/cashair/instapay", error);
    return NextResponse.json(
      { success: false, error: "فشل استرجاع بيانات إنستا باي", details },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, amount, description, category, referenceNumber, performedBy, shiftId } = body;

    if (!type || !["deposit", "withdrawal", "adjustment"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "نوع العملية غير صحيح (إيداع أو سحب أو تسوية)" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "المبلغ يجب أن يكون قيمة رقمية موجبة" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة سبب أو بيان العملية" },
        { status: 400 }
      );
    }

    const transaction = await InstaPayLedgerEngine.recordTransaction({
      type,
      amount,
      description: description.trim(),
      category,
      referenceNumber: referenceNumber?.trim() || undefined,
      performedBy: (performedBy || "الكاشير").trim(),
      shiftId: shiftId || undefined,
    });

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error) {
    const details = logError("POST /api/cashair/instapay", error);
    return NextResponse.json(
      { success: false, error: "فشل تسجيل حركة إنستا باي", details },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify compilation**
Run: `npx tsc --noEmit`
Expected: PASS.

---

### Task 4: Integrate POS Checkout & Returns with InstaPay Ledger

**Files:**
- Modify: `src/modules/cashair/POSCheckoutEngine.ts`
- Modify: `src/app/api/cashair/returns/route.ts`

**Interfaces:**
- Automatically calls `InstaPayLedgerEngine.recordTransaction` on InstaPay sales and refunds.

- [ ] **Step 1: Update `src/modules/cashair/POSCheckoutEngine.ts`**

When `paymentMethod === "instapay"`:
```ts
if (req.paymentMethod === "instapay") {
  shift.totalInstaPaySales += finalTotal;
  try {
    await InstaPayLedgerEngine.recordTransaction({
      type: "sale",
      amount: finalTotal,
      description: `فاتورة مبيعات #${order._id.toString().slice(-6).toUpperCase()}`,
      category: "sales",
      performedBy: shift.cashierName || "الكاشير",
      shiftId: String(shift._id),
      orderId: String(order._id),
      referenceNumber: `#${order._id.toString().slice(-6).toUpperCase()}`,
    });
  } catch (err) {
    console.error("Failed to record InstaPay ledger sale:", err);
  }
}
```

- [ ] **Step 2: Update Returns Handler**

When refund paymentMethod is `"instapay"`, call `InstaPayLedgerEngine.recordTransaction({ type: "refund", amount: refundAmount, ... })`.

- [ ] **Step 3: Verify compilation**
Run: `npx tsc --noEmit`
Expected: PASS.

---

### Task 5: Cashier POS InstaPay Tab Component

**Files:**
- Create: `src/components/cashair/POSInstaPayTab.tsx`

**Interfaces:**
- Interactive React dashboard component with KPI cards (Current Balance, Total In, Total Out, Today Net), Add/Withdraw action modals, filterable live transaction table.

- [ ] **Step 1: Build `src/components/cashair/POSInstaPayTab.tsx`**

Include:
- Gradient banner with InstaPay branding & live balance.
- 4 Key Metric cards (Current Balance, Total In, Total Out, Today's Net).
- Action buttons: "+ تسجيل إيداع وارد (Deposit)" and "− تسجيل سحب / مصروف (Withdrawal)".
- Search bar and category/date filters.
- Responsive table with icons, colors, reference badges, running balance, and pagination.
- Modal dialog for Add / Withdraw with category dropdown (دفع لمورد, مصاريف تشغيل, تحويل بنكي, سحب للمالك, إيداع وارد, رأس مال, أخرى), amount, notes, reference no., cashier name.

- [ ] **Step 2: Verify compilation**
Run: `npx tsc --noEmit`
Expected: PASS.

---

### Task 6: Cashier Main Page Integration

**Files:**
- Modify: `src/app/cashier/page.tsx`

**Interfaces:**
- Add `"instapay"` to `activeTab` type and navigation bar (`[POS] [Orders] [Returns] [InstaPay] [Products] [Reports]`).
- Render `<POSInstaPayTab activeShift={activeShift} />` when `activeTab === "instapay"`.

- [ ] **Step 1: Update navigation header and tab state in `src/app/cashier/page.tsx`**
- [ ] **Step 2: Verify compilation**
Run: `npx tsc --noEmit`
Expected: PASS.

---

### Task 7: Build Verification & Final Validation

- [ ] **Step 1: Run production build check**
Run: `npm run build`
Expected: 100% successful build with all routes compiled.

- [ ] **Step 2: Commit all changes**
```bash
git add .
git commit -m "feat(cashier): add InstaPay wallet ledger and transaction tracking system"
```
