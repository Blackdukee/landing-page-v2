import Shift from "../../models/Shift";
import Order from "../../models/Order";
import { restockStockAtomic, StockItem } from "./InventorySyncEngine";

export interface ReturnItemInput {
  productId: string;
  quantity: number;
}

export interface ReturnSaleRequest {
  orderId: string;
  shiftId: string;
  items: ReturnItemInput[];
  paymentMethod: "cash" | "digital";
  restockToInventory: boolean;
  reason?: string;
}

export interface ReturnSaleResult {
  success: boolean;
  returnId?: string;
  totalRefunded?: number;
  updatedOrderStatus?: "returned" | "partially_returned";
  receiptText?: string;
  error?: string;
}

/**
 * Processes a POS Return / Refund transaction:
 * 1. Validates active shift status ("open").
 * 2. Fetches target order and validates item return quantities against ordered/previously returned items.
 * 3. Calculates refund amounts based on net unit selling prices.
 * 4. If restockToInventory is true, atomically restocks items back to product inventory.
 * 5. Updates order status to "returned" (full) or "partially_returned", saving transaction record.
 * 6. Updates active shift refund totals (totalCashRefunds, totalDigitalRefunds, expectedCash).
 * 7. Returns return details summary and formatted return receipt text.
 */
export async function processReturn(request: ReturnSaleRequest): Promise<ReturnSaleResult> {
  // 1. Validate active shift
  const shift = await Shift.findById(request.shiftId);
  if (!shift || shift.status !== "open") {
    return {
      success: false,
      error: "Active shift not found or closed",
    };
  }

  // 2. Fetch target order
  const order = await Order.findById(request.orderId);
  if (!order) {
    return {
      success: false,
      error: "Order not found",
    };
  }

  if (!request.items || request.items.length === 0) {
    return {
      success: false,
      error: "Return items list cannot be empty",
    };
  }

  // Calculate previously returned quantities per product across existing return records
  const previouslyReturnedMap = new Map<string, number>();
  if (order.returns && order.returns.length > 0) {
    for (const record of order.returns) {
      for (const item of record.items) {
        const prev = previouslyReturnedMap.get(item.productId) || 0;
        previouslyReturnedMap.set(item.productId, prev + item.quantity);
      }
    }
  }

  // Calculate order items subtotal to ratio order-level discounts if any
  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountRatio = itemsSubtotal > 0 ? order.totalPrice / itemsSubtotal : 1;

  let totalRefunded = 0;
  const returnRecordItems: Array<{
    productId: string;
    name: string;
    quantity: number;
    refundAmount: number;
  }> = [];

  // Validate items return quantity and calculate line item refund amounts
  for (const returnItem of request.items) {
    const itemInOrder = order.items.find((i) => i.productId === returnItem.productId);
    if (!itemInOrder) {
      return {
        success: false,
        error: `Product ${returnItem.productId} was not part of this order`,
      };
    }

    const prevReturnedQty = previouslyReturnedMap.get(returnItem.productId) || 0;
    const maxReturnableQty = itemInOrder.quantity - prevReturnedQty;

    if (returnItem.quantity <= 0 || returnItem.quantity > maxReturnableQty) {
      return {
        success: false,
        error: `Invalid return quantity for product ${itemInOrder.name || returnItem.productId}. Max returnable: ${maxReturnableQty}`,
      };
    }

    const unitRefundPrice = itemInOrder.price * discountRatio;
    const lineRefundAmount = unitRefundPrice * returnItem.quantity;
    totalRefunded += lineRefundAmount;

    returnRecordItems.push({
      productId: returnItem.productId,
      name: itemInOrder.name,
      quantity: returnItem.quantity,
      refundAmount: lineRefundAmount,
    });
  }

  // 3. Atomically restock to inventory if requested
  if (request.restockToInventory) {
    const stockItems: StockItem[] = request.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    await restockStockAtomic(stockItems);
  }

  // 4. Update Order Document & calculate updated order status
  const returnId = `RET-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const returnRecord = {
    returnId,
    shiftId: request.shiftId,
    items: returnRecordItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      refundAmount: item.refundAmount,
    })),
    totalRefunded,
    paymentMethod: request.paymentMethod,
    restockToInventory: request.restockToInventory,
    reason: request.reason || "",
    createdAt: new Date(),
  };

  if (!order.returns) {
    order.returns = [];
  }
  order.returns.push(returnRecord);

  order.totalRefunded = (order.totalRefunded || 0) + totalRefunded;

  // Check overall returned status across all items
  const totalItemsOrdered = order.items.reduce((sum, i) => sum + i.quantity, 0);
  let totalItemsReturnedOverall = 0;
  for (const record of order.returns) {
    for (const item of record.items) {
      totalItemsReturnedOverall += item.quantity;
    }
  }

  const updatedOrderStatus: "returned" | "partially_returned" =
    totalItemsReturnedOverall >= totalItemsOrdered ? "returned" : "partially_returned";

  order.status = updatedOrderStatus;
  await order.save();

  // 5. Update Shift refund counters
  if (request.paymentMethod === "cash") {
    shift.totalCashRefunds += totalRefunded;
    shift.expectedCash = Math.max(0, shift.expectedCash - totalRefunded);
  } else {
    shift.totalDigitalRefunds += totalRefunded;
  }
  await shift.save();

  // 6. Generate formatted text receipt
  const formattedDate = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });
  const receiptLines = [
    "=== CASHAIR RETURN RECEIPT ===",
    `Return ID: ${returnId}`,
    `Order ID: ${order._id}`,
    `Date: ${formattedDate}`,
    `Refund Method: ${request.paymentMethod.toUpperCase()}`,
    `Restocked to Stock: ${request.restockToInventory ? "Yes" : "No"}`,
    "---------------------------",
    ...returnRecordItems.map(
      (item) => `${item.name} x${item.quantity} - Refund: EGP ${item.refundAmount.toFixed(2)}`
    ),
    "---------------------------",
    `Total Refunded: EGP ${totalRefunded.toFixed(2)}`,
    `Order Status: ${updatedOrderStatus}`,
    "===========================",
  ];

  const receiptText = receiptLines.join("\n");

  return {
    success: true,
    returnId,
    totalRefunded,
    updatedOrderStatus,
    receiptText,
  };
}

/**
 * Safely cancels/voids a return record:
 * 1. Locates order containing returnId.
 * 2. Reverses shift refund counters (totalCashRefunds, expectedCash).
 * 3. Reverses stock restock if restockToInventory was true (deducts stock back out of inventory).
 * 4. Removes return record from order.returns array and updates order status.
 */
export async function cancelReturnRecord(returnId: string): Promise<{ success: boolean; error?: string }> {
  let order = await Order.findOne({ "returns.returnId": returnId });
  if (!order) {
    order = await Order.findById(returnId);
  }

  if (!order || !order.returns || order.returns.length === 0) {
    return { success: false, error: "Return record not found" };
  }

  const retIdx = order.returns.findIndex(
    (r: any) => r.returnId === returnId || r._id?.toString() === returnId
  );

  if (retIdx === -1) {
    return { success: false, error: "Return record not found in order" };
  }

  const retRecord = order.returns[retIdx];

  // 1. Reversal of shift financial counters if shift exists
  if (retRecord.shiftId) {
    const shift = await Shift.findById(retRecord.shiftId);
    if (shift) {
      if (retRecord.paymentMethod === "cash") {
        shift.totalCashRefunds = Math.max(0, shift.totalCashRefunds - (retRecord.totalRefunded || 0));
        shift.expectedCash += retRecord.totalRefunded || 0;
      } else {
        shift.totalDigitalRefunds = Math.max(0, shift.totalDigitalRefunds - (retRecord.totalRefunded || 0));
      }
      await shift.save();
    }
  }

  // 2. Reversal of inventory stock restock if restockToInventory was true
  if (retRecord.restockToInventory && retRecord.items && retRecord.items.length > 0) {
    const Product = (await import("../../models/Product")).default;
    for (const item of retRecord.items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } }
      );
    }
  }

  // 3. Remove return record from order
  order.returns.splice(retIdx, 1);
  order.totalRefunded = Math.max(0, (order.totalRefunded || 0) - (retRecord.totalRefunded || 0));

  if (order.returns.length === 0) {
    if (order.status === "returned" || order.status === "partially_returned") {
      order.status = "delivered";
    }
  }

  await order.save();
  return { success: true };
}
