# Task 3: Admin Companies Management Panel, Product Brand Selector & Storefront Badges

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/products/page.tsx`
- Modify: `src/components/ProductCard.tsx`
- Modify: `src/app/products/[id]/page.tsx`

**Requirements & Global Constraints:**
1. In `src/app/admin/page.tsx`:
   - Add a dedicated **Companies / Brands Management** section/tab:
     - Company state (`companies: Company[]`, `newCompanyName`, `newCompanyLogo`, `newCompanyDesc`, `uploadingLogo`, `savingCompany`).
     - Logo upload with preview using the existing `/api/upload` endpoint and ImageKit.
     - Form to add new company with name, logo, optional description.
     - Visual listing of existing companies showing logo, company name, and delete button with confirmation modal.
     - Fetches from `GET /api/companies` and saves via `POST /api/companies`, `DELETE /api/companies/[id]`.
2. In `src/app/admin/products/page.tsx`:
   - Fetch companies from `GET /api/companies`.
   - In the Product Create/Edit modal:
     - Add a Company / Brand `<select>` dropdown populated with available companies (with default option: `"None / General"`).
     - Bind `form.company` to the selected company ID.
     - When saving product, pass `company: form.company || null`.
     - In the products listing table/cards, show the company name/logo badge next to category.
3. In `src/components/ProductCard.tsx`:
   - Add `company?: { _id: string; name: string; logo: string } | string;` to `ProductCardProps`.
   - If company exists and has a name/logo, render a subtle brand logo/pill badge next to category badge.
4. In `src/app/products/[id]/page.tsx`:
   - If product has a `company`, render the company logo and brand name badge on the carousel overlay and product details header.
5. Verification:
   - Run `npx tsc --noEmit`.
   - Commit with message: `feat(brands): add admin company management, product brand selector and storefront badges`.
