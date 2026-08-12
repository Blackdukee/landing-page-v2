# Task 3: Update ProductsClient.tsx Table Grid & Toolbar

## Goal
Update `src/app/products/ProductsClient.tsx` to render the products in a 2-column tabular grid on mobile with border dividers, and provide top toolbar controls (Grid/List toggle, sort, filter).

## Requirements
1. **View Mode State**:
   - `const [viewMode, setViewMode] = useState<"grid" | "list">("grid");`
2. **Toolbar Integration**:
   - Include Grid view (`LayoutGrid`) and List view (`List`) switcher buttons.
   - Include Sort select dropdown (`رتب حسب`).
   - Include Filter button with active filter counter (`فلتر`).
   - Search input.
3. **Table Grid Layout**:
   - In Grid mode:
     - 2 columns on mobile: `grid-cols-2`
     - 3 columns on tablet: `sm:grid-cols-3`
     - 4 columns on desktop: `lg:grid-cols-4`
     - Structured table appearance with border grid dividing lines:
       `border border-border/80 rounded-2xl overflow-hidden bg-border/40 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[1px]`
     - Each child wrapped in `bg-card flex flex-col h-full` so `ProductCard` renders cleanly inside each table cell.
   - In List mode:
     - Single column vertical stack (`flex flex-col gap-3`).
4. **Loading Skeletons**:
   - Update skeleton loaders to use the same 2-column table grid structure.
5. **Preserve All Existing Features**:
   - URL parameter synchronization (`category`, `company`), infinite scrolling observer, brand/category header badges, filter modal.

## Files to modify
- `src/app/products/ProductsClient.tsx`

## Report
Write report to `.superpowers/sdd/2026-08-12-products-table-grid/task-3-report.md`.
