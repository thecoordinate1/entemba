
# E-Ntemba Application: Refinement & Feature Implementation Roadmap

This document outlines the steps to refine the E-Ntemba application, implement new features, and complete Supabase integration.

## Phase 1: Core Data Accuracy & Foundational Reporting (Revenue)

- [x] **Dynamic Revenue Report (`/reports/revenue/page.tsx`) - Part 1 (Main Report)**
    - [x] Backend (Supabase RPCs):
        - [x] `get_revenue_summary_stats(p_store_id UUID)` implemented and tested.
        - [x] `get_monthly_revenue_overview(p_store_id UUID, p_number_of_months INTEGER)` implemented and tested (with date type fix).
        - [x] `get_top_products_by_revenue(p_store_id UUID, p_limit INTEGER, p_days_period INTEGER)` implemented and tested.
        - [x] Permissions granted for RPCs.
    - [x] Frontend (`reportService.ts` & Page Component):
        - [x] Service functions in `reportService.ts` created/updated.
        - [x] `/reports/revenue/page.tsx` refactored for dynamic data, loading, and error states.
- [x] **Customer Detail Page Data Accuracy (`/customers/[id]/page.tsx`)**
    - [x] Review and refactor data fetching logic in `useEffect` and service calls.
    - [x] Verify filtering and mapping of Supabase data to UI types.
    - [x] Ensure loading/error states handled gracefully.
- [x] **Stock Quantity Logic (Inventory Management)**
    - [x] **Backend Option Discussion:**
        - [x] Decide between Database Trigger or RPC for stock updates. (Decision: Database Trigger)
    - [x] **Backend Implementation (based on decision):**
        - [x] Implement Supabase Trigger on `orders` table (status change to 'Shipped'/'Delivered') and its associated PL/pgSQL function `decrement_product_stock_on_order_completion`.
        - [x] Implement Supabase Trigger on `orders` table (status change from 'Shipped'/'Delivered' to 'Cancelled') and its associated PL/pgSQL function `increment_product_stock_on_order_event`.
    - [x] **Frontend (if RPC used):**
        - [x] (Not applicable as Trigger is chosen)
    - [x] **Considerations:**
        - [x] Plan for handling stock for order cancellations/returns. (Implemented via `increment_product_stock_on_order_event` trigger)
    - [x] **Testing:**
        - [x] Test stock decrement on order completion.
        - [x] Test stock increment on order cancellation/return.
- [x] **RLS Policy Implementation & Testing**
    - [x] Define and apply RLS policies for `stores`, `products`, `orders`, `order_items`, `product_images`, `social_links`, `vendors`, `customers`.
    - [x] Test data access thoroughly for different vendor accounts.
- [x] **Order Data Segregation (Cross-Store Items in Single Order)**
    - [x] Issue confirmed resolved at customer frontend (orders are split per store). Vendor dashboard relies on this. RLS policies ensure vendors only see their respective store orders.
- [x] **Dashboard "Products Sold" Card Accuracy**
    - [x] Create/Update RPC `get_total_products_sold_for_store(p_store_id UUID)` to count items from 'Shipped' or 'Delivered' orders only.
    - [x] Update `orderService.ts` to use this RPC for `getStoreTotalProductsSold`.

## Phase 2: Profit Reporting

- [x] **Dynamic Profit Report (`/reports/profit/page.tsx`)**
    - [x] **Backend (Supabase RPCs):**
        - [x] Define & Implement `get_profit_summary_stats(p_store_id UUID)` (Gross Profit, Net Profit, Profit Margin, COGS - requires `products.order_price` or similar for cost).
        - [x] Define & Implement `get_monthly_profit_overview(p_store_id UUID, p_number_of_months INTEGER)`.
        - [x] Define & Implement `get_top_products_by_profit(p_store_id UUID, p_limit INTEGER, p_days_period INTEGER)`.
        - [x] Define & Implement `get_profit_by_category(p_store_id UUID, p_days_period INTEGER)` (for dynamic pie chart).
        - [x] Grant permissions for new RPCs.
    - [x] **Frontend (`reportService.ts` & Page Component):**
        - [x] Create/update service functions.
        - [x] Refactor `/reports/profit/page.tsx` to use dynamic data for stats, top products.
        - [x] Implement loading and error states.
        - [x] **Dynamic "Profit by Category" Pie Chart:** (UI Removed)
            - [x] Backend RPC `get_profit_by_category` implemented and tested.
            - [x] Frontend service and UI (UI component removed from page).
        - [x] **Dynamic "Monthly Gross Profit Trend" Chart:** (UI Removed)
            - [x] Backend RPC `get_monthly_profit_overview` confirmed and tested.
            - [x] Frontend service and UI (UI component removed from page).
