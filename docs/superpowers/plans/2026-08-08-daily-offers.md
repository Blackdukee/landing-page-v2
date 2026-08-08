# Daily Offers Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a dynamic Daily Offers & Flash Deals section on the landing page with live countdown timers and percentage discounts, fully manageable via a dedicated Admin Dashboard panel.

**Architecture:** Extend the `SiteSettings` MongoDB schema to store populated daily offer configurations with active toggles and expiration timestamps; expose through `SiteSettingsContext` and the settings API; render responsive, accessible offer cards with live client-side countdown clocks on the landing page; enable complete CRUD in the Admin Dashboard.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Mongoose, Tailwind CSS v4, Zustand, Lucide React.

## Global Constraints

- Full Arabic (`ar`) and English (`en`) localization with proper RTL/LTR directional support.
- All interactive controls (buttons, toggles, selectors) must have minimum 44×44px touch targets and explicit `aria-label`s.
- Zero layout shift (CLS < 0.1): Skeleton loaders must strictly match card bounding boxes.
- Text contrast ratio must meet WCAG 2.1 AA (≥ 4.5:1 for standard text).
- Discount calculations must be integer-rounded and safe against invalid ranges (`1%` to `90%`).

---

## File Structure & Responsibility Map

| File Path | Responsibility | Changes |
| :--- | :--- | :--- |
| `src/models/SiteSettings.ts` | Database schema for settings | Add `dailyOffers` schema with `productId`, `discountPercentage`, `expiresAt`, `active` |
| `src/lib/SiteSettingsContext.tsx` | Global site settings state & provider | Expose `dailyOffers` array and typed interfaces |
| `src/app/api/settings/route.ts` | Settings API GET/PUT handler | Populate `dailyOffers.productId` on GET; persist updated offers on PUT |
| `src/i18n/en.ts` & `src/i18n/ar.ts` | Translation dictionaries | Add landing page countdown, badge, and admin management translation strings |
| `src/components/DailyOffersSection.tsx` | Landing page Flash Sale component | Render live countdown timer, discount pills, sale pricing, and direct add-to-cart |
| `src/app/page.tsx` | Landing page | Position `DailyOffersSection` directly beneath the Hero section |
| `src/app/admin/page.tsx` | Admin Dashboard | Add Daily Offers panel with product picker, discount slider, active toggle, and deletion |

---

### Task 1: Data Model & API Updates for Daily Offers

**Files:**
- Modify: `src/models/SiteSettings.ts:1-78`
- Modify: `src/lib/SiteSettingsContext.tsx:1-112`
- Modify: `src/app/api/settings/route.ts:1-80`

**Interfaces:**
```typescript
export interface IDailyOfferItem {
  _id?: string;
  productId: string;
  discountPercentage: number;
  expiresAt?: string | null;
  active: boolean;
  product?: {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    stock: number;
    category: string;
  };
}
```

- [ ] **Step 1: Extend `SiteSettings.ts` schema**

Edit `src/models/SiteSettings.ts`:
Add `DailyOfferSchema` and include `dailyOffers` field in `SiteSettingsSchema`:
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

// In SiteSettingsSchema:
dailyOffers: { type: [DailyOfferSchema], default: [] }
```

- [ ] **Step 2: Update `SiteSettingsContext.tsx`**

Edit `src/lib/SiteSettingsContext.tsx`:
Add `dailyOffers: IDailyOfferItem[]` to `SiteSettings` and `SiteSettingsContextValue` interfaces and populate default value `[]`.

- [ ] **Step 3: Update `src/app/api/settings/route.ts`**

Edit `src/app/api/settings/route.ts`:
1. In `GET`: Add `.populate("dailyOffers.productId")` so the client receives product details directly without extra network requests.
2. In `PUT`: Accept `dailyOffers` array in payload, validate discount ranges (1-90%), and persist to MongoDB.

- [ ] **Step 4: Verify type safety**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/models/SiteSettings.ts src/lib/SiteSettingsContext.tsx src/app/api/settings/route.ts
git commit -m "feat(offers): add dailyOffers schema, context state, and populated API endpoints"
```

---

### Task 2: Localization Strings for Daily Offers

**Files:**
- Modify: `src/i18n/en.ts`
- Modify: `src/i18n/ar.ts`

- [ ] **Step 1: Add English translation keys in `src/i18n/en.ts`**

Add keys:
```typescript
"home.dailyOffersTitle": "Daily Offers & Flash Deals",
"home.dailyOffersSubtitle": "Special limited-time discounts available today only. Grab them before they're gone!",
"home.endsIn": "Ends in",
"home.saveAmount": "Save EGP {amount}",
"home.off": "OFF",
"home.dealExpired": "Deal expired",
"home.hours": "h",
"home.minutes": "m",
"home.seconds": "s",
"home.claimDeal": "Claim Deal",
"admin.offers.title": "Daily Offers Management",
"admin.offers.subtitle": "Select products, set discount percentages, and schedule flash deals",
"admin.offers.selectProduct": "Select a product...",
"admin.offers.discountPercent": "Discount Percentage (%)",
"admin.offers.salePrice": "Sale Price",
"admin.offers.savings": "Customer Saves",
"admin.offers.expiryOptional": "Offer Expiration (optional)",
"admin.offers.addOffer": "Add Daily Offer",
"admin.offers.noOffers": "No active daily offers. Add your first offer above.",
"admin.offers.active": "Active",
"admin.offers.inactive": "Inactive",
"admin.offers.deleteConfirm": "Remove this daily offer?",
```

