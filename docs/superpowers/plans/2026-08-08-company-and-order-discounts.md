# Company Management & Admin Order Discount Stacking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full Company (Brand) management with logo uploads and product association, plus an interactive Order Discount & Stacking modal in Admin Orders with Arabic WhatsApp confirmation messages.

**Architecture:** Standalone `Company` MongoDB collection populated on products; `Order` schema extended with `discountDetails`; interactive admin discount modal with stacking toggles and real-time Arabic WhatsApp order generation.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Mongoose, Tailwind CSS v4, ImageKit, Lucide React.

## Global Constraints

- Arabic-first localization for all order adjustment summaries, discount breakdowns, and customer WhatsApp templates.
- Minimum 44×44px touch targets and descriptive `aria-label`s on all buttons, discount switches, and stacking checkboxes.
- Strict type safety with zero TypeScript compilation errors.
- ImageKit logo uploads with drag-and-drop and fallback preview.

---

## File Structure & Responsibility Map

| File Path | Responsibility | Changes |
| :--- | :--- | :--- |
| `src/models/Company.ts` | Company data model | Create schema with `name`, `logo`, `description` |
| `src/models/Product.ts` | Product data model | Add `company` ref (`Schema.Types.ObjectId`) |
| `src/models/Order.ts` | Order data model | Add `discountDetails` object storing item/order discounts |
| `src/app/api/companies/route.ts` & `[id]/route.ts` | Company CRUD API | Create GET, POST, PUT, DELETE endpoints |
| `src/app/api/products/route.ts` & `[id]/route.ts` | Product API | Populate `company` on GET queries |
| `src/app/api/orders/[id]/route.ts` | Order API | Update status, total, and persist `discountDetails` |
| `src/i18n/ar.ts` & `src/i18n/en.ts` | Translations | Add Arabic-focused strings for brands, order discounts, and WhatsApp |
| `src/app/admin/page.tsx` | Admin Dashboard | Add Companies management panel (create, logo upload, delete) |
| `src/app/admin/products/page.tsx` | Admin Products | Add Company selector in product create/edit modal |
| `src/components/ProductCard.tsx` & `products/[id]/page.tsx` | Storefront | Render company logo/badge |
| `src/app/admin/orders/page.tsx` | Admin Orders | Add interactive Discount & Stacking modal + Arabic WhatsApp action |

---

### Task 1: Company Model, Product Schema Update & Company API Endpoints

**Files:**
- Create: `src/models/Company.ts`
- Modify: `src/models/Product.ts`
- Create: `src/app/api/companies/route.ts`
- Create: `src/app/api/companies/[id]/route.ts`
- Modify: `src/app/api/products/route.ts`
- Modify: `src/app/api/products/[id]/route.ts`

- [ ] **Step 1: Create `src/models/Company.ts`**
Define `ICompany` and `CompanySchema` with `name` (required, trim), `logo` (required, string), and `description`.

- [ ] **Step 2: Update `src/models/Product.ts`**
Add `company: { type: Schema.Types.ObjectId, ref: "Company", default: null }` to `IProduct` and `ProductSchema`.

- [ ] **Step 3: Create Company API routes**
- `src/app/api/companies/route.ts`:
  - `GET`: Returns array of all companies sorted by name.
  - `POST`: Admin-only. Validates `name` and `logo`, creates document, returns JSON.
- `src/app/api/companies/[id]/route.ts`:
  - `PUT`: Admin-only. Updates `name`, `logo`, `description`.
  - `DELETE`: Admin-only. Removes company and unlinks from associated products (`updateMany({ company: id }, { $set: { company: null } })`).

- [ ] **Step 4: Update Product API routes**
In `src/app/api/products/route.ts` and `src/app/api/products/[id]/route.ts`:
Add `.populate("company", "name logo")` to GET queries so brand data is seamlessly delivered to the frontend.

- [ ] **Step 5: Verify type safety**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit Task 1**
```bash
git add src/models/Company.ts src/models/Product.ts src/app/api/companies/ src/app/api/products/
git commit -m "feat(company): add company model, product reference, and CRUD API endpoints"
```

---

### Task 2: Arabic-Focused Localization for Companies & Order Discounts

**Files:**
- Modify: `src/i18n/ar.ts`
- Modify: `src/i18n/en.ts`

- [ ] **Step 1: Add Arabic translation keys in `src/i18n/ar.ts`**
Add keys for:
- Company Management (`admin.companies.title`, `admin.companies.addCompany`, `admin.companies.name`, `admin.companies.logo`, `admin.companies.noCompanies`, `admin.companies.deleteConfirm`, `admin.companies.selectCompany`).
- Order Discounts & Stacking (`admin.orders.applyDiscount`, `admin.orders.discountModalTitle`, `admin.orders.itemDiscounts`, `admin.orders.orderDiscount`, `admin.orders.stackDiscount`, `admin.orders.stackDiscountHelp`, `admin.orders.originalTotal`, `admin.orders.totalSavings`, `admin.orders.finalPayable`, `admin.orders.saveAndConfirm`, `admin.orders.copyWhatsAppArabic`, `admin.orders.discountAppliedSuccess`).

