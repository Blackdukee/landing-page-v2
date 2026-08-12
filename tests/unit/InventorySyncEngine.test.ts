import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Product from "../../src/models/Product";
import { deductStockAtomic, restockStockAtomic } from "../../src/modules/cashair/InventorySyncEngine";

describe("InventorySyncEngine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("deductStockAtomic", () => {
    it("should successfully deduct stock atomically for all items when stock is sufficient and detect low stock", async () => {
      const items = [
        { productId: "507f1f77bcf86cd799439011", quantity: 2 },
        { productId: "507f1f77bcf86cd799439012", quantity: 5 },
      ];

      const updateOneSpy = vi
        .spyOn(Product, "updateOne")
        .mockResolvedValue({ matchedCount: 1, modifiedCount: 1, acknowledged: true } as any);

      vi.spyOn(Product, "findById")
        .mockReturnValueOnce({
          lean: vi.fn().mockResolvedValue({
            _id: "507f1f77bcf86cd799439011",
            name: "Product 1",
            stock: 3,
          }),
        } as any)
        .mockReturnValueOnce({
          lean: vi.fn().mockResolvedValue({
            _id: "507f1f77bcf86cd799439012",
            name: "Product 2",
            stock: 15,
          }),
        } as any);

      const result = await deductStockAtomic(items);

      expect(result.success).toBe(true);
      expect(result.lowStockAlerts).toEqual([
        {
          productId: "507f1f77bcf86cd799439011",
          name: "Product 1",
          remainingStock: 3,
          isOutOfStock: false,
        },
      ]);
      expect(updateOneSpy).toHaveBeenCalledTimes(2);
    });

    it("should rollback previously deducted items and return failedProductId when stock is insufficient", async () => {
      const items = [
        { productId: "prod-1", quantity: 3 },
        { productId: "prod-2", quantity: 10 },
        { productId: "prod-3", quantity: 1 },
      ];

      const updateOneSpy = vi.spyOn(Product, "updateOne");

      // First item succeeds, second item fails (matchedCount: 0)
      updateOneSpy.mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1, acknowledged: true } as any);
      updateOneSpy.mockResolvedValueOnce({ matchedCount: 0, modifiedCount: 0, acknowledged: true } as any);
      updateOneSpy.mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1, acknowledged: true } as any); // rollback call

      const result = await deductStockAtomic(items);

      expect(result).toMatchObject({ success: false, failedProductId: "prod-2" });

      // Total calls: 1st deduction, 2nd deduction (failed), 1st item rollback
      expect(updateOneSpy).toHaveBeenCalledTimes(3);
    });

    it("should handle empty items array gracefully", async () => {
      const updateOneSpy = vi.spyOn(Product, "updateOne");
      const result = await deductStockAtomic([]);

      expect(result).toEqual({ success: true, lowStockAlerts: [] });
      expect(updateOneSpy).not.toHaveBeenCalled();
    });
  });

  describe("restockStockAtomic", () => {
    it("should atomically restock items and return true", async () => {
      const items = [
        { productId: "prod-1", quantity: 3 },
        { productId: "prod-2", quantity: 5 },
      ];

      const updateOneSpy = vi
        .spyOn(Product, "updateOne")
        .mockResolvedValue({ matchedCount: 1, modifiedCount: 1, acknowledged: true } as any);

      const result = await restockStockAtomic(items);

      expect(result).toBe(true);
      expect(updateOneSpy).toHaveBeenCalledTimes(2);

      expect(updateOneSpy).toHaveBeenNthCalledWith(
        1,
        { _id: "prod-1" },
        { $inc: { stock: 3 } }
      );
      expect(updateOneSpy).toHaveBeenNthCalledWith(
        2,
        { _id: "prod-2" },
        { $inc: { stock: 5 } }
      );
    });
  });
});
