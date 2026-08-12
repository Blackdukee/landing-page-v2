import {
  deductStockAtomic,
  restockStockAtomic,
  StockItem,
  DeductStockResult,
  LowStockAlert,
  LOW_STOCK_THRESHOLD,
} from "../cashair/InventorySyncEngine";

export type { StockItem, DeductStockResult, LowStockAlert };
export { LOW_STOCK_THRESHOLD };

/**
 * Deep Inventory Engine Module:
 * Provides a unified, atomic interface for inventory stock reservation
 * and stock restoration across Storefront Orders, POS Sales, and Order Returns.
 */
export const InventoryEngine = {
  /**
   * Atomically reserves stock for a list of items.
   * If any item lacks sufficient stock, all previous reservations in the batch are rolled back.
   */
  reserveStock: async (items: StockItem[]): Promise<DeductStockResult> => {
    return deductStockAtomic(items);
  },

  /**
   * Atomically releases (restores) stock for a list of items when orders are cancelled or returned.
   */
  releaseStock: async (items: StockItem[]): Promise<boolean> => {
    return restockStockAtomic(items);
  },
};
