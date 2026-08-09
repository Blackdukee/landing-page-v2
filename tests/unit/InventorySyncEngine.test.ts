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
    it("should successfully deduct stock atomically for all items when stock is sufficient", async () => {
      const items = [
        { productId: "prod-1", quantity: 2 },
        { productId: "prod-2", quantity: 5 },
      ];

      const updateOneSpy = vi
        .spyOn(Product, "updateOne")
        .mockResolvedValue({ matchedCount: 1, modifiedCount: 1, acknowledged: true } as any);

      const result = await deductStockAtomic(items);

      expect(result).toEqual({ success: true });
      expect(updateOneSpy).toHaveBeenCalledTimes(2);

      expect(updateOneSpy).toHaveBeenNthCalledWith(
        1,
        { _id: "prod-1", stock: { $gte: 2 } },
        { $inc: { stock: -2 } }
      );
      expect(updateOneSpy).toHaveBeenNthCalledWith(
        2,
        { _id: "prod-2", stock: { $gte: 5 } },
        { $inc: { stock: -5 } }
      );
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

      // Verify 1st item deduction
      expect(updateOneSpy).toHaveBeenNthCalledWith(
        1,
        { _id: "prod-1", stock: { $gte: 3 } },
        { $inc: { stock: -3 } }
      );

      // Verify 2nd item deduction attempt
      expect(updateOneSpy).toHaveBeenNthCalledWith(
        2,
        { _id: "prod-2", stock: { $gte: 10 } },
        { $inc: { stock: -10 } }
      );

      // Verify rollback for 1st item
      expect(updateOneSpy).toHaveBeenNthCalledWith(
        3,
        { _id: "prod-1" },
        { $inc: { stock: 3 } }
      );
    });

    it("should handle empty items array gracefully", async () => {
      const updateOneSpy = vi.spyOn(Product, "updateOne");
      const result = await deductStockAtomic([]);

      expect(result).toEqual({ success: true });
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
