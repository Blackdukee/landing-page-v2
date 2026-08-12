import Order from "../../models/Order";
import Shift from "../../models/Shift";

export interface FinancialReportFilter {
  period?: "today" | "yesterday" | "this_week" | "this_month" | "custom";
  startDate?: Date | string;
  endDate?: Date | string;
  source?: string;
}

export interface ChannelBreakdown {
  posRevenue: number;
  posOrdersCount: number;
  webRevenue: number;
  webOrdersCount: number;
}

export interface PaymentMethodBreakdown {
  cash: number;
  instapay: number;
  vodafone_cash: number;
  card: number;
}

export interface CategorySale {
  category: string;
  revenue: number;
  quantity: number;
}

export interface CompanySale {
  companyId: string;
  companyName: string;
  revenue: number;
  quantity: number;
}

export interface TopProductSale {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
  cost?: number;
  profit?: number;
  margin?: number;
}

export interface ShiftFinancialSummary {
  totalShifts: number;
  totalOpeningFloat: number;
  totalExpectedCash: number;
  totalActualCash: number;
  totalCashVariance: number;
}

export interface FinancialReportSummary {
  period: string;
  startDate: Date;
  endDate: Date;
  grossSales: number;
  totalDiscounts: number;
  totalRefunds: number;
  netSales: number;
  netRevenue: number;
  totalCostOfGoodsSold: number;
  grossProfit: number;
  profitMargin: number;
  totalOrdersCount: number;
  averageOrderValue: number;
  channelBreakdown: ChannelBreakdown;
  salesChannels: {
    pos: { revenue: number; ordersCount: number };
    online: { revenue: number; ordersCount: number };
  };
  paymentMethodBreakdown: PaymentMethodBreakdown;
  paymentMethods: PaymentMethodBreakdown;
  categorySales: Array<CategorySale & { categoryName?: string }>;
  companySales: CompanySale[];
  topProducts: TopProductSale[];
  shiftMetrics?: ShiftFinancialSummary;
}

/**
 * Calculates start and end dates based on the filter's period or custom date parameters.
 */
