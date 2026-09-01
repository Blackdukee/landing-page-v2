# Area-Based Shipping Rates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow administrators to configure delivery areas/governorates and their specific shipping costs instead of a single fixed cost, while customers select their delivery area at checkout to calculate accurate dynamic shipping fees.

**Architecture:** Extend `SiteSettings` with a list of `IShippingArea` entities (seeded with standard Egyptian governorate defaults), update the settings API and React Context, build an interactive Admin UI for managing shipping areas/costs, update Checkout to require area selection with dynamic cost calculation and WhatsApp formatting, adjust Cart display, and surface the area in POS order tracking.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Mongoose / MongoDB, React Context, Tailwind CSS, Lucide React.

## Global Constraints
- Must maintain backward compatibility for existing orders and settings.
- Global `freeDeliveryMinPrice` threshold applies across all areas (orders over minimum get free shipping).
- Default preset covers all Egyptian governorate groups (Quesna & Menoufia, Cairo & Giza, Alexandria & Beheira, Delta Governorates, Canal Cities, Upper Egypt, Red Sea & Remote Governorates).
- All customer-facing and admin UI text must be fully translated in both English and Arabic.

---

### Task 1: Data Model & Schema Updates

**Files:**
- Modify: `src/models/SiteSettings.ts`
- Modify: `src/models/Order.ts`

**Interfaces:**
- Consumes: Mongoose schema definitions
- Produces: `IShippingArea`, `DEFAULT_SHIPPING_AREAS`, updated `ISiteSettings`, `ICustomerInfo` with `area?: string`, `areaId?: string`, and `IOrder` with `shippingCost?: number`.

- [ ] **Step 1: Update `src/models/SiteSettings.ts` with `IShippingArea` and defaults**

```ts
export interface IShippingArea {
  id: string;
  name: string;
  nameAr: string;
  cost: number;
  deliveryTime?: string;
  active: boolean;
}

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

Add `shippingAreas: IShippingArea[]` to `ISiteSettings` and `SiteSettingsSchema` with `default: DEFAULT_SHIPPING_AREAS`.

- [ ] **Step 2: Update `src/models/Order.ts` with area and shipping fields**

In `ICustomerInfo`:
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
In `IOrder` and `OrderSchema`:
```ts
shippingCost?: number;
```
Add `customerInfo.area`, `customerInfo.areaId`, and `shippingCost` to `OrderSchema`.

- [ ] **Step 3: Verify TypeScript compilation of models**

Run: `npx tsc --noEmit`
Expected: PASS with no model type errors.

- [ ] **Step 4: Commit model changes**

```bash
git add src/models/SiteSettings.ts src/models/Order.ts
git commit -m "feat(models): add IShippingArea schema and update Order customerInfo with area"
```

---

### Task 2: API Route Updates & Settings React Context

**Files:**
- Modify: `src/app/api/settings/route.ts`
- Modify: `src/lib/SiteSettingsContext.tsx`

**Interfaces:**
- Consumes: `IShippingArea`, `DEFAULT_SHIPPING_AREAS` from `SiteSettings.ts`
- Produces: `shippingAreas: IShippingArea[]` exposed in `useSiteSettings()`, validated `PUT /api/settings` persistence.

- [ ] **Step 1: Update `src/app/api/settings/route.ts`**

In `PUT` handler, validate and sanitize `body.shippingAreas`:
```ts
if (Array.isArray(body.shippingAreas)) {
  const areas = body.shippingAreas
    .filter(
      (a: any) =>
        a &&
        typeof a.id === "string" &&
        a.id.trim() &&
        typeof a.name === "string" &&
        a.name.trim() &&
        typeof a.nameAr === "string" &&
        a.nameAr.trim() &&
        typeof a.cost === "number" &&
        a.cost >= 0
    )
    .map((a: any) => ({
      id: a.id.trim(),
      name: a.name.trim(),
      nameAr: a.nameAr.trim(),
      cost: a.cost,
      deliveryTime: typeof a.deliveryTime === "string" ? a.deliveryTime.trim() : "",
      active: typeof a.active === "boolean" ? a.active : true,
    }));
  update.shippingAreas = areas;
}
```

- [ ] **Step 2: Update `src/lib/SiteSettingsContext.tsx`**

Export `IShippingArea`, add `shippingAreas: IShippingArea[]` to `SiteSettings` interface, include `DEFAULT_SHIPPING_AREAS` in `defaultSettings`, and hydrate `shippingAreas` in `fetchSettings()` fallback logic.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit settings API & context**

```bash
git add src/app/api/settings/route.ts src/lib/SiteSettingsContext.tsx
git commit -m "feat(settings): support shippingAreas in API route and SiteSettingsContext"
```

---

### Task 3: Internationalization (i18n) Translations

**Files:**
- Modify: `src/i18n/en.ts`
- Modify: `src/i18n/ar.ts`

**Interfaces:**
- Consumes: `TranslationKey`
- Produces: i18n keys for checkout area selector, admin shipping areas table, actions, modals, and templates.

- [ ] **Step 1: Add translation keys to `src/i18n/en.ts`**

```ts
// Checkout
"checkout.areaLabel": "Delivery Area / Governorate",
"checkout.selectArea": "Select your delivery area...",
"checkout.deliveryEstimate": "Estimated delivery: {time}",
"checkout.area": "Delivery Area",

