import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Shift from "../../src/models/Shift";
import Order from "../../src/models/Order";
import Product from "../../src/models/Product";
import { processPOSSale, POSSaleRequest } from "../../src/modules/cashair/POSCheckoutEngine";
import { processReturn, ReturnSaleRequest } from "../../src/modules/cashair/ReturnsRefundEngine";

describe("CheckoutAndReturnsEngine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POSCheckoutEngine - processPOSSale", () => {
    it("should fail if active shift is not found or closed", async () => {
      vi.spyOn(Shift, "findById").mockResolvedValueOnce(null as any);

      const request: POSSaleRequest = {
        shiftId: "shift-999",
        items: [{ productId: "p1", name: "Headphones", price: 100, quantity: 1 }],
        paymentMethod: "cash",
      };

      const result = await processPOSSale(request);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/active shift/i);
    });

    it("should fail if shift is closed", async () => {
      vi.spyOn(Shift, "findById").mockResolvedValueOnce({
        _id: "shift-123",
        status: "closed",
      } as any);

      const request: POSSaleRequest = {
        shiftId: "shift-123",
        items: [{ productId: "p1", name: "Headphones", price: 100, quantity: 1 }],
        paymentMethod: "cash",
      };

      const result = await processPOSSale(request);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/active shift/i);
    });

    it("should fail if inventory deduction fails", async () => {
      const mockShift = {
        _id: "shift-123",
        status: "open",
      };
      vi.spyOn(Shift, "findById").mockResolvedValueOnce(mockShift as any);

      // Stock deduction fails
      vi.spyOn(Product, "updateOne").mockResolvedValueOnce({ matchedCount: 0 } as any);

      const request: POSSaleRequest = {
        shiftId: "shift-123",
        items: [{ productId: "p1", name: "Headphones", price: 100, quantity: 5 }],
        paymentMethod: "cash",
      };

      const result = await processPOSSale(request);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/stock/i);
    });

    it("should successfully process POS cash sale with discounts and update shift & order", async () => {
      const mockShift = {
        _id: "shift-123",
        status: "open",
        totalCashSales: 500,
        expectedCash: 1000,
        totalDiscountsGiven: 0,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Shift, "findById").mockResolvedValueOnce(mockShift as any);

      // Inventory deduction succeeds
      vi.spyOn(Product, "updateOne").mockResolvedValue({ matchedCount: 1, modifiedCount: 1 } as any);

      // Order creation spy
      const mockOrderSave = vi.fn().mockImplementation(function (this: any) {
        this._id = "order-777";
        return Promise.resolve(this);
      });
      vi.spyOn(Order.prototype, "save").mockImplementation(mockOrderSave);

      const request: POSSaleRequest = {
        shiftId: "shift-123",
        items: [
          {
            productId: "p1",
            name: "Sneakers",
            price: 200,
            basePrice: 200,
            quantity: 2,
            discountType: "percentage",
            discountValue: 10, // 200 * (1 - 0.10) = 180 unit price, subtotal = 360
          },
        ],
        paymentMethod: "cash",
        orderDiscount: {
          type: "fixed",
          value: 10, // 360 - 10 = 350 final total
        },
        customerInfo: {
          name: "Karim Hassan",
          phone: "01012345678",
        },
      };

      const result = await processPOSSale(request);

      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
      expect(typeof result.orderId).toBe("string");
      expect(result.finalTotal).toBe(350);
      expect(result.receiptText).toContain("Karim Hassan");
      expect(result.receiptText).toContain("350.00");
      expect(result.whatsappUrl).toContain("wa.me/01012345678");

      // Verify Shift updates
      expect(mockShift.totalCashSales).toBe(850); // 500 + 350
      expect(mockShift.expectedCash).toBe(1350); // 1000 + 350
      expect(mockShift.totalDiscountsGiven).toBe(50); // originalTotal 400 - finalTotal 350 = 50
      expect(mockShift.save).toHaveBeenCalled();
    });

    it("should update correct sales counters for card/digital payment methods", async () => {
      const mockShift = {
        _id: "shift-123",
        status: "open",
        totalCardSales: 100,
        totalInstaPaySales: 50,
        totalVodafoneSales: 20,
        expectedCash: 500,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Shift, "findById").mockResolvedValue(mockShift as any);
      vi.spyOn(Product, "updateOne").mockResolvedValue({ matchedCount: 1 } as any);
      vi.spyOn(Order.prototype, "save").mockImplementation(function (this: any) {
        this._id = "order-888";
        return Promise.resolve(this);
      });

      // Test Card
      await processPOSSale({
        shiftId: "shift-123",
        items: [{ productId: "p1", name: "Shirt", price: 100, quantity: 1 }],
        paymentMethod: "card",
      });
      expect(mockShift.totalCardSales).toBe(200);

      // Test InstaPay
      await processPOSSale({
        shiftId: "shift-123",
        items: [{ productId: "p1", name: "Shirt", price: 50, quantity: 1 }],
        paymentMethod: "instapay",
      });
      expect(mockShift.totalInstaPaySales).toBe(100);

      // Test Vodafone Cash
      await processPOSSale({
        shiftId: "shift-123",
        items: [{ productId: "p1", name: "Shirt", price: 30, quantity: 1 }],
        paymentMethod: "vodafone_cash",
      });
      expect(mockShift.totalVodafoneSales).toBe(50);

      // Expected cash should NOT change for non-cash sales
      expect(mockShift.expectedCash).toBe(500);
    });
  });

  describe("ReturnsRefundEngine - processReturn", () => {
    it("should fail if active shift is missing or closed", async () => {
      vi.spyOn(Shift, "findById").mockResolvedValueOnce(null as any);

      const result = await processReturn({
        orderId: "order-123",
        shiftId: "shift-999",
        items: [{ productId: "p1", quantity: 1 }],
        paymentMethod: "cash",
        restockToInventory: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/active shift/i);
    });

    it("should fail if order is not found", async () => {
      vi.spyOn(Shift, "findById").mockResolvedValueOnce({ _id: "s1", status: "open" } as any);
      vi.spyOn(Order, "findById").mockResolvedValueOnce(null as any);

      const result = await processReturn({
        orderId: "order-missing",
        shiftId: "s1",
        items: [{ productId: "p1", quantity: 1 }],
        paymentMethod: "cash",
        restockToInventory: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/order not found/i);
    });

    it("should process partial return with restock and update shift & order", async () => {
      const mockShift = {
        _id: "shift-1",
        status: "open",
        totalCashRefunds: 0,
        expectedCash: 1000,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Shift, "findById").mockResolvedValueOnce(mockShift as any);

      const mockOrder = {
        _id: "order-100",
        items: [
          { productId: "p1", name: "Jacket", price: 200, quantity: 2 },
          { productId: "p2", name: "Cap", price: 50, quantity: 1 },
        ],
        totalPrice: 450,
        status: "delivered",
        returns: [] as any[],
        totalRefunded: 0,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Order, "findById").mockResolvedValueOnce(mockOrder as any);

      const productUpdateSpy = vi.spyOn(Product, "updateOne").mockResolvedValue({ matchedCount: 1 } as any);

      const request: ReturnSaleRequest = {
        orderId: "order-100",
        shiftId: "shift-1",
        items: [{ productId: "p1", quantity: 1 }],
        paymentMethod: "cash",
        restockToInventory: true,
        reason: "Customer changed mind",
      };

      const result = await processReturn(request);

      expect(result.success).toBe(true);
      expect(result.totalRefunded).toBe(200);
      expect(result.updatedOrderStatus).toBe("partially_returned");
      expect(result.receiptText).toContain("RETURN RECEIPT");

      // Verify Restock call
      expect(productUpdateSpy).toHaveBeenCalledWith(
        { _id: "p1" },
        { $inc: { stock: 1 } }
      );

      // Verify Order updates
      expect(mockOrder.status).toBe("partially_returned");
      expect(mockOrder.totalRefunded).toBe(200);
      expect(mockOrder.returns.length).toBe(1);
      expect(mockOrder.returns[0].reason).toBe("Customer changed mind");

      // Verify Shift updates
      expect(mockShift.totalCashRefunds).toBe(200);
      expect(mockShift.expectedCash).toBe(800); // 1000 - 200
    });

    it("should process full return without restock and update digital refund counter", async () => {
      const mockShift = {
        _id: "shift-1",
        status: "open",
        totalDigitalRefunds: 50,
        expectedCash: 1000,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Shift, "findById").mockResolvedValueOnce(mockShift as any);

      const mockOrder = {
        _id: "order-200",
        items: [
          { productId: "p1", name: "Jacket", price: 100, quantity: 1 },
        ],
        totalPrice: 100,
        status: "delivered",
        returns: [],
        totalRefunded: 0,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Order, "findById").mockResolvedValueOnce(mockOrder as any);

      const productUpdateSpy = vi.spyOn(Product, "updateOne");

      const request: ReturnSaleRequest = {
        orderId: "order-200",
        shiftId: "shift-1",
        items: [{ productId: "p1", quantity: 1 }],
        paymentMethod: "digital",
        restockToInventory: false,
      };

      const result = await processReturn(request);

      expect(result.success).toBe(true);
      expect(result.totalRefunded).toBe(100);
      expect(result.updatedOrderStatus).toBe("returned");

      // Verify restock was NOT called because restockToInventory is false
      expect(productUpdateSpy).not.toHaveBeenCalled();

      // Verify Shift updates
      expect(mockShift.totalDigitalRefunds).toBe(150); // 50 + 100
      expect(mockShift.expectedCash).toBe(1000); // untouched for digital refund
    });
  });
});
