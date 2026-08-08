# UI/UX & Quality Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all critical UI/UX bugs, stock overflow glitches, accessibility failures (contrast & aria-labels), touch target constraints, mobile carousel behavior, and checkout pop-up blockers across the QuesnaShop e-commerce application.

**Architecture:** Maintain client-side Zustand cart persistence with server-validated stock checks; standardize Tailwind design tokens (elevating muted text contrast to ≥4.5:1 WCAG AA); introduce responsive, accessible component patterns for ProductCard, ImageCarousel, Cart, and Checkout flows.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, Lucide React, Mongoose.

## Global Constraints

- Preserve all existing translations (`en.ts` and `ar.ts`) and RTL/LTR bidirectional support.
- Adhere strictly to WCAG 2.1 AA (minimum 4.5:1 text contrast ratio, visible focus states, semantic labels for icon buttons).
- Ensure all clickable/interactive touch targets meet minimum 44×44px tap areas on mobile and touch devices.
- No layout shifts (CLS < 0.1): Skeletons and cards must share matching dimensions.
- Zero raw `window.open` calls that fail browser pop-up blocker heuristics in async handlers.

---

## File Structure & Responsibility Map

| File Path | Responsibility | Changes |
| :--- | :--- | :--- |
| `src/store/cart.ts` | Cart global state management | Add bulk/safe quantity validation helper; ensure strict stock checking |
| `src/components/ProductCard.tsx` | Product grid item display & cart interaction | Fix button state (no solitary trash button on add), show stock limit feedback, fix touch visibility & contrast |
| `src/app/products/[id]/page.tsx` | Product detail page | Fix atomic add-to-cart, prevent full-page disappearance on error, fix contrast on stock pills |
| `src/components/ImageCarousel.tsx` | Gallery, lightbox, and zoom | Remove mobile raw URL popup; enable responsive in-app modal with 44px touch targets & aria-labels |
| `src/app/cart/page.tsx` | Shopping cart view & summary | Fix 44px stepper touch targets, replace invisible `text-primary-light` (1.15:1 contrast), add clear confirmation |
| `src/app/checkout/page.tsx` | WhatsApp checkout flow | Fix pop-up blocker by direct navigation/action fallback, add Egypt-friendly address formatting, add submit loading state |
| `src/app/globals.css` | Global CSS variables & design tokens | Fix `--color-muted` to `#4b5563` (meets WCAG 4.5:1 AA contrast); define clean utility classes |
| `src/components/Navbar.tsx` | Header navigation | Add `aria-label`s on icon buttons, lock scroll when mobile drawer is open, add backdrop dismiss |
| `src/components/Footer.tsx` | Footer & social links | Add `aria-label`s to social SVGs, fix undefined `text-primary-dark` class, resolve dead `#` links |
| `src/app/page.tsx` | Landing page | Uncomment and polish hero description and CTAs; fix skeleton aspect ratio matching cards |

---

### Task 1: Cart Store & ProductCard Stock UX Fixes

**Files:**
- Modify: `src/store/cart.ts:13-92`
- Modify: `src/components/ProductCard.tsx:1-175`

**Interfaces:**
- `addItem(item: Omit<CartItem, "quantity">, stock?: number, qtyToAdd?: number): boolean`
- `canAddMore(productId: string, stock: number): boolean`

- [ ] **Step 1: Update cart store to support safe quantity additions**

Edit `src/store/cart.ts` to allow adding arbitrary quantity and checking available capacity:

```typescript
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, stock?: number, qtyToAdd?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, stock?: number) => boolean;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  getItemQuantity: (productId: string) => number;
  canAddMore: (productId: string, stock: number) => boolean;
}
```

Implement `canAddMore` and enhance `addItem`:
```typescript
addItem: (item, stock, qtyToAdd = 1) => {
  const effectiveStock = stock !== undefined ? stock : (item.stock ?? Infinity);
  const existing = get().items.find((i) => i.productId === item.productId);
  const currentQty = existing ? existing.quantity : 0;
  const newQuantity = currentQty + qtyToAdd;

  if (newQuantity > effectiveStock || effectiveStock <= 0) {
    return false;
  }

  if (existing) {
    set({
      items: get().items.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: newQuantity, stock: effectiveStock }
          : i
      ),
    });
  } else {
    set({
      items: [...get().items, { ...item, quantity: newQuantity, stock: effectiveStock }],
    });
  }
  return true;
},
canAddMore: (productId, stock) => {
  const existing = get().items.find((i) => i.productId === productId);
  const currentQty = existing ? existing.quantity : 0;
  return currentQty < stock && stock > 0;
}
```