// Cart
"cart.shippingCalculated": "Calculated at checkout",
"cart.shippingFrom": "From EGP {amount}",

// Admin - Shipping Areas
"admin.shipping.title": "Shipping Rates & Delivery Areas",
"admin.shipping.desc": "Configure shipping costs and delivery times per governorate or custom area",
"admin.shipping.addArea": "Add Shipping Area",
"admin.shipping.resetDefaults": "Reset to Egypt Defaults",
"admin.shipping.resetConfirm": "Are you sure you want to reset all shipping areas to the default Egyptian governorate presets? Any custom areas will be overwritten.",
"admin.shipping.nameEn": "Name (English)",
"admin.shipping.nameAr": "Name (Arabic)",
"admin.shipping.cost": "Shipping Cost (EGP)",
"admin.shipping.deliveryTime": "Delivery Estimate",
"admin.shipping.deliveryTimeHint": "e.g. 1-2 Days, Same Day",
"admin.shipping.status": "Status",
"admin.shipping.active": "Active",
"admin.shipping.inactive": "Inactive",
"admin.shipping.editArea": "Edit Area",
"admin.shipping.deleteArea": "Delete Area",
"admin.shipping.deleteConfirm": "Are you sure you want to delete this shipping area?",
"admin.shipping.noAreas": "No shipping areas configured. Click 'Reset to Egypt Defaults' to restore default governorates.",
"admin.shipping.saveChanges": "Save Shipping Rates",
```

- [ ] **Step 2: Add translation keys to `src/i18n/ar.ts`**

```ts
// Checkout
"checkout.areaLabel": "المنطقة / المحافظة",
"checkout.selectArea": "اختر منطقة أو محافظة التوصيل...",
"checkout.deliveryEstimate": "التوصيل المتوقع: {time}",
"checkout.area": "منطقة التوصيل",

// Cart
"cart.shippingCalculated": "يُحسب عند الدفع",
"cart.shippingFrom": "تبدأ من {amount} ج.م",