- [ ] **Step 2: Add matching English translation keys in `src/i18n/en.ts`**
Ensure complete type parity with `as const`.

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 2**
```bash
git add src/i18n/ar.ts src/i18n/en.ts
git commit -m "feat(i18n): add Arabic and English translation keys for companies and order discounts"
```

---

### Task 3: Admin Companies Management Panel, Product Brand Selector & Storefront Badges

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/products/page.tsx`
- Modify: `src/components/ProductCard.tsx`
- Modify: `src/app/products/[id]/page.tsx`

- [ ] **Step 1: Add Companies panel in `src/app/admin/page.tsx`**
- State for `companies: Company[]`, `newCompanyName`, `newCompanyLogo`, `uploadingLogo`.
- Logo upload using existing `/api/upload` endpoint.
- Company listing cards with logo preview, name, product count, and delete button with modal confirmation.

- [ ] **Step 2: Add Company selector in `src/app/admin/products/page.tsx`**
- Fetch companies from `/api/companies`.
- Add Company `<select>` dropdown in product create/edit modal.
- Save selected `company` ID in product payload.

- [ ] **Step 3: Display Company Badge on Storefront**
- In `src/components/ProductCard.tsx`: If `company` object or populated company exists, render subtle company name / logo badge.
- In `src/app/products/[id]/page.tsx`: Display brand logo thumbnail and name beside product category.

- [ ] **Step 4: Verify type safety**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 3**
```bash
git add src/app/admin/page.tsx src/app/admin/products/page.tsx src/components/ProductCard.tsx src/app/products/[id]/page.tsx
git commit -m "feat(brands): add admin company management, product brand selector and storefront badges"
```

---

### Task 4: Order Model Extension, Discount Stacking Modal & Arabic WhatsApp Generator

**Files:**
- Modify: `src/models/Order.ts`
- Modify: `src/app/api/orders/[id]/route.ts`
- Modify: `src/app/admin/orders/page.tsx`

- [ ] **Step 1: Extend `Order` model with `discountDetails`**
In `src/models/Order.ts`, add `discountDetails` schema storing `itemAdjustments` (`productId`, `discountType`, `discountValue`, `stacked`, `basePrice`, `priorPrice`, `finalPrice`), `orderDiscountType`, `orderDiscountValue`, `originalTotal`, and `finalTotal`.

- [ ] **Step 2: Update Order API route**
In `src/app/api/orders/[id]/route.ts`, accept `status`, `totalPrice`, and `discountDetails` in PUT handler, persist to MongoDB, and return updated order.

- [ ] **Step 3: Build Discount & Stacking Modal in `src/app/admin/orders/page.tsx`**
- "Apply Discount & Confirm" button on each order card.
- Modal features:
  - Table of order items showing original ordered price, quantity, and daily offer indicator.
  - Per-item discount input with `%` / `EGP` toggle.
  - Stacking checkbox: *"Stack with existing discount"* (if checked: discount applies on already-discounted price; if unchecked: applies on original base price).
  - Whole-order discount field (`%` or `EGP`).
  - Live recalculation preview in Egyptian Pounds.
  - "Save & Confirm Order" button saving to `/api/orders/[id]`.
  - "Copy WhatsApp Message (Arabic)" button generating the Arabic message:
    ```
    مرحباً {customerName}! 🛍️
    تم تأكيد طلبك رقم #{orderId} بنجاح من متجر M L N TOOLS.

    📋 تفاصيل الأصناف:
    - {itemName} × {qty}: {finalItemPrice} ج.م (وفرت {itemSavings} ج.م)

    💰 تفاصيل الحساب:
    - إجمالي المنتجات: {originalTotal} ج.م
    - إجمالي الخصم المطبق: {totalSavings} ج.م
    - الإجمالي النهائي للدفع: {finalTotal} ج.م

    🚚 جاري تجهيز الطلب للشحن وسنتواصل معك عند الإرسال. شكراً لتسوقك معنا!
    ```

- [ ] **Step 4: Verify type safety**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 4**
```bash
git add src/models/Order.ts src/app/api/orders/ src/app/admin/orders/page.tsx
git commit -m "feat(orders): implement admin order discount stacking modal and Arabic WhatsApp confirmation"
```

---

### Task 5: Full End-to-End Build Verification & Polish

**Files:**
- Check: All modified files

- [ ] **Step 1: Run TypeScript Compilation**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Run Production Build**
Run: `npm run build`
Expected: 0 errors, successful static page generation.

- [ ] **Step 3: Commit Task 5**
```bash
git add -A
git commit -m "chore(build): verify company management and order discount stacking production build"
```
