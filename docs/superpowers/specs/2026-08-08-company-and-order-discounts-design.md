# Company Management & Admin Order Discount Stacking Specification

## 1. Overview
This feature introduces two major enhancements to the QuesnaShop platform:
1. **Company / Brand Management:** A dedicated entity and admin dashboard panel allowing admins to create, edit, and delete companies (brands) with logo uploads. Products can be associated with a company, displaying brand logos/badges on product cards and detail pages.
2. **Admin Order Discount & Stacking System:** An interactive order adjustment and confirmation workflow in the Admin Orders screen where admins can apply item-level or whole-order discounts (% or fixed EGP). If an item already has an existing discount (such as from Daily Offers), a stacking checkbox lets the admin choose between compounding the new discount on the already-discounted price vs. calculating from the original base price. The final payable total is saved to the order and formatted into a one-click WhatsApp confirmation message for the customer.

---

## 2. Data Models & Schemas

### 2.1 Company Model (`src/models/Company.ts`)
```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompany extends Document {
  name: string;
  logo: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);

export default Company;
```

### 2.2 Product Model Update (`src/models/Product.ts`)
Extend `IProduct` and `ProductSchema` to reference `Company`:
```typescript
company: { type: Schema.Types.ObjectId, ref: "Company", default: null }
```

### 2.3 Order Model Update (`src/models/Order.ts`)
Extend `IOrderItem` and `IOrder` with discount tracking:
```typescript
export interface IOrderItemAdjustment {
  productId: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  stacked: boolean;
  basePrice: number;
  priorPrice: number;
  finalPrice: number;
}

export interface IOrderDiscount {
  orderDiscountType?: "percentage" | "fixed" | null;
  orderDiscountValue?: number;
  itemAdjustments: IOrderItemAdjustment[];
  originalTotal: number;
  finalTotal: number;
}

// In IOrder:
discountDetails?: IOrderDiscount;
```

---

## 3. Mathematical Rules for Discount Stacking

Let:
- $P_{\text{base}}$ = Original base catalog price of product.
- $P_{\text{prior}}$ = Current price of item in order (e.g. from Daily Offer sale price).
- $D_{\text{value}}$ = New discount value input by admin.
- $D_{\text{type}}$ = `"percentage"` or `"fixed"`.

### 3.1 Item-Level Calculation
1. **If Stacked (`stacked === true`):**
   - Percentage: $P_{\text{final}} = P_{\text{prior}} \times (1 - \frac{D_{\text{value}}}{100})$
   - Fixed: $P_{\text{final}} = \max(0, P_{\text{prior}} - D_{\text{value}})$
2. **If Unstacked (`stacked === false`):**
   - Percentage: $P_{\text{final}} = P_{\text{base}} \times (1 - \frac{D_{\text{value}}}{100})$
   - Fixed: $P_{\text{final}} = \max(0, P_{\text{base}} - D_{\text{value}})$

### 3.2 Whole-Order Level Calculation
Let $S_{\text{items}} = \sum (P_{\text{final}} \times \text{quantity})$.
- Percentage: $\text{OrderTotal} = S_{\text{items}} \times (1 - \frac{D_{\text{order}}}{100})$
- Fixed: $\text{OrderTotal} = \max(0, S_{\text{items}} - D_{\text{order}})$

---

## 4. UI/UX & Workflows

### 4.1 Admin Companies Management (`src/app/admin/companies/` or `/admin/page.tsx`)
- **List Companies:** Shows company logo, name, product count, edit, and delete actions.
- **Create/Edit Modal:**
  - Name input (localized / text).
  - Logo upload via ImageKit with drag-and-drop.
  - Delete with confirmation.

### 4.2 Product Creation / Edit (`src/app/admin/products/page.tsx`)
- Company selector dropdown displaying company logo + name.
- Saves `company: companyId` to Product document.

### 4.3 Customer-Facing Storefront
- **Product Card & Detail Page:** Display company logo thumbnail and name badge next to category badge.

### 4.4 Admin Orders Screen (`src/app/admin/orders/page.tsx`)
- **"Confirm & Apply Discount" Modal:**
  - Lists all items with their ordered price and quantity.
  - Per-item discount input (switch between `%` and `EGP`).
  - Stacking checkbox: *"Stack with existing discount"* (auto-enabled if item has prior discount).
  - Order-level discount input (switch between `%` and `EGP`).
  - Live summary breakdown:
    - Original Order Total: `XXX.XX EGP`
    - Total Discount Applied: `-YY.YY EGP`
    - Final Payable Total: `ZZZ.ZZ EGP`
  - Actions:
    - **"Save & Confirm Order":** Persists `status: "confirmed"` and `discountDetails` via `PUT /api/orders/[id]`.
    - **"Open / Copy WhatsApp Message":** Generates WhatsApp message detailing item breakdown, applied discounts, and final total.

---

## 5. API Endpoints
1. `GET /api/companies`: List all companies.
2. `POST /api/companies`: Create a new company.
3. `PUT /api/companies/[id]`: Update company details.
4. `DELETE /api/companies/[id]`: Delete company.
5. `GET /api/products`: Populates `company` field.
6. `PUT /api/orders/[id]`: Accepts updated status, total, and `discountDetails`.

---

## 6. Accessibility & Performance Constraints
- All modal triggers, discount type switches, and stacking checkboxes enforce minimum 44×44px touch targets with descriptive `aria-label`s.
- Clean TypeScript types without `any` regressions.
- WCAG AA text contrast (> 4.5:1) for all discount summaries and company badges.
