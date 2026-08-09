# Hero Brands Showcase & Categorized Product Sections Specification (Arabic-First)

## 1. Overview
This feature transforms the landing page (`HomeClient.tsx`) of **QuesnaShop** into a high-converting, brand-driven e-commerce experience tailored specifically for the **Arabic market**. It replaces the generic hero with an **Authorized Brands & Companies Showcase** (Option A: Hybrid Brand Spotlight + Infinite Logo Marquee in Arabic) and introduces **Dedicated Category-by-Category Product Sections** (each displaying 8 products with an Arabic "View All" gateway).

---

## 2. Architecture & Data Flow

### 2.1 Hero Brand Section Data
- **Source:** `GET /api/companies`
- **Output:** Array of `Company` documents (`_id`, `name`, `logo`, `description`).
- **State Management:**
  - `companies: Company[]` loaded on initial render.
  - `activeCompanyIndex: number` rotating automatically every 5 seconds (paused on hover/touch).
  - Direct routing: Clicking a company card or logo navigates to `/products?company={company._id}`.

### 2.2 Category Sections Data
- **Source 1:** `GET /api/categories` → Array of `Category` documents (`_id`, `name`, `slug`, `description`).
- **Source 2:** `GET /api/products?limit=100` (or per-category query `GET /api/products?category={name}&limit=8`).
  - Optimization: Fetch all active products or fetch top 8 products grouped by category to eliminate N+1 network requests.
- **Data Structure:**
  ```typescript
  interface CategoryWithProducts {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    products: Product[];
    totalCount: number;
  }
  ```

---

## 3. UI/UX Specifications (Arabic First & RTL Optimized)

### 3.1 Hero Section: Hybrid Brand Spotlight & Logo Marquee (Option A)

```
┌────────────────────────────────────────────────────────────────────────┐
│  [✦ وكيل وموزع معتمد لكبرى الماركات العالمية]                              │
│                                                                        │
│  [ Right Column (RTL Start): نصوص البطل والروابط ] [ Left: بطاقة الماركة ]│
│  • العنوان: تسوق أقوى المعدات والأدوات         • بطاقة تفاعلية عائمة     │
│    من كبرى الشركات والعلامات التجارية           • شعار الشركة (TOTAL/Crown)│
│  • الوصف: منتجات أصلية 100%، بضمان معتمد      • نبذة عن الشركة والمنتجات │
│    وشحن فوري لجميع المحافظات بأفضل الأسعار      • زر: "تصفح منتجات [الشركة]"│
│  • الأزرار: [تصفح جميع المنتجات] [تصفح الماركات]  • مؤشرات التنقل والتحديد  │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────  │
│  [ شريط متحرك لا نهائي لشعارات الماركات: TOTAL ✦ CROWN ✦ INGCO ✦ ... ]  │
│  [ شارات الضمان: توصيل سريع | إرجاع خلال 14 يوم | دعم فني متواصل 24/7 ] │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Brand Spotlight Card (بطاقة الماركة المميزة)**:
   - Glassmorphic container with 3D hover elevation and ambient glow (`glow-blue`).
   - Displays current brand logo, verified dealer badge ("شريك معتمد"), description, and direct button to that company's products.
   - Interactive dot indicators and thumbnail selector to switch between companies instantly.
2. **Infinite Brand Logo Marquee (شريط شعارات الماركات المتحرك)**:
   - CSS-accelerated infinite horizontal scroll of company logos in smooth RTL direction.
   - Pauses on hover/focus.
   - Respects `prefers-reduced-motion` (turns into a neat wrap grid if motion is disabled).
   - High-contrast logos with smooth grayscale-to-color hover transition.
3. **Trust Indicators (شارات الثقة)**:
   - شحن وتوصيل فوري، ضمان الجودة الأصلية، دعم فني متخصص.

---

### 3.2 Categorized Product Sections (8 منتجات لكل قسم)

لكل فئة مسجلة في المتجر:

```
┌────────────────────────────────────────────────────────────────────────┐
│  [شارة الفئة مع الأيقونة]                                              │
│  [اسم الفئة] ─── (8 منتجات متوفرة)                     [عرض جميع المنتجات ←] │
│  [وصف الفئة إن وجد]                                                    │
├────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ ProductCard  │  │ ProductCard  │  │ ProductCard  │  │ ProductCard  ││
│  │    منتج 1    │  │    منتج 2    │  │    منتج 3    │  │    منتج 4    ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ ProductCard  │  │ ProductCard  │  │ ProductCard  │  │ ProductCard  ││
│  │    منتج 5    │  │    منتج 6    │  │    منتج 7    │  │    منتج 8    ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                                        │
│                     [ زر: استكشف المزيد من قسم [اسم الفئة] ← ]          │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Section Header (رأس قسم الفئة)**:
   - Category icon / badge with pill styling.
   - Large bold Arabic typography (`text-2xl sm:text-3xl font-bold font-sans`).
   - Item counter and optional category description.
   - Direct link: `Link href="/products?category={category.name}"` with directional arrow (`rotate-180` in RTL).
2. **Product Grid (شبكة المنتجات)**:
   - **8 items per category** (2 cols mobile, 3 cols tablet, 4 cols desktop).
   - Utilizes `ProductCard` component with:
     - Real-time stock status & low-stock warning.
     - Flash sale / Daily offer badge integration.
     - Company logo watermark & category badge.
     - Instant "Add to Cart" button with quantity feedback.
3. **Section Alternating Rhythm**:
   - Even sections: `bg-background`
   - Odd sections: `bg-surface/60 border-y border-border/60`
4. **Empty State & Loading**:
   - Skeleton grid (8 animated skeleton cards per category section) during loading.
   - Categories with 0 products are automatically omitted from the homepage view to prevent clutter.

---

### 3.3 Arabic Localization (i18n) Keys

**`src/i18n/ar.ts`**:
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

---

## 4. Accessibility & UI/UX Pro Max Rules

1. **Arabic Font Hierarchy:** Cairo & Rubik fonts with clear weights (Medium for body, Bold for headers).
2. **Touch Targets:** All clickable brand cards, pagination dots, and product action buttons have a minimum footprint of `44x44px`.
3. **Contrast:** High text contrast (`foreground: #1c1c1e`, `muted: #4b5563`, white text on badges meets WCAG AA 4.5:1).
4. **Motion Safety:** All animations (marquee, spotlight crossfade, pulse effects) obey `@media (prefers-reduced-motion: reduce)`.
5. **Icons:** Strict use of SVG Lucide icons (`Sparkles`, `ShieldCheck`, `ChevronLeft`, `ArrowLeft`, `Tag`, `Award`, `Truck`, `Headphones`). No emoji icons.
6. **No Layout Shift (CLS < 0.1):** Aspect ratios are strictly defined for logos (`w-auto h-8 sm:h-10`) and product cards (`aspect-square`).
