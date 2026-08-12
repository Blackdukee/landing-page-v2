import mongoose from "mongoose";
import Product from "../../models/Product";

export const LOW_STOCK_THRESHOLD = 5;

export interface StockItem {
  productId: string;
  quantity: number;
}

export interface LowStockAlert {
  productId: string;
  name: string;
  remainingStock: number;
  isOutOfStock: boolean;
}

export interface DeductStockResult {
  success: boolean;
  failedProductId?: string;
  failedProductName?: string;
  availableStock?: number;
  error?: string;
  lowStockAlerts?: LowStockAlert[];
}

/**
 * Deducts stock atomically for an array of items.
 * If any item deduction fails (stock < quantity or product missing), previously updated items are rolled back.
 * Returns low stock alerts for any items whose remaining stock is <= LOW_STOCK_THRESHOLD.
 */
export async function deductStockAtomic(
  items: StockItem[],
  lowStockThreshold: number = LOW_STOCK_THRESHOLD
): Promise<DeductStockResult> {
  const updatedItems: StockItem[] = [];
  const lowStockAlerts: LowStockAlert[] = [];

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) continue;

    const res = await Product.updateOne(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );

    if (res.matchedCount === 0) {
      // Rollback previously deducted items
      for (const prevItem of updatedItems) {
        await Product.updateOne(
          { _id: prevItem.productId },
          { $inc: { stock: prevItem.quantity } }
        );
      }

      // Fetch failed product details for rich user message
      const product = mongoose.Types.ObjectId.isValid(item.productId)
        ? await Product.findById(item.productId).lean()
        : await Product.findOne({ _id: item.productId }).lean().catch(() => null);
      const productName = product?.name || "المنتج المطلوب";
      const availableStock = product?.stock ?? 0;
      const errorMsg =
        availableStock > 0
          ? `عذراً، الكمية المتاحة من "${productName}" هي ${availableStock} فقط.`
          : `عذراً، المنتج "${productName}" نفد من المخزن بالكامل.`;

      return {
        success: false,
        failedProductId: item.productId,
        failedProductName: productName,
        availableStock,
        error: errorMsg,
      };
    }

    updatedItems.push(item);

    // Fetch remaining stock to check for low stock warning
    try {
      const product = mongoose.Types.ObjectId.isValid(item.productId)
        ? await Product.findById(item.productId).lean()
        : null;

      if (product && typeof product.stock === "number" && product.stock <= lowStockThreshold) {
        lowStockAlerts.push({
          productId: product._id.toString(),
          name: product.name || "منتج",
          remainingStock: product.stock,
          isOutOfStock: product.stock <= 0,
        });
      }
    } catch {
      // Non-fatal if product lookup fails
    }
  }

  return { success: true, lowStockAlerts };
}

/**
 * Restocks stock atomically for an array of items.
 */
export async function restockStockAtomic(items: StockItem[]): Promise<boolean> {
  for (const item of items) {
    await Product.updateOne(
      { _id: item.productId },
      { $inc: { stock: item.quantity } }
    );
  }
  return true;
}
