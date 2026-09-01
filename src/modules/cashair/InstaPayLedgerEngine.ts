import dbConnect from "@/lib/mongodb";
import InstaPayTransaction, { IInstaPayTransaction } from "@/models/InstaPayTransaction";

export interface RecordTransactionParams {
  type: "sale" | "deposit" | "withdrawal" | "refund" | "adjustment";
  amount: number;
  description: string;
  category?:
    | "sales"
    | "supplier_payment"
    | "expense"
    | "bank_transfer"
    | "owner_withdrawal"
    | "deposit"
    | "refund"
    | "other";
  referenceNumber?: string;
  performedBy?: string;
  shiftId?: string;
  orderId?: string;
}

export class InstaPayLedgerEngine {
  /**
   * Returns the current running balance of the InstaPay wallet
   */
  static async getCurrentBalance(): Promise<number> {
    await dbConnect();
    const latest = await InstaPayTransaction.findOne()
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    return latest?.runningBalance || 0;
  }

  /**
   * Records a new transaction and atomically updates the running balance
   */
  static async recordTransaction(params: RecordTransactionParams): Promise<IInstaPayTransaction> {
    await dbConnect();
    const currentBalance = await this.getCurrentBalance();
    const isCredit =
      params.type === "sale" ||
      params.type === "deposit" ||
      (params.type === "adjustment" && params.amount >= 0);
    const amount = Math.abs(params.amount);

    let newBalance = isCredit ? currentBalance + amount : currentBalance - amount;
    newBalance = Math.round(newBalance * 100) / 100;

    const defaultCategory =
      params.category ||
      (params.type === "sale"
        ? "sales"
        : params.type === "refund"
        ? "refund"
        : params.type === "deposit"
        ? "deposit"
        : params.type === "withdrawal"
        ? "expense"
        : "other");

    const doc = await InstaPayTransaction.create({
      type: params.type,
      amount,
      runningBalance: newBalance,
      description: params.description.trim(),
      category: defaultCategory,
      referenceNumber: params.referenceNumber?.trim() || undefined,
      performedBy: (params.performedBy || "الكاشير").trim(),
      shiftId: params.shiftId,
      orderId: params.orderId,
    });

    return doc;
  }

  /**
   * Fetches the summary metrics and paginated transaction history
   */
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
      InstaPayTransaction.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
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
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }
}