- [ ] **Step 2: Refactor `ProductCard.tsx` button and stock badge UX**

Edit `src/components/ProductCard.tsx` to:
1. Allow adding items progressively until `quantityInCart >= stock`.
2. Replace the abrupt "Remove from Cart" button on desktop with an intuitive state:
   - When not in cart: "Add to Cart" button.
   - When in cart and stock available: "Add to Cart" with a subtle quantity indicator (`+ (1 in cart)`).
   - When `quantityInCart >= stock`: Disabled with "Max in cart" / "Sold Out" styling (`opacity-60 cursor-not-allowed`).
3. Make buttons accessible on both mobile and touch screens (don't hide with `opacity-0` on hover-less viewports).
4. Replace low-contrast red alert and invalid `text-primary-600` with compliant WCAG tokens.

- [ ] **Step 3: Verify with local linting and compilation**

Run: `npm run lint` or `npx tsc --noEmit` to verify type safety and ensure no runtime regressions.

- [ ] **Step 4: Commit Task 1 changes**

```bash
git add src/store/cart.ts src/components/ProductCard.tsx
git commit -m "fix(cart): resolve product card add-to-cart stock validation and button state UX"
```

---

### Task 2: Product Detail Page & ImageCarousel Responsive Lightbox

**Files:**
- Modify: `src/app/products/[id]/page.tsx:36-378`
- Modify: `src/components/ImageCarousel.tsx:35-378`

**Interfaces:**
- Carousel component handles responsive pinch/zoom and fullscreen lightbox without external tab navigation.
- Product detail handles stock boundary and keeps page mounted on error.

- [ ] **Step 1: Fix Product Detail add-to-cart and error recovery**

Edit `src/app/products/[id]/page.tsx`:
1. Refactor `handleAddToCart` to call `addItem(product, product.stock, quantity)` in a single atomic call instead of a loop.
2. Prevent error states during cart actions from unmounting the entire product into "Product Not Found". Keep "Product Not Found" solely for 404 API responses on initial load.
3. Update stock availability badges to use WCAG AA compliant contrast colors:
   - In Stock: `text-emerald-700 bg-emerald-50 border border-emerald-200`
   - Out of Stock: `text-red-700 bg-red-50 border border-red-200`
   - Low Stock notice: `text-amber-800 bg-amber-50 border border-amber-200`

- [ ] **Step 2: Fix `ImageCarousel.tsx` mobile behavior and accessibility**

Edit `src/components/ImageCarousel.tsx`:
1. Remove `if (isMobile) { window.open(images[index], "_blank"); }` in `handleImageClick`.
2. Allow mobile users to tap the image to open the in-app portal lightbox with touch swipe navigation.
3. Ensure all control buttons have explicit `aria-label` attributes (`"Zoom in"`, `"Zoom out"`, `"Close preview"`, `"Previous image"`, `"Next image"`).
4. Expand carousel dot indicators to have at least `44×44px` interactive touch padding.

- [ ] **Step 3: Verify Product Detail and Carousel**

Run `npx tsc --noEmit` to check for TypeScript errors.

- [ ] **Step 4: Commit Task 2 changes**

```bash
git add src/app/products/[id]/page.tsx src/components/ImageCarousel.tsx
git commit -m "fix(product-detail): fix atomic cart add, in-app mobile carousel lightbox and accessible controls"
```

---

### Task 3: Cart Page Touch Targets, Contrast & Confirmation Dialog

**Files:**
- Modify: `src/app/cart/page.tsx:1-232`

- [ ] **Step 1: Fix Stepper Touch Targets and Color Contrast**

Edit `src/app/cart/page.tsx`:
1. Expand stepper Minus and Plus button touch targets to `min-w-[44px] min-h-[44px]` (or `h-10 w-10` with expanded padding) to satisfy WCAG touch standards.
2. Replace `text-primary-light` on line 201 (`freeShippingHint`) with `text-primary font-medium` to achieve >4.5:1 contrast against white backgrounds.
3. Add accessible `aria-label="Decrease quantity"` and `aria-label="Increase quantity"` to stepper controls.
4. Add `aria-label="Remove item"` to the `Trash2` button.

- [ ] **Step 2: Add Clear Cart Confirmation Modal**

Add a lightweight confirmation modal before executing `clearCart()` so users don't accidentally lose their selections with a single mis-tap.

- [ ] **Step 3: Commit Task 3 changes**

```bash
git add src/app/cart/page.tsx
git commit -m "fix(cart-page): expand touch targets to 44px, fix color contrast and add clear cart confirmation"
```

---

### Task 4: Checkout Flow & Pop-up Blocker Resolution

**Files:**
- Modify: `src/app/checkout/page.tsx:1-304`

- [ ] **Step 1: Fix asynchronous WhatsApp popup blocking**

Edit `src/app/checkout/page.tsx`:
1. In `handleSubmit`, add a `loading` state to prevent double-submission.
2. Synchronously generate the WhatsApp URL and direct the browser using `window.location.href = url` (or provide a prominent "Click here if WhatsApp didn't open automatically" button on the success screen as a robust fallback).
3. Enhance address inputs with structured guidance for Egyptian delivery (e.g., City / Governorate, Street, Building / Apt).
4. Add accessible labels and focus styles to all checkout form fields.

- [ ] **Step 2: Verify Checkout Flow**

Run `npx tsc --noEmit`.

- [ ] **Step 3: Commit Task 4 changes**

```bash
git add src/app/checkout/page.tsx
git commit -m "fix(checkout): resolve popup blocker on WhatsApp redirect and enhance address form"
```

---

### Task 5: Global Accessibility, Contrast & Layout Polish

**Files:**
- Modify: `src/app/globals.css:1-88`
- Modify: `src/components/Navbar.tsx:1-139`
- Modify: `src/components/Footer.tsx:1-109`
- Modify: `src/app/page.tsx:1-274`
- Modify: `src/app/products/page.tsx:1-440`

- [ ] **Step 1: Fix `--color-muted` in `globals.css`**

Update `src/app/globals.css`:
```css
--color-muted: #52525b; /* Zinc 600 - 5.5:1 contrast ratio against white */
--color-muted-light: #f4f4f5;
```
Ensure focus-visible styles are globally accessible.

- [ ] **Step 2: Polish `Navbar.tsx` & `Footer.tsx`**

1. In `src/components/Navbar.tsx`:
   - Add `aria-label="Change language"`, `aria-label="Shopping Cart"`, and `aria-label="Toggle navigation menu"` to header buttons.
   - When mobile menu is open, apply `overflow-hidden` to `document.body` and provide a clickable backdrop overlay to close.
2. In `src/components/Footer.tsx`:
   - Replace undefined `text-primary-dark` with `text-foreground font-semibold`.
   - Add `aria-label="Instagram"`, `aria-label="Twitter"`, and `aria-label="Email support"` to social links.
   - Replace dead `#` links with active links to `/products` or WhatsApp customer service.

- [ ] **Step 3: Restore Hero CTAs & Fix CLS in `page.tsx` & `products/page.tsx`**

1. In `src/app/page.tsx`:
   - Uncomment and restore the Hero subtitle description and primary action buttons ("Explore Collection" & "See Featured").
   - Align skeleton loading placeholder height/aspect ratio to match the real `ProductCard` height, eliminating CLS.
2. In `src/app/products/page.tsx`:
   - Match skeleton aspect ratio with real product cards.
   - Ensure filter controls and search reset button have accessible labels.

- [ ] **Step 4: Run full verification suite**

1. Run `npm run lint` or `npx tsc --noEmit`
2. Run `npm run build` to confirm production bundle builds cleanly.

- [ ] **Step 5: Commit Task 5 changes**

```bash
git add src/app/globals.css src/components/Navbar.tsx src/components/Footer.tsx src/app/page.tsx src/app/products/page.tsx
git commit -m "fix(ui-ux): elevate text contrast to WCAG AA, add aria-labels, fix CLS and restore hero CTAs"
```

---

## Plan Verification Checklist

- [ ] Every task has clear file paths, interfaces, exact code changes, and test/verification steps.
- [ ] No placeholders or vague "TBD" items.
- [ ] Direct resolution of all issues reported in TODO.md and the UI/UX audit.
- [ ] WCAG 2.1 AA contrast compliance verified for light mode.
