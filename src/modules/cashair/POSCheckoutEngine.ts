import Shift from "../../models/Shift";
import Order from "../../models/Order";
import { InventoryEngine, StockItem } from "../inventory/InventoryEngine";
import { calculatePOSDiscounts, DiscountItemInput, OrderDiscountInput } from "./DiscountEngine";

export interface POSCheckoutItem {
  productId: string;
  name: string;
  price: number;
  basePrice?: number;
  quantity: number;
  image?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  stacked?: boolean;
}

export interface POSSaleRequest {
  shiftId: string;
  items: POSCheckoutItem[];
  paymentMethod: "cash" | "instapay" | "vodafone_cash" | "card";
  customerInfo?: {
    name?: string;
    phone?: string;
    address?: string;
    email?: string;
    notes?: string;
  };
  orderDiscount?: OrderDiscountInput;
}

export interface POSSaleResult {
  success: boolean;
  orderId?: string;
  finalTotal?: number;
  receiptText?: string;
  whatsappUrl?: string;
  error?: string;
}

/**
 * Processes a POS sale:
 * 1. Validates active shift status ("open").
 * 2. Deducts inventory stock atomically.
 * 3. Calculates item and cart-level discounts.
 * 4. Creates Order document with source: "pos" and status: "delivered".
 * 5. Increments active shift sales counters (cash, instapay, vodafone, card, expected cash, discounts).
 * 6. Returns order summary, formatted receipt, and WhatsApp sharing link.
 */
export async function processPOSSale(request: POSSaleRequest): Promise<POSSaleResult> {
  // 1. Validate active shift
  const shift = await Shift.findById(request.shiftId);
  if (!shift || shift.status !== "open") {
    return {
      success: false,
      error: "Active shift not found or closed",
    };
  }

  if (!request.items || request.items.length === 0) {
    return {
      success: false,
      error: "Cart cannot be empty",
    };
  }

  // 2. Atomically deduct inventory
  const stockItems: StockItem[] = request.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  const stockDeductions = await InventoryEngine.reserveStock(stockItems);
  if (!stockDeductions.success) {
    return {
      success: false,
      error: `Insufficient stock for product ${stockDeductions.failedProductId || "unknown"}`,
    };
  }

  // 3. Calculate discounts
  const discountInputs: DiscountItemInput[] = request.items.map((item) => ({
    basePrice: item.basePrice ?? item.price,
    priorPrice: item.price,
    quantity: item.quantity,
    newDiscountType: item.discountType,
    newDiscountValue: item.discountValue,
    stacked: item.stacked ?? true,
  }));

  const discountResult = calculatePOSDiscounts(discountInputs, request.orderDiscount);

  // 4. Create Order Document
  const orderItems = request.items.map((item, idx) => ({
    productId: item.productId,
    name: item.name,
    price: discountResult.itemAdjustments[idx].finalUnitPrice,
    quantity: item.quantity,
    image: item.image || "",
  }));

  const customerName = request.customerInfo?.name || "Walk-in Customer";
  const customerPhone = request.customerInfo?.phone || "0000000000";
  const customerAddress = request.customerInfo?.address || "In-Store POS";
  const customerEmail = request.customerInfo?.email || "";
  const customerNotes = request.customerInfo?.notes || "";

  const order = new Order({
    customerInfo: {
      name: customerName,
      address: customerAddress,
      phone: customerPhone,
      email: customerEmail,
      notes: customerNotes,
    },
    items: orderItems,
    totalPrice: discountResult.finalTotal,
    discountDetails: {
      itemAdjustments: request.items.map((item, idx) => ({
        productId: item.productId,
        discountType: item.discountType,
        discountValue: item.discountValue || 0,
        stacked: item.stacked ?? true,
        basePrice: item.basePrice ?? item.price,
        priorPrice: item.price,
        finalPrice: discountResult.itemAdjustments[idx].finalUnitPrice,
      })),
      orderDiscountType: request.orderDiscount?.type || null,
      orderDiscountValue: request.orderDiscount?.value || 0,
      originalTotal: discountResult.originalTotal,
      finalTotal: discountResult.finalTotal,
    },
    status: "delivered",
    source: "pos",
    paymentMethod: request.paymentMethod,
    shiftId: request.shiftId,
  });

  await order.save();

  // 5. Increment active shift sales counters
  const finalTotal = discountResult.finalTotal;
  switch (request.paymentMethod) {
    case "cash":
      shift.totalCashSales += finalTotal;
      shift.expectedCash += finalTotal;
      break;
    case "instapay":
      shift.totalInstaPaySales += finalTotal;
      break;
    case "vodafone_cash":
      shift.totalVodafoneSales += finalTotal;
      break;
    case "card":
      shift.totalCardSales += finalTotal;
      break;
  }

  if (discountResult.totalDiscount > 0) {
    shift.totalDiscountsGiven += discountResult.totalDiscount;
  }

  await shift.save();

  // 6. Generate formatted text receipt & WhatsApp URL
  const formattedDate = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });
  const receiptLines = [
    "=== CASHAIR POS RECEIPT ===",
    `Order ID: ${order._id}`,
    `Customer: ${customerName}`,
    `Date: ${formattedDate}`,
    `Payment Method: ${request.paymentMethod.toUpperCase()}`,
    "---------------------------",
    ...orderItems.map(
      (item) => `${item.name} x${item.quantity} - EGP ${(item.price * item.quantity).toFixed(2)}`
    ),
    "---------------------------",
    `Subtotal: EGP ${discountResult.originalTotal.toFixed(2)}`,
    `Discount: EGP ${discountResult.totalDiscount.toFixed(2)}`,
    `Total Paid: EGP ${finalTotal.toFixed(2)}`,
    "===========================",
    "Thank you for shopping with CashAir!",
  ];

  const receiptText = receiptLines.join("\n");
  const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptText)}`
    : `https://wa.me/?text=${encodeURIComponent(receiptText)}`;

  return {
    success: true,
    orderId: order._id.toString(),
    finalTotal,
    receiptText,
    whatsappUrl,
  };
}
