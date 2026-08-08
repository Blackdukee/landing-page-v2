# Task 4: Order Model Extension, Discount Stacking Modal & Arabic WhatsApp Generator

**Files:**
- Modify: `src/models/Order.ts`
- Modify: `src/app/api/orders/[id]/route.ts`
- Modify: `src/app/admin/orders/page.tsx`

**Requirements & Global Constraints:**

## Step 1: Extend `src/models/Order.ts` with `discountDetails`

Add new interfaces and schema fields:

```typescript
export interface IOrderItemAdjustment {
  productId: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  stacked: boolean;          // true = apply on already-discounted priorPrice; false = apply on basePrice
  basePrice: number;         // original catalog price
  priorPrice: number;        // price before this admin adjustment (may be a Daily Offer price)
  finalPrice: number;        // calculated final price after admin adjustment
}

export interface IOrderDiscountDetails {
  itemAdjustments: IOrderItemAdjustment[];
  orderDiscountType?: "percentage" | "fixed" | null;
  orderDiscountValue?: number;
  originalTotal: number;     // subtotal before any admin adjustments
  finalTotal: number;        // final payable total after all adjustments
}

// In IOrder:
discountDetails?: IOrderDiscountDetails;
```

Add to `OrderSchema`:
```typescript
discountDetails: {
  itemAdjustments: [{ ... }],
  orderDiscountType: { type: String, enum: ["percentage", "fixed"], default: null },
  orderDiscountValue: { type: Number },
  originalTotal: { type: Number },
  finalTotal: { type: Number },
}
```

## Step 2: Update `src/app/api/orders/[id]/route.ts`

In the `PUT` handler, accept and persist:
```typescript
{ status, totalPrice, discountDetails }
```
If `discountDetails` is provided in the request body, update `order.discountDetails = discountDetails` and `order.totalPrice = discountDetails.finalTotal`.

## Step 3: Build Discount & Stacking Modal in `src/app/admin/orders/page.tsx`

### New State Required:
- `discountModalOrder: Order | null` — the order being adjusted
- `itemAdjustments: Record<string, { discountType: "percentage"|"fixed"; discountValue: number; stacked: boolean; }>` — per-item adjustments keyed by productId
- `orderDiscountType: "percentage" | "fixed"` — order-level discount type
- `orderDiscountValue: number` — order-level discount value
- `savingDiscount: boolean` — loading state

### Calculation Logic (client-side, derived from state):

For each item:
- `basePrice` = `item.price` (the price stored on the order)
- `priorPrice` = basePrice (we display it as-is; the Daily Offer price is already baked in)
- If `adjustment` exists for this item:
  - `stacked === true`: apply discount on `priorPrice`
  - `stacked === false`: apply discount on `basePrice`
  - Percentage: `finalPrice = sourcePriceToUse * (1 - discountValue / 100)`
  - Fixed: `finalPrice = Math.max(0, sourcePriceToUse - discountValue)`
- Else: `finalPrice = basePrice`
- `itemSubtotal = finalPrice * item.quantity`

`subtotalAfterItems = sum of itemSubtotals`

Order-level discount:
- Percentage: `finalTotal = subtotalAfterItems * (1 - orderDiscountValue / 100)`
- Fixed: `finalTotal = Math.max(0, subtotalAfterItems - orderDiscountValue)`

### Modal UI:
- Triggered by a "Apply Discount & Confirm" button on each order row.
- Modal contains:
  1. **Items table**: for each item, show name × qty, original price, a % / EGP toggle switch, discount value input, a "Stack with existing discount" checkbox (only shown if item has any existing offer — we always show it since we don't track that from API; just show it always). Show calculated final price per unit.
  2. **Order-level discount**: a % / EGP toggle + numeric input.
  3. **Live summary**:
     - "إجمالي الطلب الأصلي: X ج.م"
     - "إجمالي الخصومات: -Y ج.م"
     - "المبلغ النهائي للدفع: Z ج.م"
  4. **Two action buttons** (both min-h-[44px]):
     - "حفظ وتأكيد الطلب" → PUT /api/orders/[id] with { status: "confirmed", discountDetails, totalPrice: finalTotal }
     - "نسخ رسالة واتساب" → generates Arabic message and copies to clipboard using navigator.clipboard.writeText()

### Arabic WhatsApp Message Template:
```
مرحباً {customerInfo.name}! 🛍️
تم تأكيد طلبك بنجاح من متجر {websiteName}.

📋 تفاصيل الأصناف:
{items: - {name} × {qty}: {finalPrice} ج.م}

💰 تفاصيل الحساب:
• إجمالي المنتجات: {originalTotal} ج.م
• الخصم المطبق: {totalSavings} ج.م
• المبلغ النهائي للدفع: {finalTotal} ج.م

📍 عنوان التوصيل: {address}
📱 رقم الهاتف: {phone}

🚚 جاري تجهيز الطلب وسنتواصل معك فور الشحن. شكراً لتسوقك معنا!
```

Use `useSiteSettings()` to get `websiteName` for the WhatsApp message.

## Verification:
- Run `npx tsc --noEmit` (0 errors required).
- Commit with message: `feat(orders): implement admin order discount stacking modal and Arabic WhatsApp confirmation`.
