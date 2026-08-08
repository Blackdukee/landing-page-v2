# Task 1: Company Model, Product Schema Update & Company API Endpoints

**Files:**
- Create: `src/models/Company.ts`
- Modify: `src/models/Product.ts`
- Create: `src/app/api/companies/route.ts`
- Create: `src/app/api/companies/[id]/route.ts`
- Modify: `src/app/api/products/route.ts`
- Modify: `src/app/api/products/[id]/route.ts`

**Requirements & Global Constraints:**
1. In `src/models/Company.ts`:
   - Create and export `ICompany` interface:
     ```typescript
     export interface ICompany extends Document {
       name: string;
       logo: string;
       description?: string;
       createdAt: Date;
       updatedAt: Date;
     }
     ```
   - Create `CompanySchema` with `name` (String, required, trim), `logo` (String, required, trim), `description` (String, default: "").
   - Export `const Company = mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema)`.
2. In `src/models/Product.ts`:
   - Update `IProduct` interface: `company?: mongoose.Types.ObjectId | string | null;`
   - Update `ProductSchema`: `company: { type: Schema.Types.ObjectId, ref: "Company", default: null }`
   - Add index: `ProductSchema.index({ company: 1 });`
3. In `src/app/api/companies/route.ts`:
   - `GET`: public, returns all companies sorted by `name` ascending (`dbConnect()`, `Company.find().sort({ name: 1 }).lean()`).
   - `POST`: admin only (checks `admin-token` cookie). Validates `name` and `logo`, creates company, returns 201 with created company document.
4. In `src/app/api/companies/[id]/route.ts`:
   - `PUT`: admin only. Updates `name`, `logo`, `description`.
   - `DELETE`: admin only. Deletes company and unlinks it from products (`Product.updateMany({ company: id }, { $set: { company: null } })`).
5. In `src/app/api/products/route.ts` & `src/app/api/products/[id]/route.ts`:
   - Ensure `Company` model is imported so Mongoose registers the schema.
   - In `GET` queries, add `.populate("company", "name logo")` so product listing and detail queries return populated company data.
   - In `POST` / `PUT` of products route, accept `company` (validating string or ObjectId, saving `company: companyId || null`).
6. Verification:
   - Run `npx tsc --noEmit`.
   - Commit with message: `feat(company): add company model, product reference, and CRUD API endpoints`.
