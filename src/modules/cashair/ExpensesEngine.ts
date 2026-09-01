import dbConnect from "@/lib/mongodb";
import Expense, { IExpense, ExpenseCategory, ExpensePaymentSource } from "@/models/Expense";
import Shift from "@/models/Shift";
import { InstaPayLedgerEngine } from "./InstaPayLedgerEngine";

export interface RecordExpenseInput {
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentSource: ExpensePaymentSource;
  paidTo?: string;
  receiptNumber?: string;
  notes?: string;
  performedBy?: string;
  shiftId?: string;
}

export class ExpensesEngine {
  /**
   * Records a new expense and synchronizes with Shift cash drawer and/or InstaPay ledger
   */
  static async recordExpense(input: RecordExpenseInput): Promise<IExpense> {
    await dbConnect();
    const amount = Math.round(Number(input.amount) * 100) / 100;
    if (isNaN(amount) || amount <= 0) {
      throw new Error("قيمة المصروف يجب أن تكون أكبر من صفر");
    }

    const expense = await Expense.create({
      title: input.title.trim(),
      amount,
      category: input.category || "other",
      paymentSource: input.paymentSource || "cash_drawer",
      paidTo: input.paidTo?.trim() || undefined,
      receiptNumber: input.receiptNumber?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      performedBy: (input.performedBy || "الكاشير").trim(),
      shiftId: input.shiftId?.trim() || undefined,
    });

    // 1. If paid from cash drawer, update active shift expected cash & total expenses
    if (input.paymentSource === "cash_drawer" && input.shiftId) {
      try {
        const shift = await Shift.findById(input.shiftId);
        if (shift && shift.status === "open") {
          shift.totalExpenses = (shift.totalExpenses || 0) + amount;
          shift.expectedCash = Math.max(0, (shift.expectedCash || 0) - amount);
          await shift.save();
        }
      } catch (err) {
        console.error("Failed to update shift expected cash for expense:", err);
      }
    }

    // 2. If paid via InstaPay, record withdrawal in InstaPay ledger
    if (input.paymentSource === "instapay") {
      try {
        await InstaPayLedgerEngine.recordTransaction({
          type: "withdrawal",
          amount,
          description: `مصروفات - ${input.title.trim()}`,
          category: "expense",
          referenceNumber: input.receiptNumber?.trim() || undefined,
          performedBy: (input.performedBy || "الكاشير").trim(),
          shiftId: input.shiftId,
        });
      } catch (err) {
        console.error("Failed to record InstaPay withdrawal for expense:", err);
      }
    }

    return expense;
  }

  /**
   * Deletes/voids an expense and performs reverse adjustments on Shift/InstaPay
   */
  static async deleteExpense(id: string): Promise<boolean> {
    await dbConnect();
    const expense = await Expense.findById(id);
    if (!expense) return false;

    // Reverse Shift cash drawer deduction if open
    if (expense.paymentSource === "cash_drawer" && expense.shiftId) {
      try {
        const shift = await Shift.findById(expense.shiftId);
        if (shift && shift.status === "open") {
          shift.totalExpenses = Math.max(0, (shift.totalExpenses || 0) - expense.amount);
          shift.expectedCash = (shift.expectedCash || 0) + expense.amount;
          await shift.save();
        }
      } catch (err) {
        console.error("Failed to reverse shift cash for deleted expense:", err);
      }
    }

    // Reverse InstaPay deduction
    if (expense.paymentSource === "instapay") {
      try {
        await InstaPayLedgerEngine.recordTransaction({
          type: "deposit",
          amount: expense.amount,
          description: `إلغاء مصروف - ${expense.title}`,
          category: "other",
          referenceNumber: `VOID-${expense._id.toString().slice(-6)}`,
          performedBy: "النظام",
        });
      } catch (err) {
        console.error("Failed to reverse InstaPay for deleted expense:", err);
      }
    }

    await Expense.findByIdAndDelete(id);
    return true;
  }

  /**
   * Fetches summary statistics and paginated filtered expenses
   */
  static async getExpensesSummary(filters: {
    search?: string;
    category?: string;
    paymentSource?: string;
    dateRange?: "today" | "shift" | "week" | "month" | "all";
    shiftId?: string;
    page?: number;
    limit?: number;
  }) {
    await dbConnect();
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 30));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (filters.category && filters.category !== "all") {
      query.category = filters.category;
    }
    if (filters.paymentSource && filters.paymentSource !== "all") {
      query.paymentSource = filters.paymentSource;
    }
    if (filters.shiftId && filters.dateRange === "shift") {
      query.shiftId = filters.shiftId;
    }

    if (filters.search && filters.search.trim()) {
      const s = filters.search.trim();
      query.$or = [
        { title: { $regex: s, $options: "i" } },
        { paidTo: { $regex: s, $options: "i" } },
        { receiptNumber: { $regex: s, $options: "i" } },
        { notes: { $regex: s, $options: "i" } },
        { performedBy: { $regex: s, $options: "i" } },
      ];
    }

    const now = new Date();
    if (filters.dateRange && filters.dateRange !== "all" && filters.dateRange !== "shift") {
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

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      expenses,
      totalCount,
      totalAgg,
      todayAgg,
      monthAgg,
      shiftAgg,
      categoryBreakdown,
    ] = await Promise.all([
      Expense.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      Expense.countDocuments(query),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      Expense.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      filters.shiftId
        ? Expense.aggregate([
            { $match: { shiftId: filters.shiftId } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ])
        : Promise.resolve([]),
      Expense.aggregate([
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    return {
      totalExpenses: totalAgg[0]?.total || 0,
      todayExpenses: todayAgg[0]?.total || 0,
      monthExpenses: monthAgg[0]?.total || 0,
      shiftExpenses: shiftAgg[0]?.total || 0,
      categoryBreakdown,
      expenses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }
}