// Admin - Shipping Areas
"admin.shipping.title": "أسعار ومناطق الشحن",
"admin.shipping.desc": "تحديد تكاليف وأوقات الشحن حسب المحافظة أو المناطق المخصصة",
"admin.shipping.addArea": "إضافة منطقة شحن",
"admin.shipping.resetDefaults": "استعادة محافظات مصر الافتراضية",
"admin.shipping.resetConfirm": "هل أنت متأكد من رغبتك في استعادة محافظات مصر الافتراضية؟ سيتم استبدال أي مناطق مخصصة.",
"admin.shipping.nameEn": "الاسم (بالإنجليزية)",
"admin.shipping.nameAr": "الاسم (بالعربية)",
"admin.shipping.cost": "تكلفة الشحن (ج.م)",
"admin.shipping.deliveryTime": "مدة التوصيل المتوقعة",
"admin.shipping.deliveryTimeHint": "مثال: 1-2 يوم، نفس اليوم",
"admin.shipping.status": "الحالة",
"admin.shipping.active": "مفعل",
"admin.shipping.inactive": "معطل",
"admin.shipping.editArea": "تعديل المنطقة",
"admin.shipping.deleteArea": "حذف المنطقة",
"admin.shipping.deleteConfirm": "هل أنت متأكد من رغبتك في حذف منطقة الشحن هذه؟",
"admin.shipping.noAreas": "لم يتم ضبط أي مناطق شحن. اضغط 'استعادة محافظات مصر الافتراضية' لإضافة المحافظات.",
"admin.shipping.saveChanges": "حفظ أسعار الشحن",
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit translation additions**

```bash
git add src/i18n/en.ts src/i18n/ar.ts
git commit -m "feat(i18n): add English and Arabic translations for area-based shipping rates"
```

---

### Task 4: Admin Dashboard Shipping Zones Management UI

**Files:**
- Modify: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `IShippingArea`, `DEFAULT_SHIPPING_AREAS` from `src/models/SiteSettings.ts`, `useSiteSettings()`, i18n
- Produces: Interactive Shipping Areas management card in Admin Settings tab with add, edit, delete, toggle active, reset defaults, and save to `/api/settings`.

- [ ] **Step 1: Add state and management functions in `src/app/admin/page.tsx`**

State variables:
```ts
const [shippingAreas, setShippingAreas] = useState<IShippingArea[]>([]);
const [editingArea, setEditingArea] = useState<IShippingArea | null>(null);
const [showAddAreaModal, setShowAddAreaModal] = useState(false);
const [areaForm, setAreaForm] = useState({ id: "", name: "", nameAr: "", cost: 0, deliveryTime: "", active: true });
```
Sync state from `siteSettings.shippingAreas` on load.

- [ ] **Step 2: Build UI for Shipping Areas Table and Modals in Settings Tab**

Render the Shipping Rates table with columns:
- Name (Arabic & English)
- Cost (EGP)
- Delivery Estimate
- Active Toggle Switch
- Actions (Edit, Delete)
- Top action buttons: "+ Add Shipping Area", "Reset to Egypt Defaults"
- Add/Edit Modal with form validation and bilingual input.

- [ ] **Step 3: Include `shippingAreas` in save settings payload (`handleSaveSettings`)**

Ensure `shippingAreas` is passed in the `PUT /api/settings` request body.

- [ ] **Step 4: Test and verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit Admin UI changes**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): add interactive shipping areas management to admin settings tab"
```

---

### Task 5: Storefront Checkout Page Integration

**Files:**
- Modify: `src/app/checkout/page.tsx`

**Interfaces:**
- Consumes: `shippingAreas`, `freeDeliveryMinPrice` from `useSiteSettings()`
- Produces: Required Delivery Area selection, real-time dynamic shipping calculation, WhatsApp message with area, `/api/orders` submission payload with area.

- [ ] **Step 1: Add area selection state and dynamic calculation**

```ts
const { shippingAreas, freeDeliveryMinPrice, shippingCost: fallbackShipping } = useSiteSettings();
const activeAreas = (shippingAreas && shippingAreas.length > 0)
  ? shippingAreas.filter((a) => a.active)
  : DEFAULT_SHIPPING_AREAS;

const [selectedAreaId, setSelectedAreaId] = useState<string>("");

