# Daily Offers Feature Specification & Design

## 1. Overview
The **Daily Offers** feature allows store administrators to curate special time-limited promotional offers on selected products with customizable percentage discounts (e.g., 20% OFF). These deals are highlighted in a prominent Flash Sale section on the landing page directly below the Hero section, equipped with live countdown timers, glowing discount badges, strikethrough original prices, calculated discounted sale prices, and direct "Add to Cart" functionality.

---

## 2. Architecture & Data Model

### 2.1 Schema Definition
Stored inside `SiteSettings` (`src/models/SiteSettings.ts`) for unified caching and fast atomic updates:

```typescript
export interface IDailyOffer {
  productId: string;           // Ref to Product._id
  discountPercentage: number;  // 1 to 90
  expiresAt?: string | null;   // ISO timestamp for countdown timer (or daily reset)
  active: boolean;             // Toggle to temporarily hide without deleting
}
```

Embedded in `SiteSettingsSchema`:
```typescript
const DailyOfferSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    discountPercentage: { type: Number, required: true, min: 1, max: 90 },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { _id: true }
);

// Added to SiteSettingsSchema:
dailyOffers: { type: [DailyOfferSchema], default: [] }
```

### 2.2 Pricing & Calculation Rule
- Base Price: `product.price` (e.g., `500.00 EGP`)
- Discount: `discountPercentage` (e.g., `20%`)
- Calculated Sale Price: `Math.round(product.price * (1 - discountPercentage / 100) * 100) / 100` (e.g., `400.00 EGP`)
- Savings Amount: `(product.price - salePrice).toFixed(2)` (e.g., `Save 100.00 EGP`)

---

## 3. UI/UX Specifications

### 3.1 Landing Page: Daily Offers Section (`src/app/page.tsx`)
- **Placement:** Immediately after the Hero section, preceding Featured Products.
- **Header:**
  - Pulsing Flame/Sparkles icon with gradient badge: *"Limited Time Deals"*.
  - Section Headline: *"Daily Offers & Flash Sale"*.
  - Live Countdown Clock: Displays `HH:MM:SS` (e.g. `09h : 42m : 18s Remaining`) dynamically counting down to midnight or custom `expiresAt`.
- **Card Design:**
  - High-impact product card featuring a corner ribbon/badge: `-{discountPercentage}% OFF`.
  - Strikethrough original price (e.g. `~~EGP 500.00~~`) in muted gray next to the bold gradient sale price (`EGP 400.00`).
  - Stock urgency indicator: `"Only X left at this price!"`.
  - Single-click "Add to Cart" button: Adds the item to Zustand `cart-storage` with the discounted price and sale tag.

### 3.2 Admin Dashboard: Daily Offers Management (`src/app/admin/page.tsx`)
- Dedicated **Daily Offers** panel under store management:
  - **Product Selector:** Searchable dropdown listing active catalog products with their image and base price.
  - **Discount Input:** Number input for discount percentage (1–90%) with live preview of calculated sale price and savings.
  - **Timer Setting:** Optional date/time picker for sale expiration (defaults to end of current day).
  - **Active Offers Grid/Table:**
    - Displays thumbnail image, product name, original price, discount badge, sale price, and active toggle switch.
    - Delete button to remove offer from rotation.
    - Status indicators (Active vs Expired).

### 3.3 Cart & Checkout Flow Integration
- When a user adds an item from the Daily Offers section, the item is added to `useCartStore` with `price: salePrice`.
- Cart and Checkout pages display the discounted price and preserve total calculations.
- WhatsApp message generated at checkout confirms the discounted price for customer and admin records.

### 3.4 Localization & RTL Support
- Full English and Arabic translations in `src/i18n/en.ts` and `src/i18n/ar.ts`:
  - `home.dailyOffersTitle`: "Daily Offers" / "عروض اليوم المميزة"
  - `home.dailyOffersSubtitle`: "Special discounts available today only" / "خصومات خاصة متاحة لليوم فقط"
  - `home.endsIn`: "Ends in" / "ينتهي خلال"
  - `home.saveAmount`: "Save {amount}" / "وفر {amount}"
  - `home.off`: "OFF" / "خصم"
  - Admin translations for creating and managing daily offers.

---

## 4. API Endpoints

1. **`GET /api/settings`**:
   - Returns site settings populated with active `dailyOffers` (including populated product details: name, image, original price, stock).
2. **`PATCH /api/settings`** or **`PUT /api/settings`**:
   - Accepts updated `dailyOffers` array from the admin dashboard to save, update, reorder, or toggle offers.

---

## 5. Accessibility & Performance Constraints
- Minimum 4.5:1 contrast on all sale badges (`bg-red-600 text-white` or `bg-amber-600 text-white`).
- All interactive controls (add to cart, admin delete/toggle) have `min-w-[44px] min-h-[44px]` touch targets and explicit `aria-label`s.
- Zero layout shifts (CLS): Skeleton loader in the Daily Offers section matches exact card dimensions while fetching.