- [ ] **Step 2: Add Arabic translation keys in `src/i18n/ar.ts`**

Add matching Arabic keys:
```typescript
"home.dailyOffersTitle": "عروض اليوم والتخفيضات الكبرى",
"home.dailyOffersSubtitle": "خصومات خاصة ومحدودة الوقت متاحة اليوم فقط. تسوق قبل انتهاء العرض!",
"home.endsIn": "ينتهي خلال",
"home.saveAmount": "وفر {amount} ج.م",
"home.off": "خصم",
"home.dealExpired": "انتهى العرض",
"home.hours": "س",
"home.minutes": "د",
"home.seconds": "ث",
"home.claimDeal": "احصل على العرض",
"admin.offers.title": "إدارة عروض اليوم",
"admin.offers.subtitle": "اختر المنتجات وحدد نسب الخصم وجدول العروض المميزة",
"admin.offers.selectProduct": "اختر منتجاً...",
"admin.offers.discountPercent": "نسبة الخصم (%)",
"admin.offers.salePrice": "سعر العرض",
"admin.offers.savings": "قيمة التوفير",
"admin.offers.expiryOptional": "تاريخ ووقت انتهاء العرض (اختياري)",
"admin.offers.addOffer": "إضافة عرض جديد",
"admin.offers.noOffers": "لا توجد عروض حالياً. أضف أول عرض من النموذج أعلاه.",
"admin.offers.active": "مفعل",
"admin.offers.inactive": "معطل",
"admin.offers.deleteConfirm": "هل تريد حذف هذا العرض؟",
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 2**

```bash
git add src/i18n/en.ts src/i18n/ar.ts
git commit -m "feat(i18n): add English and Arabic translations for daily offers and flash deals"
```

---

### Task 3: Landing Page Daily Offers Section & Live Countdown

**Files:**
- Create: `src/components/DailyOffersSection.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build `src/components/DailyOffersSection.tsx`**

Create `src/components/DailyOffersSection.tsx`:
1. Use `useSiteSettings()` to access `dailyOffers`. Filter for `offer.active` and valid product.
2. If no active daily offers exist, return `null` so no empty space renders.
3. Compute sale price: `const salePrice = Math.round(originalPrice * (1 - discountPercentage / 100) * 100) / 100`.
4. Client-side live timer:
   - Calculate remaining time until `expiresAt` (or next midnight if `expiresAt` not set).
   - Format `hours`, `minutes`, `seconds` with leading zeros.
   - Update every second with `setInterval`.
5. Card layout:
   - Glowing discount pill (`-X% OFF`) in vibrant flame/amber styling.
   - Strikethrough original price + bold gradient sale price.
   - Savings pill (`Save EGP X`).
   - "Claim Deal" button calling `addItem` with `price: salePrice`.
   - Accessible touch targets (≥ 44×44px) and full `aria-label`s.

- [ ] **Step 2: Mount `DailyOffersSection` in `src/app/page.tsx`**

Edit `src/app/page.tsx`:
Insert `<DailyOffersSection />` directly below the Hero section (before the Featured section).

- [ ] **Step 3: Verify rendering and compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 3**

```bash
git add src/components/DailyOffersSection.tsx src/app/page.tsx
git commit -m "feat(home): add daily offers flash deals section with live countdown clock"
```

---

### Task 4: Admin Dashboard Daily Offers Management Panel

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add Daily Offers state and controls in Admin Dashboard**

Edit `src/app/admin/page.tsx`:
1. Add state:
   - `selectedProductId: string`
   - `discountPercent: number` (e.g. 20)
   - `expiresAt: string`
   - `savingOffers: boolean`
2. Form card:
   - Searchable product selector showing product name, current price, and thumbnail.
   - Discount percentage number/range input (1-90%).
   - Live preview showing: Original Price, Calculated Sale Price, and Customer Savings.
   - Expiration date-time picker.
   - "Add to Daily Offers" button.
3. Active Offers Management Table/Grid:
   - Lists all configured daily offers with product thumbnail, title, discount badge, sale price, and expiry time.
   - Active switch toggle (calls `PUT /api/settings` to update `active`).
   - Delete button with confirmation modal (removes offer from array and saves).

- [ ] **Step 2: Verify Admin Dashboard interactions**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit Task 4**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): add daily offers management panel with product picker, discount preview and controls"
```

---

### Task 5: Cart & Checkout Integration & Build Verification

**Files:**
- Modify: `src/components/ProductCard.tsx`
- Modify: `src/app/checkout/page.tsx`

- [ ] **Step 1: Verify cart pricing and WhatsApp checkout alignment**

Ensure that when items are added from the Daily Offers section, the discount is recorded in `CartItem.price` and carries cleanly through to:
1. Cart subtotal and shipping qualification calculations.
2. Checkout summary display.
3. Generated WhatsApp message with item breakdown.

- [ ] **Step 2: Run Full Verification Suite**

1. Run: `npx tsc --noEmit`
2. Run: `npm run build`
Expected: Production build succeeds with 0 errors.

- [ ] **Step 3: Commit Task 5**

```bash
git add src/components/ProductCard.tsx src/app/checkout/page.tsx
git commit -m "feat(checkout): verify daily offer discounted pricing in cart and WhatsApp order flow"
```

---

## Plan Verification Checklist

- [ ] Every task has clear file paths, interfaces, exact code changes, and test steps.
- [ ] No placeholders or vague "TBD" items.
- [ ] Responsive countdown timer and discount calculations verified.
- [ ] WCAG AA 4.5:1 contrast compliance verified for all sale badges.
