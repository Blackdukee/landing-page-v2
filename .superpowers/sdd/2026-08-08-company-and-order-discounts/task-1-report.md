# Task 1 Report: Company Model, Product Schema Update & Company API Endpoints

## Implementation Summary

### 1. Created `Company` Model (`src/models/Company.ts`)
- Defined `ICompany` interface with `name`, `logo`, `description`, `createdAt`, `updatedAt`.
- Implemented `CompanySchema` with `name` (required, trim), `logo` (required, trim), `description` (default: `""`), and automatic timestamps (`createdAt`, `updatedAt`).
- Exported `Company` Mongoose model.

### 2. Updated `Product` Model (`src/models/Product.ts`)
- Updated `IProduct` interface to include `company?: mongoose.Types.ObjectId | string | null`.
- Added `company` field reference to `ProductSchema` (`type: Schema.Types.ObjectId, ref: "Company", default: null`).
- Added index `ProductSchema.index({ company: 1 })`.

### 3. Created Companies API Endpoints
- `src/app/api/companies/route.ts`:
  - `GET`: Public endpoint returning all companies sorted by `name` ascending (`Company.find().sort({ name: 1 }).lean()`).
  - `POST`: Admin endpoint (`admin-token` cookie validation). Validates `name` and `logo`, creates company document, returns HTTP 201.
- `src/app/api/companies/[id]/route.ts`:
  - `PUT`: Admin endpoint (`admin-token` cookie validation). Updates company details (`name`, `logo`, `description`) by ID.
  - `DELETE`: Admin endpoint (`admin-token` cookie validation). Deletes company document by ID and unlinks referenced products (`Product.updateMany({ company: id }, { $set: { company: null } })`).

### 4. Updated Products API Endpoints
- `src/app/api/products/route.ts`:
  - Imported `Company` model so schema is registered with Mongoose.
  - Updated `GET` queries (both all & paginated) to populate `company` field (`.populate("company", "name logo")`).
  - Added support for filtering by `company` query parameter.
  - Updated `POST` route to parse and assign `company` ID (or `null` if empty/invalid).
- `src/app/api/products/[id]/route.ts`:
  - Imported `Company` model.
  - Updated `GET` query to populate `company` field (`.populate("company", "name logo")`).
  - Updated `PUT` route to parse and assign `company` ID and return populated product document.

## Verification
- Executed `npx tsc --noEmit` which completed with exit code 0 and 0 TypeScript errors.
- Created git commit: `feat(company): add company model, product reference, and CRUD API endpoints` (hash: `ef9ece6`).