export function getReportDateRange(filter: FinancialReportFilter): { startDate: Date; endDate: Date } {
  const period = filter.period || "today";
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (period === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
  } else if (period === "this_week") {
    const dayOfWeek = now.getDay();
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - dayOfWeek);
    startDate = new Date(firstDayOfWeek.getFullYear(), firstDayOfWeek.getMonth(), firstDayOfWeek.getDate(), 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === "this_month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === "custom") {
    startDate = filter.startDate ? new Date(filter.startDate) : new Date(0);
    endDate = filter.endDate ? new Date(filter.endDate) : new Date();
  } else {
    startDate = filter.startDate
      ? new Date(filter.startDate)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endDate = filter.endDate
      ? new Date(filter.endDate)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  return { startDate, endDate };
}

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Generates a comprehensive financial report aggregating Order and Shift data via Mongoose aggregation pipelines.
 */
export async function generateFinancialReport(
  filter: FinancialReportFilter
): Promise<FinancialReportSummary> {
  const { startDate, endDate } = getReportDateRange(filter);
  const periodStr = filter.period || "custom";

  const orderMatchFilter: any = {
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $ne: "cancelled" },
  };

  if (filter.source) {
    orderMatchFilter.source = filter.source;
  }

  // 1. Order Summary Pipeline (Gross, Discounts, Refunds, Net, Cost, Channels, Payment Methods)
  const summaryPipeline: any[] = [
    { $match: orderMatchFilter },
    {
      $project: {
        source: { $ifNull: ["$source", "online"] },
        paymentMethod: { $ifNull: ["$paymentMethod", "cash"] },
        totalPrice: 1,
        totalRefunded: { $ifNull: ["$totalRefunded", 0] },
        originalTotal: { $ifNull: ["$discountDetails.originalTotal", "$totalPrice"] },
        finalTotal: { $ifNull: ["$discountDetails.finalTotal", "$totalPrice"] },
        items: 1,
      },
    },
    {
      $addFields: {
        orderCost: {
          $sum: {
            $map: {
              input: "$items",
              as: "it",
              in: {
                $multiply: [
                  { $ifNull: ["$$it.costPrice", 0] },
                  { $ifNull: ["$$it.quantity", 1] },
                ],
              },
            },
          },
        },
      },
    },
    {
      $project: {
        source: 1,
        paymentMethod: 1,
        totalPrice: 1,
        totalRefunded: 1,
        originalTotal: 1,
        finalTotal: 1,
        orderCost: 1,
        discountAmount: {
          $cond: [
            { $gt: ["$originalTotal", "$finalTotal"] },
            { $subtract: ["$originalTotal", "$finalTotal"] },
            0,
          ],
        },
        netAmount: { $subtract: ["$finalTotal", "$totalRefunded"] },
      },
    },
    {
      $group: {
        _id: null,
        grossSales: { $sum: "$originalTotal" },
        totalDiscounts: { $sum: "$discountAmount" },
        totalRefunds: { $sum: "$totalRefunded" },
        netRevenue: { $sum: "$netAmount" },
        totalCost: { $sum: "$orderCost" },
        totalOrdersCount: { $sum: 1 },
        posRevenue: {
          $sum: {
            $cond: [{ $eq: ["$source", "pos"] }, "$netAmount", 0],
          },
        },
        posOrdersCount: {
          $sum: {
            $cond: [{ $eq: ["$source", "pos"] }, 1, 0],
          },
        },
        webRevenue: {
          $sum: {
            $cond: [{ $ne: ["$source", "pos"] }, "$netAmount", 0],
          },
        },
        webOrdersCount: {
          $sum: {
            $cond: [{ $ne: ["$source", "pos"] }, 1, 0],
          },
        },
        cash: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$netAmount", 0],
          },
        },
        instapay: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "instapay"] }, "$netAmount", 0],
          },
        },
        vodafone_cash: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "vodafone_cash"] }, "$netAmount", 0],
          },
        },
        card: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "card"] }, "$netAmount", 0],
          },
        },
      },
    },
  ];

  // 2. Top Products Pipeline
  const topProductsPipeline: any[] = [
    { $match: orderMatchFilter },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        name: { $first: "$items.name" },
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        cost: {
          $sum: {
            $multiply: [
              { $ifNull: ["$items.costPrice", 0] },
              "$items.quantity",
            ],
          },
        },
      },
    },
    { $sort: { revenue: -1, quantity: -1 } },
  ];

  // 3. Category Sales Pipeline
  const categorySalesPipeline: any[] = [
    { $match: orderMatchFilter },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        let: { pId: "$items.productId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$_id", "$$pId"] },
                  { $eq: [{ $toString: "$_id" }, "$$pId"] },
                ],
              },
            },
          },
        ],
        as: "productDoc",
      },
    },
    {
      $addFields: {
        categoryName: {
          $ifNull: [{ $arrayElemAt: ["$productDoc.category", 0] }, "General"],
        },
      },
    },
    {
      $group: {
        _id: "$categoryName",
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        quantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { revenue: -1 } },
  ];

  // 4. Company Sales Pipeline
  const companySalesPipeline: any[] = [
    { $match: orderMatchFilter },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        let: { pId: "$items.productId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$_id", "$$pId"] },
                  { $eq: [{ $toString: "$_id" }, "$$pId"] },
                ],
              },
            },
          },
        ],
        as: "productDoc",
      },
    },
    {
      $addFields: {
        companyId: {
          $ifNull: [{ $arrayElemAt: ["$productDoc.company", 0] }, null],
        },
      },
    },
    {
      $lookup: {
        from: "companies",
        let: { cId: "$companyId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$_id", "$$cId"] },
                  { $eq: [{ $toString: "$_id" }, { $toString: "$$cId" }] },
                ],
              },
            },
          },
        ],
        as: "companyDoc",
      },
    },
    {
      $addFields: {
        companyName: {
          $ifNull: [{ $arrayElemAt: ["$companyDoc.name", 0] }, "Direct Sale"],
        },
        companyIdStr: {
          $ifNull: [{ $toString: "$companyId" }, "none"],
        },
      },
    },
    {
      $group: {
        _id: { companyId: "$companyIdStr", companyName: "$companyName" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        quantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { revenue: -1 } },
  ];

  // 5. Shift Summary Pipeline
  const shiftPipeline: any[] = [
    {
      $match: {
        openedAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalShifts: { $sum: 1 },
        totalOpeningFloat: { $sum: "$openingFloat" },
        totalExpectedCash: { $sum: "$expectedCash" },
        totalActualCash: { $sum: { $ifNull: ["$actualCash", 0] } },
        totalCashVariance: { $sum: { $ifNull: ["$cashVariance", 0] } },
      },
    },
  ];

  const [summaryResults, topProductsResults, categorySalesResults, companySalesResults, shiftResults] =
    await Promise.all([
      Order.aggregate(summaryPipeline),
      Order.aggregate(topProductsPipeline),
      Order.aggregate(categorySalesPipeline),
      Order.aggregate(companySalesPipeline),
      Shift.aggregate(shiftPipeline),
    ]);

  const summary = summaryResults && summaryResults[0] ? summaryResults[0] : {};
  const grossSales = round2(summary.grossSales || 0);
  const totalDiscounts = round2(summary.totalDiscounts || 0);
  const totalRefunds = round2(summary.totalRefunds || 0);
  const netSales = round2(grossSales - totalDiscounts - totalRefunds);
  const totalCostOfGoodsSold = round2(summary.totalCost || 0);
  const grossProfit = round2(netSales - totalCostOfGoodsSold);
  const profitMargin = netSales > 0 ? round2((grossProfit / netSales) * 100) : 0;

  const totalOrdersCount = summary.totalOrdersCount || 0;

  const channelBreakdown: ChannelBreakdown = {
    posRevenue: round2(summary.posRevenue || 0),
    posOrdersCount: summary.posOrdersCount || 0,
    webRevenue: round2(summary.webRevenue || 0),
    webOrdersCount: summary.webOrdersCount || 0,
  };

  const paymentMethodBreakdown: PaymentMethodBreakdown = {
    cash: round2(summary.cash || 0),
    instapay: round2(summary.instapay || 0),
    vodafone_cash: round2(summary.vodafone_cash || 0),
    card: round2(summary.card || 0),
  };

  const categorySales = (categorySalesResults || []).map((row: any) => ({
    category: row._id || "عام",
    categoryName: row._id || "عام",
    revenue: round2(row.revenue || 0),
    quantity: row.quantity || 0,
  }));

  const companySales: CompanySale[] = (companySalesResults || []).map((row: any) => ({
    companyId: row._id?.companyId || "none",
    companyName: row._id?.companyName || "بيع مباشر",
    revenue: round2(row.revenue || 0),
    quantity: row.quantity || 0,
  }));

  const topProducts: TopProductSale[] = (topProductsResults || []).map((row: any) => {
    const rev = round2(row.revenue || 0);
    const cost = round2(row.cost || 0);
    const profit = round2(rev - cost);
    const margin = rev > 0 ? round2((profit / rev) * 100) : 0;
    return {
      productId: String(row._id),
      name: row.name || "صنف غير معروف",
      quantity: row.quantity || 0,
      revenue: rev,
      cost,
      profit,
      margin,
    };
  });

  const shiftMetrics: ShiftFinancialSummary | undefined =
    shiftResults && shiftResults[0]
      ? {
          totalShifts: shiftResults[0].totalShifts || 0,
          totalOpeningFloat: round2(shiftResults[0].totalOpeningFloat || 0),
          totalExpectedCash: round2(shiftResults[0].totalExpectedCash || 0),
          totalActualCash: round2(shiftResults[0].totalActualCash || 0),
          totalCashVariance: round2(shiftResults[0].totalCashVariance || 0),
        }
      : undefined;

  const averageOrderValue = totalOrdersCount > 0 ? round2(netSales / totalOrdersCount) : 0;

  const salesChannels = {
    pos: {
      revenue: channelBreakdown.posRevenue,
      ordersCount: channelBreakdown.posOrdersCount,
    },
    online: {
      revenue: channelBreakdown.webRevenue,
      ordersCount: channelBreakdown.webOrdersCount,
    },
  };

  return {
    period: periodStr,
    startDate,
    endDate,
    grossSales,
    totalDiscounts,
    totalRefunds,
    netSales,
    netRevenue: netSales,
    totalCostOfGoodsSold,
    grossProfit,
    profitMargin,
    totalOrdersCount,
    averageOrderValue,
    channelBreakdown,
    salesChannels,
    paymentMethodBreakdown,
    paymentMethods: paymentMethodBreakdown,
    categorySales,
    companySales,
    topProducts,
    shiftMetrics,
  };
}
