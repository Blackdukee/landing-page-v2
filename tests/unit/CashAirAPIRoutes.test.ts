import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import * as mongodb from "../../src/lib/mongodb";
import * as POSCheckoutEngine from "../../src/modules/cashair/POSCheckoutEngine";
import * as ReturnsRefundEngine from "../../src/modules/cashair/ReturnsRefundEngine";
import * as ShiftLedgerEngine from "../../src/modules/cashair/ShiftLedgerEngine";
import * as FinancialReportsEngine from "../../src/modules/cashair/FinancialReportsEngine";
import Product from "../../src/models/Product";
import Order from "../../src/models/Order";

import { POST as POSTCheckout } from "../../src/app/api/cashair/checkout/route";
import { POST as POSTReturns } from "../../src/app/api/cashair/returns/route";
import { GET as GETShift, POST as POSTShift, PUT as PUTShift } from "../../src/app/api/cashair/shift/route";
import { GET as GETReports } from "../../src/app/api/cashair/reports/route";
import { GET as GETProducts } from "../../src/app/api/cashair/products/route";
import { GET as GETOrders } from "../../src/app/api/cashair/orders/route";

import * as auth from "../../src/lib/auth";

describe("CashAir API Routes Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Default dbConnect spy
    vi.spyOn(mongodb, "default").mockResolvedValue({} as any);
    // Bypass auth in unit tests
    vi.spyOn(auth, "checkAdminAuthResponse").mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. POST /api/cashair/checkout
  // ---------------------------------------------------------------------------
  describe("POST /api/cashair/checkout", () => {
    it("should return 400 for invalid JSON body", async () => {
      const req = new NextRequest("http://localhost/api/cashair/checkout", {
        method: "POST",
        body: "invalid-json{",
      });

      const res = await POSTCheckout(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/invalid json/i);
    });

    it("should return 400 if shiftId is missing", async () => {
      const req = new NextRequest("http://localhost/api/cashair/checkout", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: "p1", name: "Product 1", price: 10, quantity: 1 }],
          paymentMethod: "cash",
        }),
      });

      const res = await POSTCheckout(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/shiftId is required/i);
    });

    it("should return 400 if items array is missing or empty", async () => {
      const req = new NextRequest("http://localhost/api/cashair/checkout", {
        method: "POST",
        body: JSON.stringify({
          shiftId: "shift-123",
          items: [],
          paymentMethod: "cash",
        }),
      });

      const res = await POSTCheckout(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/items array is required/i);
    });

    it("should return 400 if paymentMethod is missing", async () => {
      const req = new NextRequest("http://localhost/api/cashair/checkout", {
        method: "POST",
        body: JSON.stringify({
          shiftId: "shift-123",
          items: [{ productId: "p1", name: "Product 1", price: 10, quantity: 1 }],
        }),
      });

      const res = await POSTCheckout(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/paymentMethod is required/i);
    });

    it("should return 400 if processPOSSale returns success: false", async () => {
      vi.spyOn(POSCheckoutEngine, "processPOSSale").mockResolvedValueOnce({
        success: false,
        error: "Insufficient stock for product p1",
      });

      const req = new NextRequest("http://localhost/api/cashair/checkout", {
        method: "POST",
        body: JSON.stringify({
          shiftId: "shift-123",
          items: [{ productId: "p1", name: "Product 1", price: 10, quantity: 10 }],
          paymentMethod: "cash",
        }),
      });

      const res = await POSTCheckout(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/insufficient stock/i);
    });

    it("should return 200 with result payload when checkout succeeds", async () => {
      vi.spyOn(POSCheckoutEngine, "processPOSSale").mockResolvedValueOnce({
        success: true,
        orderId: "order-999",
        finalTotal: 100,
        receiptText: "RECEIPT TEXT",
        whatsappUrl: "https://wa.me/123",
      });

      const req = new NextRequest("http://localhost/api/cashair/checkout", {
        method: "POST",
        body: JSON.stringify({
          shiftId: "shift-123",
          items: [{ productId: "p1", name: "Product 1", price: 100, quantity: 1 }],
          paymentMethod: "cash",
        }),
      });

      const res = await POSTCheckout(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.orderId).toBe("order-999");
      expect(json.finalTotal).toBe(100);
      expect(json.receiptText).toBe("RECEIPT TEXT");
    });

    it("should return 500 when an unexpected exception occurs", async () => {
      vi.spyOn(POSCheckoutEngine, "processPOSSale").mockRejectedValueOnce(
        new Error("Database crash")
      );

      const req = new NextRequest("http://localhost/api/cashair/checkout", {
        method: "POST",
        body: JSON.stringify({
          shiftId: "shift-123",
          items: [{ productId: "p1", name: "Product 1", price: 100, quantity: 1 }],
          paymentMethod: "cash",
        }),
      });

      const res = await POSTCheckout(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/failed to process pos checkout/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. POST /api/cashair/returns
  // ---------------------------------------------------------------------------
  describe("POST /api/cashair/returns", () => {
    it("should return 400 for invalid JSON body", async () => {
      const req = new NextRequest("http://localhost/api/cashair/returns", {
        method: "POST",
        body: "invalid-json{",
      });

      const res = await POSTReturns(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/invalid json/i);
    });

    it("should return 400 if orderId is missing", async () => {
      const req = new NextRequest("http://localhost/api/cashair/returns", {
        method: "POST",
        body: JSON.stringify({
          shiftId: "shift-123",
          items: [{ productId: "p1", quantity: 1 }],
          paymentMethod: "cash",
          restockToInventory: true,
        }),
      });

      const res = await POSTReturns(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/orderId is required/i);
    });

    it("should return 400 if processReturn returns success: false", async () => {
      vi.spyOn(ReturnsRefundEngine, "processReturn").mockResolvedValueOnce({
        success: false,
        error: "Order not found",
      });

      const req = new NextRequest("http://localhost/api/cashair/returns", {
        method: "POST",
        body: JSON.stringify({
          orderId: "order-invalid",
          shiftId: "shift-123",
          items: [{ productId: "p1", quantity: 1 }],
          paymentMethod: "cash",
          restockToInventory: true,
        }),
      });

      const res = await POSTReturns(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/order not found/i);
    });

    it("should return 200 with result payload when return succeeds", async () => {
      vi.spyOn(ReturnsRefundEngine, "processReturn").mockResolvedValueOnce({
        success: true,
        returnId: "RET-123",
        totalRefunded: 50,
        updatedOrderStatus: "partially_returned",
        receiptText: "RETURN RECEIPT",
      });

      const req = new NextRequest("http://localhost/api/cashair/returns", {
        method: "POST",
        body: JSON.stringify({
          orderId: "order-123",
          shiftId: "shift-123",
          items: [{ productId: "p1", quantity: 1 }],
          paymentMethod: "cash",
          restockToInventory: true,
        }),
      });

      const res = await POSTReturns(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.returnId).toBe("RET-123");
      expect(json.totalRefunded).toBe(50);
      expect(json.updatedOrderStatus).toBe("partially_returned");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. /api/cashair/shift (GET, POST, PUT)
  // ---------------------------------------------------------------------------
  describe("/api/cashair/shift", () => {
    it("GET should return active shift", async () => {
      const mockShift = { _id: "shift-123", cashierName: "Ahmed", status: "open" };
      vi.spyOn(ShiftLedgerEngine, "getActiveShift").mockResolvedValueOnce(mockShift as any);

      const req = new NextRequest("http://localhost/api/cashair/shift");
      const res = await GETShift(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.shift._id).toBe("shift-123");
    });

    it("POST should return 400 for invalid/missing cashierName or openingFloat", async () => {
      const req = new NextRequest("http://localhost/api/cashair/shift", {
        method: "POST",
        body: JSON.stringify({ cashierName: "", openingFloat: -10 }),
      });

      const res = await POSTShift(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("POST should start shift successfully and return 200", async () => {
      const mockShift = { _id: "shift-555", cashierName: "Mahmoud", openingFloat: 200, status: "open" };
      vi.spyOn(ShiftLedgerEngine, "startShift").mockResolvedValueOnce(mockShift as any);

      const req = new NextRequest("http://localhost/api/cashair/shift", {
        method: "POST",
        body: JSON.stringify({ cashierName: "Mahmoud", openingFloat: 200 }),
      });

      const res = await POSTShift(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.shift.cashierName).toBe("Mahmoud");
    });

    it("PUT should return 400 if shiftId is missing or actualCash is negative", async () => {
      const req = new NextRequest("http://localhost/api/cashair/shift", {
        method: "PUT",
        body: JSON.stringify({ actualCash: -5 }),
      });

      const res = await PUTShift(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("PUT should end shift successfully and return 200", async () => {
      const mockClosedShift = {
        _id: "shift-555",
        cashierName: "Mahmoud",
        actualCash: 300,
        cashVariance: 100,
        status: "closed",
      };
      vi.spyOn(ShiftLedgerEngine, "endShift").mockResolvedValueOnce(mockClosedShift as any);

      const req = new NextRequest("http://localhost/api/cashair/shift", {
        method: "PUT",
        body: JSON.stringify({ shiftId: "shift-555", actualCash: 300, notes: "All good" }),
      });

      const res = await PUTShift(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.shift.status).toBe("closed");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. GET /api/cashair/reports
  // ---------------------------------------------------------------------------
  describe("GET /api/cashair/reports", () => {
    it("should fetch report metrics and return 200", async () => {
      const mockReport = {
        period: "today",
        grossSales: 1000,
        netSales: 900,
        totalOrdersCount: 5,
      };
      vi.spyOn(FinancialReportsEngine, "generateFinancialReport").mockResolvedValueOnce(
        mockReport as any
      );

      const req = new NextRequest("http://localhost/api/cashair/reports?period=today&source=pos");
      const res = await GETReports(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.report.grossSales).toBe(1000);
      expect(json.report.netSales).toBe(900);
    });

    it("should pass category and companyId filters to generateFinancialReport", async () => {
      const generateSpy = vi.spyOn(FinancialReportsEngine, "generateFinancialReport").mockResolvedValueOnce({
        period: "this_month",
        grossSales: 500,
      } as any);

      const req = new NextRequest(
        "http://localhost/api/cashair/reports?period=this_month&category=Electronics&companyId=comp-123"
      );
      const res = await GETReports(req);
      expect(res.status).toBe(200);
      expect(generateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          period: "this_month",
          category: "Electronics",
          companyId: "comp-123",
          brandId: "comp-123",
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 5. GET /api/cashair/products
  // ---------------------------------------------------------------------------
  describe("GET /api/cashair/products", () => {
    it("should query catalog products and return 200", async () => {
      const mockProducts = [
        { _id: "p1", name: "Headphones", price: 50, stock: 10, category: "Electronics" },
      ];

      const mockQuery: any = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValueOnce(mockProducts),
      };

      vi.spyOn(Product, "find").mockReturnValueOnce(mockQuery);
      vi.spyOn(Product, "countDocuments").mockResolvedValueOnce(1);

      const req = new NextRequest("http://localhost/api/cashair/products?q=head&category=Electronics");
      const res = await GETProducts(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.products).toHaveLength(1);
      expect(json.total).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. GET /api/cashair/orders
  // ---------------------------------------------------------------------------
  describe("GET /api/cashair/orders", () => {
    it("should search orders by status & source and return 200", async () => {
      const mockOrders = [
        { _id: "order-1", totalPrice: 150, status: "delivered", source: "pos" },
      ];

      const mockQuery: any = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValueOnce(mockOrders),
      };

      vi.spyOn(Order, "find").mockReturnValueOnce(mockQuery);
      vi.spyOn(Order, "countDocuments").mockResolvedValueOnce(1);

      const req = new NextRequest("http://localhost/api/cashair/orders?status=delivered&source=pos");
      const res = await GETOrders(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.orders).toHaveLength(1);
      expect(json.total).toBe(1);
    });
  });
});
