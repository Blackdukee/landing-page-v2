import Order from "../../models/Order";
import Shift from "../../models/Shift";
import Product from "../../models/Product";

export interface FinancialReportFilter {
  period?: "today" | "yesterday" | "this_week" | "this_month" | "custom";
  startDate?: Date | string;
  endDate?: Date | string;
  source?: string;
  category?: string;
  companyId?: string;
  brandId?: string;
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
  categoryName?: string;
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

export interface InventoryValuationSummary {
  totalBuyingValue: number;
  totalRetailValue: number;
  totalUnits: number;
  totalProductsCount: number;
  potentialProfit: number;
  potentialMargin: number;
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
  categorySales: CategorySale[];
  companySales: CompanySale[];
  topProducts: TopProductSale[];
  shiftMetrics?: ShiftFinancialSummary;
  totalInventoryBuyingValue: number;
  totalInventoryRetailValue: number;
  totalInventoryUnits: number;
  inventoryValuation: InventoryValuationSummary;
  filterMeta?: {
    category?: string;
    companyId?: string;
    brandId?: string;
  };
}

/**
 * Calculates start and end Date objects based on report filter period.
 */
export function getReportDateRange(filter: FinancialReportFilter): {
  startDate: Date;
  endDate: Date;
} {
  if (filter.period === "custom" && filter.startDate && filter.endDate) {
    return {
      startDate: new Date(filter.startDate),
      endDate: new Date(filter.endDate),
    };
  }

  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  switch (filter.period) {
    case "yesterday": {
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case "this_week": {
      const day = now.getDay();
      const diff = now.getDate() - day;
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      break;
    }
    case "this_month": {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now);
      break;
    }
    case "today":
    default: {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
  }

  return { startDate, endDate };
}

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Generates a comprehensive financial report aggregating Order and Shift data via Mongoose aggregation pipelines.
 * Supports filtering by date range, channel source, brand/company, and category.
 */
export async function generateFinancialReport(
  filter: FinancialReportFilter
): Promise<FinancialReportSummary> {
  const { startDate, endDate } = getReportDateRange(filter);
  const periodStr = filter.period || "custom";
  const targetCompanyId = filter.companyId || filter.brandId;
  const targetCategory = filter.category;
  const isItemFiltered = Boolean(targetCompanyId || targetCategory);

  const orderMatchFilter: any = {
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $ne: "cancelled" },
  };

  if (filter.source) {
    orderMatchFilter.source = filter.source;
  }

  const productLookupStages: any[] = [
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
      $unwind: {
        path: "$productDoc",
        preserveNullAndEmptyArrays: !isItemFiltered,
      },
    },
  ];

  const itemFilterMatch: any = {};
  if (targetCategory) {
    itemFilterMatch["productDoc.category"] = targetCategory;
  }
  if (targetCompanyId) {
    itemFilterMatch.$expr = {
      $or: [
        { $eq: ["$productDoc.company", targetCompanyId] },
        { $eq: [{ $toString: "$productDoc.company" }, targetCompanyId] },
      ],
    };
  }

  let summaryPipeline: any[];

