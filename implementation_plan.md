# E-Commerce App Implementation Plan

## Overview
This plan outlines the architecture and implementation steps to build the "Landing Page v1" e-commerce application based on the user's requirements. The app will be built using Next.js (App Router), Tailwind CSS, and MongoDB.

## Proposed Changes

### Setup & Foundation
- **Framework Initialization**: Run `npx create-next-app` in the repository root to initialize the application with TypeScript and Tailwind CSS.
- **Database Connection**: Set up Mongoose within the Next.js application to connect to MongoDB securely (`src/lib/mongodb.ts`).

---

### Database Schema Models
- #### [NEW] Product Model
  - `name`, `description`, `price`, `image`, `stock`
- #### [NEW] Order Model
  - `customerInfo` (name, address, phone), `items` (array of products), `totalPrice`, `status` (pending, shipped, delivered)
- #### [NEW] User Model (Admin)
  - `email`, `password` (hashed), `role`

---

### Application Features

#### Client Side
- **Landing Page**: Hero section, featured products, attractive UI using Tailwind CSS.
- **Products Page**: Full catalog display retrieving data directly via Next.js server components or API routes.
- **Cart System**: Context or Zustand based global state for shopping cart management.
- **Checkout to WhatsApp**: Generate a dynamic WhatsApp message link (e.g., `wa.me/NUMBER?text=...`) containing cart summary and customer details instead of a native payment gateway.

#### Admin Dashboard
- **Admin Layout**: Protected route wrapper for `app/admin/*`.
- **Products Management**: CRUD interfaces for the catalog.
- **Orders Management**: Table view for tracking current orders and updating statuses.

## Verification Plan

### Automated/Manual Testing
- **Local Dev Testing**: 
  - Run the dev server (`npm run dev`).
  - Add mock products into MongoDB and verify they display on the listing pages.
- **Checkout Flow**:
  - Add items to cart.
  - Click checkout and verify the structure of the spawned WhatsApp URL.
- **Admin Actions**:
  - Log into admin (manual test).
  - Create, read, update, delete products and ensure UI and DB synchronize.
