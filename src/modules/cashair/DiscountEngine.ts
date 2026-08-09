export interface DiscountItemInput {
  basePrice: number;
  priorPrice: number;
  quantity: number;
  newDiscountType?: "percentage" | "fixed";
  newDiscountValue?: number;
  stacked?: boolean;
}

export interface OrderDiscountInput {
  type: "percentage" | "fixed";
  value: number;
}

export interface POSDiscountResult {
  originalTotal: number;
  itemsTotal: number;
  totalDiscount: number;
  finalTotal: number;
  itemAdjustments: Array<{
    finalUnitPrice: number;
    subtotal: number;
  }>;
}

/**
 * Calculates POS discounts for item-level (stacked or unstacked) and order-level cart discounts.
 *
 * Math rules:
 * - Stacked item discount:
 *   P_final = P_prior * (1 - D/100) or P_prior - D
 * - Unstacked item discount:
 *   P_final = P_base * (1 - D/100) or P_base - D
 * - Order discount:
 *   Applies percentage or fixed discount on whole cart itemsTotal.
 * - Total discount:
 *   originalTotal - finalTotal (clamped >= 0).
 */
export function calculatePOSDiscounts(
  items: DiscountItemInput[],
  orderDiscount?: OrderDiscountInput
): POSDiscountResult {
  let originalTotal = 0;
  let itemsTotal = 0;

  const itemAdjustments = items.map((item) => {
    const baseTotal = item.basePrice * item.quantity;
    originalTotal += baseTotal;

    let finalUnitPrice = item.priorPrice;
    if (item.newDiscountValue && item.newDiscountValue > 0) {
      const startingPrice = item.stacked ? item.priorPrice : item.basePrice;
      if (item.newDiscountType === "percentage") {
        finalUnitPrice = startingPrice * (1 - item.newDiscountValue / 100);
      } else {
        finalUnitPrice = Math.max(0, startingPrice - item.newDiscountValue);
      }
    }

    finalUnitPrice = Math.max(0, finalUnitPrice);
    const subtotal = finalUnitPrice * item.quantity;
    itemsTotal += subtotal;

    return {
      finalUnitPrice,
      subtotal,
    };
  });

  let finalTotal = itemsTotal;
  if (orderDiscount && orderDiscount.value > 0) {
    if (orderDiscount.type === "percentage") {
      finalTotal = itemsTotal * (1 - orderDiscount.value / 100);
    } else {
      finalTotal = Math.max(0, itemsTotal - orderDiscount.value);
    }
  }

  finalTotal = Math.max(0, finalTotal);
  const totalDiscount = Math.max(0, originalTotal - finalTotal);

  return {
    originalTotal,
    itemsTotal,
    totalDiscount,
    finalTotal,
    itemAdjustments,
  };
}
