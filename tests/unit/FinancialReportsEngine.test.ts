import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Shift from "../../src/models/Shift";
import Order from "../../src/models/Order";
import Product from "../../src/models/Product";
import {
  startShift,
  getActiveShift,
  endShift,
} from "../../src/modules/cashair/ShiftLedgerEngine";
import {
  generateFinancialReport,
  getReportDateRange,
  FinancialReportFilter,
} from "../../src/modules/cashair/FinancialReportsEngine";

describe("ShiftLedgerEngine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("startShift", () => {
    it("should successfully start a shift when no active shift exists", async () => {
      vi.spyOn(Shift, "findOne").mockResolvedValueOnce(null);
      const saveSpy = vi.spyOn(Shift.prototype, "save").mockImplementation(function (this: any) {
        this._id = "shift-001";
        return Promise.resolve(this);
      });

      const shift = await startShift("Ahmed Cashier", 500);

      expect(shift).toBeDefined();
      expect(shift.cashierName).toBe("Ahmed Cashier");
      expect(shift.openingFloat).toBe(500);
      expect(shift.expectedCash).toBe(500);
      expect(shift.status).toBe("open");
      expect(saveSpy).toHaveBeenCalled();
    });

    it("should throw error if an active shift already exists", async () => {
      vi.spyOn(Shift, "findOne").mockResolvedValueOnce({
        _id: "shift-existing",
        cashierName: "Mona",
        status: "open",
      } as any);

      await expect(startShift("Ahmed Cashier", 500)).rejects.toThrow(
        "An active shift already exists for cashier or system."
      );
    });

    it("should throw error if cashierName is missing or empty", async () => {
      await expect(startShift("   ", 500)).rejects.toThrow(
        "Cashier name is required to start a shift."
      );
    });

    it("should throw error if openingFloat is negative", async () => {
      await expect(startShift("Ahmed Cashier", -100)).rejects.toThrow(
        "Opening float cannot be negative."
      );
    });
  });

  describe("getActiveShift", () => {
    it("should return the active shift if one exists", async () => {
      const mockShift = {
        _id: "shift-001",
        cashierName: "Ahmed",
        status: "open",
      };
      vi.spyOn(Shift, "findOne").mockResolvedValueOnce(mockShift as any);

      const active = await getActiveShift();
      expect(active).toBeDefined();
      expect(active?._id).toBe("shift-001");
    });

    it("should return null if no active shift exists", async () => {
      vi.spyOn(Shift, "findOne").mockResolvedValueOnce(null);

      const active = await getActiveShift();
      expect(active).toBeNull();
    });
  });

  describe("endShift", () => {
    it("should close shift and calculate zero variance when actual equals expected", async () => {
      const mockShift = {
        _id: "shift-100",
        status: "open",
        expectedCash: 1200,
        actualCash: 0,
        cashVariance: 0,
        notes: "",
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Shift, "findById").mockResolvedValueOnce(mockShift as any);

      const closed = await endShift("shift-100", 1200, "All balanced");

      expect(closed.status).toBe("closed");
      expect(closed.actualCash).toBe(1200);
      expect(closed.cashVariance).toBe(0);
      expect(closed.notes).toBe("All balanced");
      expect(closed.closedAt).toBeDefined();
      expect(mockShift.save).toHaveBeenCalled();
    });

    it("should calculate positive variance (overage) correctly", async () => {
      const mockShift = {
        _id: "shift-101",
        status: "open",
        expectedCash: 1000,
        actualCash: 0,
        cashVariance: 0,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Shift, "findById").mockResolvedValueOnce(mockShift as any);

      const closed = await endShift("shift-101", 1050);

      expect(closed.actualCash).toBe(1050);
      expect(closed.cashVariance).toBe(50); // 1050 - 1000
      expect(closed.status).toBe("closed");
    });

    it("should calculate negative variance (shortage) correctly", async () => {
      const mockShift = {
        _id: "shift-102",
        status: "open",
        expectedCash: 1000,
        actualCash: 0,
        cashVariance: 0,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Shift, "findById").mockResolvedValueOnce(mockShift as any);

      const closed = await endShift("shift-102", 950);

      expect(closed.actualCash).toBe(950);
      expect(closed.cashVariance).toBe(-50); // 950 - 1000
      expect(closed.status).toBe("closed");
    });

    it("should throw error if shift is not found or already closed", async () => {
      vi.spyOn(Shift, "findById").mockResolvedValueOnce(null);

      await expect(endShift("shift-missing", 1000)).rejects.toThrow(
        "Active shift not found or shift is already closed."
      );
    });
  });
});

