# Products Page Table/Grid Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the `/products` page into a 2-column mobile table/grid layout matching the Derhali reference design with structured borders, red savings badge, brand title hierarchy, stock status indicator, and full-width action button.

**Architecture:** Update `ProductCard.tsx` to encapsulate the card presentation (savings badge, brand label, price display with strikethrough, stock status dot, full-width CTA) and update `ProductsClient.tsx` to render a 2-column table-grid with dividing borders, view switcher, and toolbar controls.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, Zustand (cart store).

## Global Constraints
- Mobile layout must strictly be 2 columns (`grid-cols-2`) on viewports < 640px.
- Tablet layout: 3 columns (`sm:grid-cols-3`), Desktop layout: 4 columns (`lg:grid-cols-4`).
- Support Arabic RTL properly alongside English LTR.
- Maintain cart persistence and active offer discount calculations.

---

### Task 1: Add Localization Strings for Card Elements

**Files:**
- Modify: `src/i18n/ar.ts`
- Modify: `src/i18n/en.ts`

**Interfaces:**
- Consumes: None
- Produces: `card.saveAmount`, `card.inStockStatus`, `card.outOfStockStatus`, `products.viewGrid`, `products.viewList`

- [ ] **Step 1: Update Arabic translations (`src/i18n/ar.ts`)**
Add translation keys for:
```typescript
"card.saveAmount": "وفر {amount}",
"card.inStockStatus": "متوفرة",
"card.outOfStockStatus": "غير متوفر",
"products.viewGrid": "عرض شبكي",
"products.viewList": "عرض قائمة",
```

- [ ] **Step 2: Update English translations (`src/i18n/en.ts`)**
Add translation keys for:
```typescript
"card.saveAmount": "Save {amount}",
"card.inStockStatus": "In Stock",
"card.outOfStockStatus": "Out of Stock",
"products.viewGrid": "Grid View",
"products.viewList": "List View",
```

- [ ] **Step 3: Verify TypeScript builds without errors**
Run: `npm run lint` or type check

- [ ] **Step 4: Commit**
```bash
git add src/i18n/ar.ts src/i18n/en.ts
git commit -m "feat(i18n): add translations for table grid cards and view toggles"
```

---

### Task 2: Redesign `ProductCard.tsx` Matching the Reference

**Files:**
- Modify: `src/components/ProductCard.tsx`

**Interfaces:**
- Consumes: `ProductCardProps` (`id`, `name`, `description`, `price`, `image`, `category`, `company`, `stock`, optional `viewMode`)
- Produces: Updated `<ProductCard />` component with Derhali styling

- [ ] **Step 1: Update `ProductCard.tsx` structure and layout**
Implement:
1. Savings amount calculation:
   ```typescript
   const savingsAmount = activeOffer
     ? (price - salePrice).toFixed(2)
     : 0;
   ```
2. Red savings badge on the corner (`وفر EGP 185.70` or `وفر {amount}`):
   ```tsx
   {activeOffer && Number(savingsAmount) > 0 && (
     <div className="absolute top-0 start-0 z-10 bg-red-600 text-white text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-br-lg shadow-sm">
       {locale === "ar" ? `وفر EGP ${savingsAmount}` : `Save EGP ${savingsAmount}`}
     </div>
   )}
   ```
3. Brand / Manufacturer header above the title:
   ```tsx
   <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted/80 text-center sm:text-start mb-1">
     {companyName || category}
   </div>
   ```
4. Arabic title with multi-line clamp (e.g. `line-clamp-2` or `line-clamp-3`), dark high contrast font.
5. Price section:
   - When discounted: Sale price in prominent red `text-red-600 font-extrabold text-sm sm:text-base` and strikethrough original price `text-xs text-muted line-through`.
   - When regular: Price in teal/cyan `text-primary font-bold text-sm sm:text-base`.
6. Availability status indicator:
   - Green dot with `متوفرة` when stock > 0, red dot with `غير متوفر` when stock <= 0.
7. Full-width cyan/teal button (`bg-[#0096c7] hover:bg-[#0077b6] text-white font-bold py-2.5 px-3 rounded-lg w-full mt-2`):
   - Text: `أضف إلى السلة` / `Add to Cart`.

- [ ] **Step 2: Test ProductCard in isolation**
Verify all props, daily offer pricing calculations, and cart interaction work smoothly.

- [ ] **Step 3: Commit**
```bash
git add src/components/ProductCard.tsx
git commit -m "feat(ProductCard): redesign card with table cell styling, savings badge, brand title, and stock indicator"
```

---

### Task 3: Update `ProductsClient.tsx` Table Grid & Toolbar

**Files:**
- Modify: `src/app/products/ProductsClient.tsx`

**Interfaces:**
- Consumes: `<ProductCard />`, `useSiteSettings`, `useTranslation`
- Produces: Complete table grid product listing with 2-column mobile layout, dividing borders, view toggle, and loading states.

- [ ] **Step 1: Add View Mode State and Toolbar Controls**
Add `viewMode` state (`"grid" | "list"`):
- Add List / Grid view toggle buttons in the toolbar (`LayoutGrid` and `List` icons).
- Refine sort dropdown and filter toggle styling.

- [ ] **Step 2: Implement Table Grid Container Styling**
Update the grid container on mobile to render 2 columns with tabular border lines:
```tsx
<div className={
  viewMode === "grid"
    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border border-border/80 rounded-2xl overflow-hidden bg-border/40 gap-[1px]"
    : "flex flex-col gap-3"
}>
  {filteredProducts.map((p) => (
    <div key={p._id} className="bg-card">
      <ProductCard {...p} viewMode={viewMode} />
    </div>
  ))}
</div>
```
Note: Using `gap-[1px] bg-border/40` or explicit border dividers creates the exact clean, unified table-grid border effect between cards seen in the screenshot without messy double borders.

- [ ] **Step 3: Update Loading Skeletons**
Update skeleton cards to match the new 2-column table grid dimensions and layout.

- [ ] **Step 4: Commit**
```bash
git add src/app/products/ProductsClient.tsx
git commit -m "feat(products): implement 2-column mobile table grid layout with border dividers and view switcher"
```

---

### Task 4: Verification & Build Check

**Files:**
- Test/Check: Whole project build via `npm run build`

- [ ] **Step 1: Run Next.js build to check for type and compilation errors**
Run: `npm run build`
Expected: 0 compilation errors

- [ ] **Step 2: Verify responsive rendering and interactive states**
Ensure:
1. Exactly 2 columns on mobile viewport (< 640px).
2. Clean grid divider lines between cards.
3. Red savings badge displayed for discounted items.
4. Green availability dot with "متوفرة".
5. Add to cart button functions and updates cart state seamlessly.

- [ ] **Step 3: Final Commit**
```bash
git commit --allow-empty -m "chore(products): verify table-grid layout implementation"
```