// Auto-select first area when activeAreas load
useEffect(() => {
  if (!selectedAreaId && activeAreas.length > 0) {
    setSelectedAreaId(activeAreas[0].id);
  }
}, [activeAreas, selectedAreaId]);

const selectedArea = activeAreas.find((a) => a.id === selectedAreaId) || activeAreas[0];
const baseShipping = selectedArea ? selectedArea.cost : fallbackShipping;
const shipping = totalPrice() >= freeDeliveryMinPrice ? 0 : baseShipping;
const total = totalPrice() + shipping;
```

- [ ] **Step 2: Add Area Select input to Customer Info form**

Render a dropdown above Address:
```tsx
<div>
  <label htmlFor="checkout-area" className="block text-xs font-semibold text-foreground mb-1.5">
    {t("checkout.areaLabel")} <span className="text-red-500">*</span>
  </label>
  <select
    id="checkout-area"
    value={selectedAreaId}
    onChange={(e) => setSelectedAreaId(e.target.value)}
    required
    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
  >
    {activeAreas.map((area) => (
      <option key={area.id} value={area.id}>
        {dir === "rtl" ? area.nameAr : area.name} — {area.cost === 0 ? t("checkout.free") : `EGP ${area.cost}`} {area.deliveryTime ? `(${area.deliveryTime})` : ""}
      </option>
    ))}
  </select>
</div>
```

- [ ] **Step 3: Update WhatsApp message and Order submission**

Include the selected area in `form.area` and in the WhatsApp text:
```ts
*Customer Info:*
Name: ${form.name}
Phone: ${form.phone}
Area: ${dir === "rtl" ? selectedArea.nameAr : selectedArea.name}
Address: ${form.address}

Subtotal: EGP ${totalPrice().toFixed(2)}
Shipping (${dir === "rtl" ? selectedArea.nameAr : selectedArea.name}): ${shipping === 0 ? "Free" : `EGP ${shipping.toFixed(2)}`}
*Total: EGP ${total.toFixed(2)}*
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit Checkout changes**

```bash
git add src/app/checkout/page.tsx
git commit -m "feat(checkout): implement delivery area selector with dynamic shipping cost"
```

---

### Task 6: Cart Page & POS Orders Tab Updates

**Files:**
- Modify: `src/app/cart/page.tsx`
- Modify: `src/components/cashair/POSOrdersTab.tsx`

**Interfaces:**
- Consumes: `useSiteSettings().shippingAreas`, `order.customerInfo.area`
- Produces: Accurate shipping hint on `/cart`, delivery area badge in POS orders.

- [ ] **Step 1: Update `/cart` shipping summary line**

In `src/app/cart/page.tsx`:
- If `totalPrice() >= freeDeliveryMinPrice`: show `Free`.
- Otherwise: calculate minimum active area rate (e.g. `minCost`) and display:
  `EGP ${minCost.toFixed(2)} (${t("cart.shippingCalculated")})` or `{t("cart.shippingFrom", { amount: minCost.toFixed(2) })}`.

- [ ] **Step 2: Update `src/components/cashair/POSOrdersTab.tsx`**

Display `customerInfo.area` in the order card and detail modal:
```tsx
{selectedOrder.customerInfo?.area && (
  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
    {selectedOrder.customerInfo.area}
  </span>
)}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit Cart & POS updates**

```bash
git add src/app/cart/page.tsx src/components/cashair/POSOrdersTab.tsx
git commit -m "feat(cart,pos): display dynamic shipping estimates in cart and area badges in POS orders"
```

---

### Task 7: Build Verification & Final End-to-End Validation

**Files:**
- All touched files

- [ ] **Step 1: Run production build check**

Run: `npm run build`
Expected: Build succeeds with 0 errors and all static/dynamic routes compiled.

- [ ] **Step 2: Commit any remaining updates & verify clean git status**

Run: `git status`
Expected: Working tree clean.