describe("FinancialReportsEngine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getReportDateRange", () => {
    it("should calculate date range for 'today'", () => {
      const { startDate, endDate } = getReportDateRange({ period: "today" });
      const now = new Date();

      expect(startDate.getFullYear()).toBe(now.getFullYear());
      expect(startDate.getMonth()).toBe(now.getMonth());
      expect(startDate.getDate()).toBe(now.getDate());
      expect(startDate.getHours()).toBe(0);
      expect(endDate.getHours()).toBe(23);
    });

    it("should calculate date range for 'yesterday'", () => {
      const { startDate, endDate } = getReportDateRange({ period: "yesterday" });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(startDate.getDate()).toBe(yesterday.getDate());
      expect(endDate.getDate()).toBe(yesterday.getDate());
    });

    it("should handle custom date range", () => {
      const customStart = new Date("2026-01-01T00:00:00.000Z");
      const customEnd = new Date("2026-01-31T23:59:59.999Z");

      const { startDate, endDate } = getReportDateRange({
        period: "custom",
        startDate: customStart,
        endDate: customEnd,
      });

      expect(startDate.toISOString()).toBe(customStart.toISOString());
      expect(endDate.toISOString()).toBe(customEnd.toISOString());
    });
  });

  describe("generateFinancialReport", () => {
    it("should aggregate gross, discounts, refunds, net sales, cost of goods, gross profit, channels, and payment methods", async () => {
      const orderAggregateSpy = vi.spyOn(Order, "aggregate");
      const shiftAggregateSpy = vi.spyOn(Shift, "aggregate");

      // 1. Order Summary
      orderAggregateSpy.mockResolvedValueOnce([
        {
          grossSales: 2000,
          totalDiscounts: 200,
          totalRefunds: 100,
          totalCost: 1000,
          totalOrdersCount: 8,
          posRevenue: 1200,
          posOrdersCount: 5,
          webRevenue: 500,
          webOrdersCount: 3,
          cash: 800,
          instapay: 400,
          vodafone_cash: 300,
          card: 200,
        },
      ]);

      // 2. Top Products
      orderAggregateSpy.mockResolvedValueOnce([
        { _id: "prod-101", name: "Polo Shirt", quantity: 10, revenue: 1000, cost: 600 },
        { _id: "prod-102", name: "Jeans", quantity: 5, revenue: 700, cost: 400 },
      ]);

      // 3. Category Sales
      orderAggregateSpy.mockResolvedValueOnce([
        { _id: "Apparel", revenue: 1700, quantity: 15 },
      ]);

      // 4. Company Sales
      orderAggregateSpy.mockResolvedValueOnce([
        { _id: { companyId: "comp-1", companyName: "Adidas" }, revenue: 1700, quantity: 15 },
      ]);

      // 5. Shift Summary
      shiftAggregateSpy.mockResolvedValueOnce([
        {
          totalShifts: 3,
          totalOpeningFloat: 1500,
          totalExpectedCash: 2300,
          totalActualCash: 2280,
          totalCashVariance: -20,
        },
      ]);

      // 6. Inventory Valuation
      const productAggregateSpy = vi.spyOn(Product, "aggregate").mockResolvedValueOnce([
        {
          totalBuyingValue: 12000,
          totalRetailValue: 20000,
          totalUnits: 120,
          totalProductsCount: 15,
        },
      ]);

      const filter: FinancialReportFilter = { period: "this_month" };
      const report = await generateFinancialReport(filter);

      expect(report.period).toBe("this_month");
      expect(report.grossSales).toBe(2000);
      expect(report.totalDiscounts).toBe(200);
      expect(report.totalRefunds).toBe(100);
      // netSales = 2000 - 200 - 100 = 1700
      expect(report.netSales).toBe(1700);
      expect(report.totalCostOfGoodsSold).toBe(1000);
      // grossProfit = 1700 - 1000 = 700
      expect(report.grossProfit).toBe(700);
      // profitMargin = (700 / 1700) * 100 ≈ 41.18%
      expect(report.profitMargin).toBe(41.18);
      expect(report.totalOrdersCount).toBe(8);

      // Channel Breakdown
      expect(report.channelBreakdown).toEqual({
        posRevenue: 1200,
        posOrdersCount: 5,
        webRevenue: 500,
        webOrdersCount: 3,
      });

      // Payment Method Breakdown
      expect(report.paymentMethodBreakdown).toEqual({
        cash: 800,
        instapay: 400,
        vodafone_cash: 300,
        card: 200,
      });

      // Category Sales
      expect(report.categorySales).toHaveLength(1);
      expect(report.categorySales[0]).toEqual({
        category: "Apparel",
        categoryName: "Apparel",
        revenue: 1700,
        quantity: 15,
      });

      // Company Sales
      expect(report.companySales).toHaveLength(1);
      expect(report.companySales[0]).toEqual({
        companyId: "comp-1",
        companyName: "Adidas",
        revenue: 1700,
        quantity: 15,
      });

      // Top Products
      expect(report.topProducts).toHaveLength(2);
      expect(report.topProducts[0]).toEqual({
        productId: "prod-101",
        name: "Polo Shirt",
        quantity: 10,
        revenue: 1000,
        cost: 600,
        profit: 400,
        margin: 40,
      });

      // Shift Metrics
      expect(report.shiftMetrics).toEqual({
        totalShifts: 3,
        totalOpeningFloat: 1500,
        totalExpectedCash: 2300,
        totalActualCash: 2280,
        totalCashVariance: -20,
      });

      // In-Stock Inventory Valuation
      expect(report.totalInventoryBuyingValue).toBe(12000);
      expect(report.totalInventoryRetailValue).toBe(20000);
      expect(report.totalInventoryUnits).toBe(120);
      expect(report.inventoryValuation).toEqual({
        totalBuyingValue: 12000,
        totalRetailValue: 20000,
        totalUnits: 120,
        totalProductsCount: 15,
        potentialProfit: 8000,
        potentialMargin: 40,
      });
    });

    it("should handle empty database results gracefully with zero values", async () => {
      vi.spyOn(Order, "aggregate").mockResolvedValue([]);
      vi.spyOn(Shift, "aggregate").mockResolvedValue([]);
      vi.spyOn(Product, "aggregate").mockResolvedValue([]);

      const report = await generateFinancialReport({ period: "today" });

      expect(report.grossSales).toBe(0);
      expect(report.totalDiscounts).toBe(0);
      expect(report.totalRefunds).toBe(0);
      expect(report.netSales).toBe(0);
      expect(report.totalOrdersCount).toBe(0);
      expect(report.totalInventoryBuyingValue).toBe(0);
      expect(report.totalInventoryRetailValue).toBe(0);
      expect(report.totalInventoryUnits).toBe(0);
      expect(report.inventoryValuation).toEqual({
        totalBuyingValue: 0,
        totalRetailValue: 0,
        totalUnits: 0,
        totalProductsCount: 0,
        potentialProfit: 0,
        potentialMargin: 0,
      });
      expect(report.channelBreakdown).toEqual({
        posRevenue: 0,
        posOrdersCount: 0,
        webRevenue: 0,
        webOrdersCount: 0,
      });
      expect(report.paymentMethodBreakdown).toEqual({
        cash: 0,
        instapay: 0,
        vodafone_cash: 0,
        card: 0,
      });
      expect(report.categorySales).toEqual([]);
      expect(report.companySales).toEqual([]);
      expect(report.topProducts).toEqual([]);
      expect(report.shiftMetrics).toBeUndefined();
    });

    it("should pass source filter to aggregation match stage when source is specified", async () => {
      const orderAggregateSpy = vi.spyOn(Order, "aggregate").mockResolvedValue([]);
      vi.spyOn(Shift, "aggregate").mockResolvedValue([]);
      vi.spyOn(Product, "aggregate").mockResolvedValue([]);

      await generateFinancialReport({ period: "today", source: "pos" });

      expect(orderAggregateSpy).toHaveBeenCalled();
      const firstCallArgs = orderAggregateSpy.mock.calls[0][0] as any[];
      const matchStage = firstCallArgs[0].$match;
      expect(matchStage.source).toBe("pos");
    });

    it("should include category filter when category is specified", async () => {
      const orderAggregateSpy = vi.spyOn(Order, "aggregate").mockResolvedValue([]);
      vi.spyOn(Shift, "aggregate").mockResolvedValue([]);
      const productAggregateSpy = vi.spyOn(Product, "aggregate").mockResolvedValue([]);

      const report = await generateFinancialReport({
        period: "today",
        category: "Clothing",
      });

      expect(orderAggregateSpy).toHaveBeenCalled();
      expect(productAggregateSpy).toHaveBeenCalled();
      const summaryPipeline = orderAggregateSpy.mock.calls[0][0] as any[];
      const categoryMatchStage = summaryPipeline.find(
        (stage: any) => stage.$match && stage.$match["productDoc.category"] === "Clothing"
      );
      expect(categoryMatchStage).toBeDefined();
      expect(report.filterMeta?.category).toBe("Clothing");

      const invPipeline = productAggregateSpy.mock.calls[0][0] as any[];
      expect(invPipeline[0].$match.category).toBe("Clothing");
    });

    it("should include company/brand filter when companyId is specified", async () => {
      const orderAggregateSpy = vi.spyOn(Order, "aggregate").mockResolvedValue([]);
      vi.spyOn(Shift, "aggregate").mockResolvedValue([]);
      const productAggregateSpy = vi.spyOn(Product, "aggregate").mockResolvedValue([]);

      const report = await generateFinancialReport({
        period: "today",
        companyId: "comp-nike-123",
      });

      expect(orderAggregateSpy).toHaveBeenCalled();
      expect(productAggregateSpy).toHaveBeenCalled();
      const summaryPipeline = orderAggregateSpy.mock.calls[0][0] as any[];
      const companyMatchStage = summaryPipeline.find(
        (stage: any) => stage.$match && stage.$match.$expr
      );
      expect(companyMatchStage).toBeDefined();
      expect(report.filterMeta?.companyId).toBe("comp-nike-123");

      const invPipeline = productAggregateSpy.mock.calls[0][0] as any[];
      expect(invPipeline[0].$match.$expr).toBeDefined();
    });

    it("should include both category and companyId when both are specified", async () => {
      const orderAggregateSpy = vi.spyOn(Order, "aggregate").mockResolvedValue([]);
      vi.spyOn(Shift, "aggregate").mockResolvedValue([]);
      const productAggregateSpy = vi.spyOn(Product, "aggregate").mockResolvedValue([]);

      const report = await generateFinancialReport({
        period: "this_week",
        category: "Shoes",
        companyId: "comp-adidas-456",
      });

      expect(orderAggregateSpy).toHaveBeenCalled();
      expect(productAggregateSpy).toHaveBeenCalled();
      const summaryPipeline = orderAggregateSpy.mock.calls[0][0] as any[];
      const filterMatchStage = summaryPipeline.find(
        (stage: any) =>
          stage.$match &&
          stage.$match["productDoc.category"] === "Shoes" &&
          stage.$match.$expr
      );
      expect(filterMatchStage).toBeDefined();
      expect(report.filterMeta?.category).toBe("Shoes");
      expect(report.filterMeta?.companyId).toBe("comp-adidas-456");

      const invPipeline = productAggregateSpy.mock.calls[0][0] as any[];
      expect(invPipeline[0].$match.category).toBe("Shoes");
      expect(invPipeline[0].$match.$expr).toBeDefined();
    });
  });
});