  if (isItemFiltered) {
    summaryPipeline = [
      { $match: orderMatchFilter },
      { $unwind: "$items" },
      ...productLookupStages,
      ...(Object.keys(itemFilterMatch).length > 0 ? [{ $match: itemFilterMatch }] : []),
      {
        $project: {
          orderId: "$_id",
          source: { $ifNull: ["$source", "online"] },
          paymentMethod: { $ifNull: ["$paymentMethod", "cash"] },
          itemRevenue: { $multiply: ["$items.price", "$items.quantity"] },
          itemCost: {
            $multiply: [
              { $ifNull: ["$items.costPrice", 0] },
              { $ifNull: ["$items.quantity", 1] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          grossSales: { $sum: "$itemRevenue" },
          totalDiscounts: { $sum: 0 },
          totalRefunds: { $sum: 0 },
          netRevenue: { $sum: "$itemRevenue" },
          totalCost: { $sum: "$itemCost" },
          ordersSet: { $addToSet: "$orderId" },
          posRevenue: {
            $sum: {
              $cond: [{ $eq: ["$source", "pos"] }, "$itemRevenue", 0],
            },
          },
          posOrdersSet: {
            $addToSet: {
              $cond: [{ $eq: ["$source", "pos"] }, "$orderId", "$$REMOVE"],
            },
          },
          webRevenue: {
            $sum: {
              $cond: [{ $ne: ["$source", "pos"] }, "$itemRevenue", 0],
            },
          },
          webOrdersSet: {
            $addToSet: {
              $cond: [{ $ne: ["$source", "pos"] }, "$orderId", "$$REMOVE"],
            },
          },
          cash: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$itemRevenue", 0],
            },
          },
          instapay: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "instapay"] }, "$itemRevenue", 0],
            },
          },
          vodafone_cash: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "vodafone_cash"] }, "$itemRevenue", 0],
            },
          },
          card: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "card"] }, "$itemRevenue", 0],
            },
          },
        },
      },
      {
        $project: {
          grossSales: 1,
          totalDiscounts: 1,
          totalRefunds: 1,
          netRevenue: 1,
          totalCost: 1,
          totalOrdersCount: { $size: { $ifNull: ["$ordersSet", []] } },
          posRevenue: 1,
          posOrdersCount: { $size: { $ifNull: ["$posOrdersSet", []] } },
          webRevenue: 1,
          webOrdersCount: { $size: { $ifNull: ["$webOrdersSet", []] } },
          cash: 1,
          instapay: 1,
          vodafone_cash: 1,
          card: 1,
        },
      },
    ];
  } else {
    summaryPipeline = [
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
  }

  const topProductsPipeline: any[] = [
    { $match: orderMatchFilter },
    { $unwind: "$items" },
    ...productLookupStages,
    ...(Object.keys(itemFilterMatch).length > 0 ? [{ $match: itemFilterMatch }] : []),
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

  const categorySalesPipeline: any[] = [
    { $match: orderMatchFilter },
    { $unwind: "$items" },
    ...productLookupStages,
    ...(Object.keys(itemFilterMatch).length > 0 ? [{ $match: itemFilterMatch }] : []),
    {
      $addFields: {
        categoryName: {
          $ifNull: ["$productDoc.category", "General"],
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

  const companySalesPipeline: any[] = [
    { $match: orderMatchFilter },
    { $unwind: "$items" },
    ...productLookupStages,
    ...(Object.keys(itemFilterMatch).length > 0 ? [{ $match: itemFilterMatch }] : []),
    {
      $addFields: {
        companyId: {
          $ifNull: ["$productDoc.company", null],
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

  // 6. Current In-Stock Inventory Valuation Pipeline
  const inventoryMatchFilter: any = {
    stock: { $gt: 0 },
  };
  if (targetCategory) {
    inventoryMatchFilter.category = targetCategory;
  }
  if (targetCompanyId) {
    inventoryMatchFilter.$expr = {
      $or: [
        { $eq: ["$company", targetCompanyId] },
        { $eq: [{ $toString: "$company" }, targetCompanyId] },
      ],
    };
  }

  const inventoryValuationPipeline: any[] = [
    { $match: inventoryMatchFilter },
    {
      $group: {
        _id: null,
        totalBuyingValue: {
          $sum: {
            $multiply: [
              { $ifNull: ["$costPrice", 0] },
              { $ifNull: ["$stock", 0] },
            ],
          },
        },
        totalRetailValue: {
          $sum: {
            $multiply: [
              { $ifNull: ["$price", 0] },
              { $ifNull: ["$stock", 0] },
            ],
          },
        },
        totalUnits: {
          $sum: { $ifNull: ["$stock", 0] },
        },
        totalProductsCount: { $sum: 1 },
      },
    },
  ];

  const [
    summaryResults,
    topProductsResults,
    categorySalesResults,
    companySalesResults,
    shiftResults,
    inventoryResults,
  ] = await Promise.all([
    Order.aggregate(summaryPipeline),
    Order.aggregate(topProductsPipeline),
    Order.aggregate(categorySalesPipeline),
    Order.aggregate(companySalesPipeline),
    Shift.aggregate(shiftPipeline),
    Product.aggregate(inventoryValuationPipeline),
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
    companyName: row._id?.companyName || "مباشر بدون ماركة",
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
      name: row.name || "منتج غير معروف",
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

  const invRaw = inventoryResults && inventoryResults[0] ? inventoryResults[0] : {};
  const totalInventoryBuyingValue = round2(invRaw.totalBuyingValue || 0);
  const totalInventoryRetailValue = round2(invRaw.totalRetailValue || 0);
  const totalInventoryUnits = invRaw.totalUnits || 0;
  const totalInStockProductsCount = invRaw.totalProductsCount || 0;
  const potentialProfit = round2(totalInventoryRetailValue - totalInventoryBuyingValue);
  const potentialMargin =
    totalInventoryRetailValue > 0
      ? round2((potentialProfit / totalInventoryRetailValue) * 100)
      : 0;

  const inventoryValuation: InventoryValuationSummary = {
    totalBuyingValue: totalInventoryBuyingValue,
    totalRetailValue: totalInventoryRetailValue,
    totalUnits: totalInventoryUnits,
    totalProductsCount: totalInStockProductsCount,
    potentialProfit,
    potentialMargin,
  };

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
    totalInventoryBuyingValue,
    totalInventoryRetailValue,
    totalInventoryUnits,
    inventoryValuation,
    filterMeta: {
      category: targetCategory,
      companyId: targetCompanyId,
      brandId: targetCompanyId,
    },
  };
}
