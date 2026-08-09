import mongoose from "mongoose";
import Product from "../../models/Product";

export interface StockItem {
  productId: string;
  quantity: number;
}

export interface DeductStockResult {
  success: boolean;
  failedProductId?: string;
  failedProductName?: string;
  availableStock?: number;
  error?: string;
}

/**
 * Deducts stock atomically for an array of items.
 * If any item deduction fails (matchedCount === 0), previously updated items are rolled back.
 */
export async function deductStockAtomic(items: StockItem[]): Promise<DeductStockResult> {
  const updatedItems: StockItem[] = [];

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
  }

  return { success: true };
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
