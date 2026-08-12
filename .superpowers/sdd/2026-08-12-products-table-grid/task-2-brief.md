# Task 2: Redesign ProductCard.tsx Matching the Reference

## Goal
Redesign `src/components/ProductCard.tsx` to match the exact visual layout and components from the Derhali reference image.

## Card Requirements
1. **Savings Badge (`وفر EGP ...`)**:
   - Check `dailyOffers` via `useSiteSettings()`.
   - If an active offer exists and `savingsAmount > 0`:
     - Render a red badge at the top corner with white text: `وفر EGP {savingsAmount}` in Arabic or `Save EGP {savingsAmount}` in English.
2. **Product Image Area**:
   - Square aspect ratio `aspect-square`, clean light background `bg-white dark:bg-card`, centered `object-contain` image with smooth hover zoom.
3. **Brand / Company Name**:
   - Uppercase centered text above title: `{companyName || category}` in `text-[11px] sm:text-xs font-bold text-muted/70 uppercase tracking-wider`.
4. **Product Title**:
   - Arabic high contrast bold title with `line-clamp-3`, `text-xs sm:text-sm font-bold text-foreground text-center leading-snug`.
5. **Pricing Breakdown**:
   - If discounted: Sale price in red `text-red-600 font-extrabold text-sm sm:text-base` and strikethrough original price `text-xs text-muted/70 line-through`.
   - If regular: `text-primary font-extrabold text-sm sm:text-base` (e.g., `EGP 5,314.00`).
6. **Stock Availability Indicator**:
   - Green indicator dot + `متوفرة` (`text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5`) when in stock.
   - Red dot + `غير متوفر` / `نفذت الكمية` when out of stock.
7. **Action Button ("أضف إلى السلة")**:
   - Full width cyan/teal button (`bg-[#0096c7] hover:bg-[#0077b6] text-white font-bold py-2.5 px-3 rounded-lg w-full text-xs sm:text-sm`).
   - Active / Added / Out-of-stock states with cart integration.
8. **View Mode Support**:
   - Support `viewMode?: "grid" | "list"` prop for smooth rendering in both grid (default) and horizontal list layouts.

## Files to modify
- `src/components/ProductCard.tsx`

## Report
Write report to `.superpowers/sdd/2026-08-12-products-table-grid/task-2-report.md`.
