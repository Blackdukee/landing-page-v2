# Hero Brands Showcase & Categorized Product Sections Implementation Plan (Arabic-First)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the homepage hero section into an interactive Arabic multi-brand/company spotlight and logo marquee (Option A), and dynamically display dedicated sections for every category featuring 4 products with Arabic "View All" navigation and smooth skeleton loading.

**Architecture:**
- Create `BrandHeroSection.tsx` tailored for Arabic RTL e-commerce to handle company data fetching (`/api/companies`), active brand spotlight card with 5s auto-rotation, thumbnail selectors, and CSS infinite logo marquee ribbon.
- Create `CategoryProductSection.tsx` to display category title, item count badge, "View All" link, and a 4-item responsive grid (`ProductCard`).
- Refactor `HomeClient.tsx` to mount `BrandHeroSection` and map through `/api/categories` with alternating section backgrounds and seamless data loading.
- Add rich Arabic copy and translations to `src/i18n/ar.ts` (and fallback `en.ts`).

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide React, TypeScript, MongoDB / Mongoose.

## Global Constraints
- **Arabic-First Design:** RTL direction, Cairo/Rubik typography, natural Egyptian e-commerce phrasing.
- WCAG AA compliant contrast ratio (minimum 4.5:1).
- Touch target minimum size of 44x44px.
- Zero layout shift (CLS < 0.1) with fixed image aspect ratios and skeleton loaders.
- `prefers-reduced-motion` respected on all marquee and slide transitions.
- **Do NOT push any git commits to remote repository until explicit confirmation from user.**

---

### Task 1: Arabic Localization Setup for Hero Brands & Category Sections

**Files:**
- Modify: `src/i18n/ar.ts`
- Modify: `src/i18n/en.ts`

**Interfaces:**
- Produces: Localized keys for `home.brandHeroBadge`, `home.brandHeroLine1`, `home.brandHeroLine2`, `home.brandHeroLine3`, `home.brandHeroDesc`, `home.browseByBrand`, `home.viewBrandProducts`, `home.authorizedPartner`, `home.allBrands`, `home.viewAllInCategory`, `home.productsCount`, `home.exploreMoreCategory`.

- [ ] **Step 1: Add Arabic localization keys in `src/i18n/ar.ts`**

```typescript
"home.brandHeroBadge": "وكيل معتمد وموزع رسمي ✦",
"home.brandHeroLine1": "تسوق أقوى المعدات من",
"home.brandHeroLine2": "أشهر العلامات",
"home.brandHeroLine3": "التجارية العالمية",
"home.brandHeroDesc": "اكتشف تشكيلة أصلية 100% من كبرى الشركات العالمية المتخصصة في المعدات والأدوات اليدوية والكهربائية بضمان الوكيل.",
"home.browseByBrand": "تصفح الماركات",
"home.viewBrandProducts": "تصفح منتجات {brand}",
"home.authorizedPartner": "شريك معتمد",
"home.allBrands": "جميع العلامات التجارية",
"home.viewAllInCategory": "عرض جميع منتجات {category}",
"home.productsCount": "({count} منتج)",
"home.exploreMoreCategory": "استكشف المزيد من قسم {category}",
"home.noCompanies": "لم يتم إضافة شركات بعد",
```

- [ ] **Step 2: Add fallback English keys in `src/i18n/en.ts`**

---

### Task 2: Build the `BrandHeroSection` Component (Option A - Arabic RTL)

**Files:**
- Create: `src/components/BrandHeroSection.tsx`
- Modify: `src/app/globals.css` (add smooth RTL marquee animation)

**Interfaces:**
- Consumes: `/api/companies` endpoint, `useTranslation()`, `useSiteSettings()`.
- Produces: Export default `BrandHeroSection({ companies, loading }: { companies: Company[], loading: boolean })`.

- [ ] **Step 1: Add marquee keyframes and RTL animation utility in `src/app/globals.css`**
- [ ] **Step 2: Implement `src/components/BrandHeroSection.tsx`** with:
  - Right-aligned Arabic typography and CTAs.
  - Interactive Brand Spotlight card with auto-rotation (5s), pause on hover, and thumbnail pills.
  - Smooth RTL infinite logo marquee ribbon.
  - Trust indicators (شحن فوري، إرجاع 14 يوم، دعم فني 24/7).

---

### Task 3: Build the `CategoryProductSection` Component (8 Products per Category)

**Files:**
- Create: `src/components/CategoryProductSection.tsx`

**Interfaces:**
- Consumes: `ProductCard`, `useTranslation()`, `category` object, `products` array.
- Produces: Export default `CategoryProductSection({ category, products, index }: CategoryProductSectionProps)`.

- [ ] **Step 1: Implement `src/components/CategoryProductSection.tsx`**
  - Category Badge with icon.
  - Category title & count indicator in Arabic.
  - Direct "عرض جميع منتجات الفئة ←" link.
  - Responsive 8-product grid (2 cols mobile, 3 cols tablet, 4 cols desktop).
  - Bottom "استكشف المزيد من هذا القسم" button.
  - Alternating section background colors.

---

### Task 4: Refactor `HomeClient.tsx` to Integrate All Sections

**Files:**
- Modify: `src/app/HomeClient.tsx`

**Interfaces:**
- Consumes: `BrandHeroSection`, `CategoryProductSection`, `DailyOffersSection`, `/api/companies`, `/api/categories`, `/api/products`.
- Produces: Complete Arabic-first homepage.

- [ ] **Step 1: Update state and data fetching in `HomeClient.tsx`**
- [ ] **Step 2: Mount `<BrandHeroSection />`, `<DailyOffersSection />`, dynamic `<CategoryProductSection />`s, and Values section.**

---

### Task 5: Verification & Visual Quality Check

- [ ] **Step 1: Test build and TypeScript correctness**
- [ ] **Step 2: Verify responsive layouts, RTL alignments, and no git remote push**
