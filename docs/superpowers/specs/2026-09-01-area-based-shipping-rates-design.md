# Area-Based Shipping Rates & Multi-Zone Delivery Design Spec

## Overview
Currently, the application supports only a single flat `shippingCost` in `SiteSettings`. This design introduces multi-zone / area-based shipping rates, enabling administrators to configure custom delivery areas and governorates with specific shipping costs, while customers select their delivery zone during checkout to receive accurate shipping fees.

---

## 1. Requirements & Goals

1. **Admin Area Management**:
   - Admin can view, add, edit, toggle (active/inactive), and delete delivery areas/zones.
   - Each area contains: `id`, `name` (English), `nameAr` (Arabic), `cost` (EGP), `deliveryTime` (e.g., "1-2 Days" / "1-2 يوم"), and `active` (boolean).
   - Pre-populated with default Egyptian regions (Quesna & Menoufia, Cairo & Giza, Alexandria & Beheira, Delta Governorates, Canal Cities, Upper Egypt, Red Sea & Remote Governorates).
   - Ability to reset to default Egyptian governorates at any time.
   - Retain global `freeDeliveryMinPrice` so orders meeting the threshold qualify for free delivery across all active areas.

2. **Customer Checkout Flow**:
   - Customer selects their delivery area from a required dropdown on `/checkout`.
   - The order summary dynamically recalculates the shipping fee and total based on the selected area and cart total.
   - If cart total $\ge$ `freeDeliveryMinPrice`, shipping cost is waived (EGP 0.00) with a "Free" badge.
   - The WhatsApp order confirmation message and submitted order payload include the selected delivery area and applied shipping fee.

3. **Cart Page Presentation**:
   - On `/cart`, if cart qualifies for free shipping, displays "Free".
   - If under minimum, displays "Calculated at checkout" (or "From EGP {minCost}").

4. **Order Storage & POS / Admin Order View**:
   - Store selected `area` in `customerInfo.area` and `shippingCost` in `IOrder`.
   - Display area badge in POS Orders and Admin Orders tabs for courier and fulfillment dispatch.

5. **Internationalization (i18n)**:
   - Full bilingual support in English and Arabic (`en.ts` and `ar.ts`).

---

## 2. Architecture & Data Model

### 2.1 `IShippingArea` Schema
In `src/models/SiteSettings.ts`:
```ts
export interface IShippingArea {
  id: string;
  name: string;
  nameAr: string;
  cost: number;
  deliveryTime?: string;
  active: boolean;
}
```

Embedded in `SiteSettingsSchema`:
```ts
const ShippingAreaSchema = new Schema<IShippingArea>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    nameAr: { type: String, required: true },
    cost: { type: Number, required: true, min: 0 },
    deliveryTime: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);
```

Default Areas initialized:
```ts
export const DEFAULT_SHIPPING_AREAS: IShippingArea[] = [
  { id: "quesna_menoufia", name: "Quesna & Menoufia", nameAr: "قويسنا والمنوفية", cost: 20, deliveryTime: "1 Day", active: true },
  { id: "cairo_giza", name: "Cairo & Giza", nameAr: "القاهرة والجيزة", cost: 45, deliveryTime: "1-2 Days", active: true },
  { id: "alex_beheira", name: "Alexandria & Beheira", nameAr: "الإسكندرية والبحيرة", cost: 50, deliveryTime: "2-3 Days", active: true },
  { id: "delta", name: "Delta Governorates", nameAr: "محافظات الدلتا", cost: 45, deliveryTime: "2-3 Days", active: true },
  { id: "canal", name: "Canal Cities", nameAr: "مدن القناة", cost: 55, deliveryTime: "2-3 Days", active: true },
  { id: "upper_egypt", name: "Upper Egypt", nameAr: "محافظات الصعيد", cost: 70, deliveryTime: "3-4 Days", active: true },
  { id: "red_sea_remote", name: "Red Sea & Remote Governorates", nameAr: "المحافظات الحدودية والبحر الأحمر", cost: 90, deliveryTime: "3-5 Days", active: true },
];
```

### 2.2 API Layer (`src/app/api/settings/route.ts`)
- **GET**: Returns `shippingAreas` (falling back to `DEFAULT_SHIPPING_AREAS` if empty).
- **PUT**: Validates and updates `shippingAreas` array (`id`, `name`, `nameAr`, `cost`, `deliveryTime`, `active`).

### 2.3 Order Schema (`src/models/Order.ts`)
Update `ICustomerInfo` interface:
```ts
export interface ICustomerInfo {
  name: string;
  address: string;
  phone: string;
  email?: string;
  notes?: string;
  area?: string;
  areaId?: string;
}
```
Add optional `shippingCost?: number` to `IOrder`.

---

## 3. UI/UX Implementation Details

### 3.1 Admin Dashboard Settings (`src/app/admin/page.tsx`)
- Add **Shipping Rates by Area (مناطق وتكاليف الشحن)** section.
- Table / Cards showing:
  - Arabic Name, English Name, Price (EGP), Delivery Time, Active Switch.
  - Action buttons: Edit, Delete, Toggle Active.
  - "+ Add New Area" button opening an intuitive creation dialog.
  - "Reset to Egyptian Governorates" button with confirmation.
- Retain global `freeDeliveryMinPrice` input above the table.

### 3.2 Checkout Page (`src/app/checkout/page.tsx`)
- Form includes a required dropdown for **Delivery Area (المنطقة / المحافظة)**.
- Each dropdown option displays: `{name} — EGP {cost}` (or Arabic equivalent).
- Auto-selects the first active area if available.
- Summary calculates:
  - `const currentShipping = totalPrice() >= freeDeliveryMinPrice ? 0 : (selectedArea?.cost ?? shippingCost);`
- In WhatsApp message template:
  - Adds `Area: ${areaName}`
  - Shows `Shipping (${areaName}): ${shipping === 0 ? "Free" : `EGP ${shipping.toFixed(2)}`}`

### 3.3 Cart Page (`src/app/cart/page.tsx`)
- Displays "Free" when over threshold, or "Calculated at checkout" / "From EGP {minCost}".

### 3.4 POS & Order Tracking
- POS Orders Tab and Admin Orders list display the customer's selected area alongside their address for accurate logistics.

---

## 4. Verification Plan

1. **API Validation**:
   - PUT to `/api/settings` with new areas, updated costs, toggled active statuses, and verify persistence.
2. **Admin UI Testing**:
   - Add a custom area, edit an existing rate, toggle off an area, reset to defaults, and save.
3. **Checkout Experience**:
   - Verify area selection changes shipping fee in real-time.
   - Verify cart reaching `freeDeliveryMinPrice` results in Free Shipping across all areas.
   - Verify WhatsApp message generation includes the correct area name and shipping amount.
   - Verify order in DB contains `customerInfo.area` and correct `totalPrice`.
4. **Cart Summary**:
   - Confirm cart summary accurately conveys free shipping status or checkout calculation note.
