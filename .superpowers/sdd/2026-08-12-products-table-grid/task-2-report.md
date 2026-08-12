# Task 2 Report: Redesign ProductCard.tsx Matching Reference

## Status: COMPLETE

## Executive Summary
`src/components/ProductCard.tsx` has been redesigned to align with the Derhali reference layout specs, supporting both grid and horizontal list view modes, while ensuring 100% backward compatibility for all existing parent components.

## Changes Made
1. **Savings Badge (`وفر EGP ...` / `Save EGP ...`)**:
   - Integrated with `useSiteSettings()` daily offers.
   - Positioned as a prominent red badge (`bg-red-600 font-extrabold text-white`) at the top corner of the card image area whenever `savingsAmount > 0`.

2. **Product Image Area**:
   - Clean light/card background (`bg-white dark:bg-card`) with `aspect-square`.
   - `object-contain` centering for clean product presentation.
   - Smooth hover zoom effect (`group-hover:scale-105 transition-transform duration-500`).

3. **Brand / Company Name**:
   - Placed above the product title as uppercase tracking text (`text-[11px] sm:text-xs font-bold text-muted-foreground/70 uppercase tracking-wider`).
   - Supports both company object/string representations with fallback to `category`.

4. **Product Title**:
   - Configured with `line-clamp-3`, `text-xs sm:text-sm font-bold text-foreground leading-snug`.
   - Centered alignment in grid mode with fixed vertical min-height for uniform card grid heights.

5. **Pricing Breakdown**:
   - High contrast display with `EGP {price}` formatting.
   - For active offer items: red sale price (`text-red-600 font-extrabold text-sm sm:text-base`) with strikethrough original price (`line-through text-xs text-muted-foreground/70`).
   - For regular items: bold primary price (`text-primary font-extrabold text-sm sm:text-base`).

6. **Stock Availability Indicator**:
   - Green indicator dot + `متوفرة` (`text-emerald-600 dark:text-emerald-400 text-xs font-semibold`) when stock > 0.
   - Red dot + `غير متوفر` (`text-red-600 dark:text-red-400`) when out of stock.

7. **Action Button ("أضف إلى السلة")**:
   - Styled using full width cyan theme (`bg-[#0096c7] hover:bg-[#0077b6] text-white font-bold py-2.5 px-3 rounded-lg w-full text-xs sm:text-sm`).
   - Handles full cart state integration (Adding, Quantity in Cart badge, Out of stock state).

8. **View Mode Support**:
   - Added optional `viewMode?: "grid" | "list"` prop.
   - Grid mode renders structured vertical card layout.
   - List mode renders a horizontal side-by-side row layout for list views.

9. **Verification**:
   - `npx tsc --noEmit` executed clean with zero TypeScript compilation errors.