- [x] **Dynamic "All Products Profit" Sub-Page (`/reports/profit/products/page.tsx`)**
    - [x] **Backend (Supabase RPC):**
        - [x] Define & Implement `get_all_products_profit_for_store(p_store_id UUID, p_days_period INTEGER DEFAULT NULL)`.
        - [x] Grant permissions for new RPC.
    - [x] **Frontend (Service & UI Update):**
        - [x] Update `reportService.ts` (or new `profitService.ts`).
        - [x] Refactor `/reports/profit/products/page.tsx` to use dynamic data.

## Phase 3: UI/UX Refinements & Performance

- [x] **Page Titles & Headers**
    - [x] Refactor `AppShell` to set dynamic page titles based on route and selected store.
- [x] **Settings Page Layout (`/settings/page.tsx`)**
    - [x] Fix any overlapping UI elements on the settings page tabs (Changed TabsList to flex-wrap).
- [x] **Loading States & Performance**
    - [x] Review all pages for consistent skeleton loaders or loading messages.
    - [x] Identify and optimize slow API calls or client-side computations. (Initial pass done, further backend optimization might be needed for RPCs if slowness persists).
    - [x] **Implement pagination for tables:**
        - [x] Products Page (`/products/page.tsx`)
        - [x] Orders Page (`/orders/page.tsx`)
        - [x] Customers Page (`/customers/page.tsx`)
- [ ] **Review database indexes in Supabase for frequently queried columns.** (Guidance Provided / User to Implement)

## Phase 4: Final Deployment Checklist

- [ ] **Security: Final RLS Policy Review**
    - [ ] Perform a final, thorough review of all Row Level Security policies.
    - [ ] Test access with at least two different vendor accounts to ensure data is properly segregated.
    - [ ] Test that unauthorized users cannot access any data.

- [ ] **Functionality: End-to-End Testing**
    - [ ] **Authentication:** Test sign-up (with email confirmation), sign-in, sign-out, and password reset flows.
    - [ ] **CRUD Operations:** Verify that creating, reading, updating, and deleting works for Stores, Products, Orders, and Customers. Pay special attention to edge cases (e.g., deleting a store with products).
    - [ ] **Reporting:** Check all dashboard and report pages with real and test data to ensure accuracy.
    - [ ] **Image Uploads:** Confirm that uploading/changing avatars, store logos, and product images works correctly.

- [ ] **Performance & UX:**
    - [ ] **Cross-Browser Testing:** Test the application in major browsers (Chrome, Firefox, Safari).
    - [ ] **Responsiveness:** Verify the application looks and works well on mobile, tablet, and desktop screens.
    - [ ] **Code Cleanup:** Remove any remaining `console.log()` statements or commented-out code.

- [ ] **Deployment Configuration:**
    - [ ] **Environment Variables:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly in your production hosting environment (e.g., Vercel, Netlify).
    - [ ] **Domain Configuration:** If using a custom domain, ensure it is configured correctly.
    - [ ] **Deploy & Test:** Deploy the application to your hosting provider and perform a final smoke test on the live URL.

## Phase 5: Future Features (Post-Launch)

- [ ] **Aggregated Reporting Views (All Stores)**
    - [ ] Backend (Supabase RPCs) for vendor-wide revenue and profit stats.
    - [ ] Frontend UI to display aggregated views.

- [ ] **Real-time In-App Notifications (Low Stock, New Orders)**
    - [ ] Backend (Supabase Realtime & DB Changes).
    - [ ] Frontend UI and logic for notifications.

- [ ] **Product Reviews Functionality**

- [ ] **Complex Integrations (Mobile Money)**

---
*This roadmap will be updated as tasks are completed.*

    