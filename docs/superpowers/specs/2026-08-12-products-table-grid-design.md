# Products Page Table/Grid Layout & Card Redesign Specification

## 1. Overview
The goal is to update the `/products` page product display to match the reference design (Derhali tools e-commerce style). The layout will feature a clean 2-column table-grid structure on mobile viewports with dividing border lines, updated card information hierarchy, stock status, savings badge, and high-contrast call-to-action button.

## 2. Requirements & Visual Structure

### 2.1 Grid & Tabular Layout
- **Mobile (< 640px)**: Exactly 2 equal-width columns (`grid-cols-2`).
- **Tablet (640px - 1024px)**: 3 columns (`sm:grid-cols-3`).
- **Desktop (>= 1024px)**: 4 columns (`lg:grid-cols-4`).
- **Tabular Grid Styling**:
  - Border dividers between grid items (`border border-border/80` or unified table-grid container with cell dividers) creating the clean, structured table appearance shown in the reference screenshot.
  - Consistent cell heights with flex column distribution (`flex flex-col justify-between`).

### 2.2 Product Card Details (Matching Reference Screenshot)
- **Top Discount/Savings Badge**:
  - Positioned at the top corner of the image.
  - Red rectangular badge displaying savings amount (e.g. `وفر EGP 185.70`) or discount percentage when an active daily offer or discount is available.
- **Product Image**:
  - Centered square image container (`aspect-square`) with clean padding, white/light surface, and smooth hover interaction.
- **Brand / Manufacturer Header**:
  - Subtle uppercase label above the product title displaying the company/brand name (e.g. `TOTAL TOOLS` / company name) in muted text.
- **Product Title**:
  - Arabic typography styled with clean line-height and line-clamp (2-3 lines) to maintain equal row heights across the table grid.
- **Pricing Breakdown**:
  - **Discounted items**: Large bold red price (`EGP 3,528.30`) with original strikethrough price (`EGP 3,714.00`).
  - **Regular items**: Large bold cyan/primary price (`EGP 5,314.00`).
- **Availability / Stock Status**:
  - Green circular indicator dot with Arabic text `متوفرة` when in stock.
  - Red indicator dot with `غير متوفر` or `نفذت الكمية` when out of stock.
- **Call-to-Action Button**:
  - Full-width vibrant cyan/teal button (`bg-primary` / `#0096c7`) with white text `أضف إلى السلة`.
  - Immediate visual feedback on click (added state / quantity indicator / out-of-stock disablement).

### 2.3 Toolbar & Controls (ProductsClient)
- **Header & Search Bar**: Integrated search input, Sort dropdown (`رتب حسب`), Filter button (`فلتر`), and active filter counts.
- **View Toggle**: Grid mode (default 2-column table grid) and List mode support.

## 3. Implementation Files
1. `src/components/ProductCard.tsx`: Update card markup, styles, savings badge calculation (`وفر EGP ...`), brand tag, pricing color logic, stock status dot (`متوفرة`), and full-width button.
2. `src/app/products/ProductsClient.tsx`: Update grid container classes to ensure clean 2-column table grid lines, toolbar controls, and loading skeletons matching the 2-column layout.
3. `src/i18n/ar.ts` & `src/i18n/en.ts`: Ensure all needed keys (`card.saveAmount`, `card.inStockStatus`, etc.) are present and localized.

## 4. Verification Plan
- Verify 2-column mobile responsiveness across mobile viewports (375px, 414px, etc.).
- Verify discount calculation and `وفر EGP {amount}` badge display for products with active offers.
- Verify availability status indicator (`متوفرة` / `غير متوفر`).
- Verify Add to Cart button behavior, cart counter, and disabled states when out of stock.
