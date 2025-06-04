
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
        - [x] Implement Supabase Trigger on `orders` table (status change to 'Shipped'/'Delivered') and its associated PL/pgSQL function.
    - [ ] **Frontend (if RPC used):**
        - [ ] (Not applicable as Trigger is chosen)
    - [ ] **Considerations:**
        - [ ] Plan for handling stock for order cancellations/returns.
    - [ ] **Testing:**
        - [x] Test stock decrement on order completion.
        - [ ] Test stock increment on order cancellation/return (if implemented).

## Phase 2: Profit Reporting

- [ ] **Dynamic Profit Report (`/reports/profit/page.tsx`)**
    - [ ] **Backend (Supabase RPCs):**
        - [ ] Define & Implement `get_profit_summary_stats(p_store_id UUID)` (Gross Profit, Net Profit, Profit Margin, COGS - requires `products.order_price` or similar for cost).
        - [ ] Define & Implement `get_monthly_profit_overview(p_store_id UUID, p_number_of_months INTEGER)`.
        - [ ] Define & Implement `get_top_products_by_profit(p_store_id UUID, p_limit INTEGER, p_days_period INTEGER)`.
        - [ ] Grant permissions for new RPCs.
    - [ ] **Frontend (`reportService.ts` or new `profitService.ts` & Page Component):**
        - [ ] Create/update service functions.
        - [ ] Refactor `/reports/profit/page.tsx` to use dynamic data.
        - [ ] Implement loading and error states.
    - [ ] **Note:** "Profit by Category" pie chart might need a specific RPC or client-side aggregation. Will initially remain static or simplified.
- [ ] **Dynamic "All Products Profit" Sub-Page (`/reports/profit/products/page.tsx`)**
    - [ ] **Backend (Supabase RPC):**
        - [ ] Define & Implement `get_all_products_profit_for_store(p_store_id UUID, p_days_period INTEGER DEFAULT NULL)`.
        - [ ] Grant permissions for new RPC.
    - [ ] **Frontend (Service & UI Update):**
        - [ ] Update `reportService.ts` (or new `profitService.ts`).
        - [ ] Refactor `/reports/profit/products/page.tsx` to use dynamic data.

## Phase 3: UI/UX Refinements & Performance

- [x] **Page Titles & Headers**
    - [x] Refactor `AppShell` to set dynamic page titles based on route and selected store.
- [ ] **Settings Page Layout (`/settings/page.tsx`)**
    - [ ] Fix any overlapping UI elements on the settings page tabs.
- [x] **Loading States & Performance**
    - [x] Review all pages for consistent skeleton loaders or loading messages.
    - [x] Identify and optimize slow API calls or client-side computations.
    - [x] Consider pagination for tables (Products, Orders, Customers) if not already sufficient.
    - [ ] Review database indexes in Supabase for frequently queried columns.

## Phase 4: Aggregated Reporting Views

- [ ] **All Stores Revenue View**
    - [ ] **Backend (Supabase RPC):**
        - [ ] `get_vendor_wide_revenue_summary_stats(p_vendor_id UUID)`
        - [ ] `get_vendor_wide_monthly_revenue(p_vendor_id UUID, p_number_of_months INTEGER)`
    - [ ] **Frontend (New Page/Toggle & Service Update):**
        - [ ] Implement UI to display aggregated revenue.
- [ ] **All Stores Profit View**
    - [ ] **Backend (Supabase RPC):**
        - [ ] `get_vendor_wide_profit_summary_stats(p_vendor_id UUID)`
        - [ ] `get_vendor_wide_monthly_profit(p_vendor_id UUID, p_number_of_months INTEGER)`
    - [ ] **Frontend (New Page/Toggle & Service Update):**
        - [ ] Implement UI to display aggregated profit.

## Phase 5: Notifications

- [ ] **Real-time In-App Notifications (Low Stock, New Orders)**
    - [ ] **Backend (Supabase Realtime & DB Changes):**
        - [ ] Set up Supabase Realtime subscriptions on `products` (for stock) and `orders`.
        - [ ] OR Use database triggers to insert into a `notifications` table.
    - [ ] **Frontend (UI & Logic):**
        - [ ] Implement client-side Supabase Realtime listeners.
        - [ ] Create UI component for displaying notifications (e.g., toast, bell icon).
- [ ] **Email Notifications (New Features, Sales Completion)**
    - [ ] **Backend (Supabase Edge Function & Email Provider):**
        - [ ] Choose and configure an email provider (e.g., SendGrid, Resend).
        - [ ] Create Edge Function(s) for sending emails.
    - [ ] **Frontend (Triggering Logic):**
        - [ ] UI elements if needed (e.g., admin panel to send feature updates).

## Phase 6: Product Reviews

- [ ] **Reviews Functionality (Viewing)**
    - [ ] **Backend (New Table & RPC):**
        - [ ] Create `product_reviews` table (`id`, `product_id`, `customer_id` (optional), `rating`, `comment`, `created_at`, `status`).
        - [ ] Implement RLS policies for `product_reviews`.
        - [ ] Create RPC: `get_product_reviews(p_product_id UUID)`.
        - [ ] Create RPC: `get_product_average_rating(p_product_id UUID)`.
    - [ ] **Frontend (UI & Service Update):**
        - [ ] Update `productService.ts`.
        - [ ] Refactor "Customer Reviews" section in `/products/[id]/page.tsx`.

## Phase 7: Advanced Settings & Further Dynamic Data

- [ ] **Revenue Settings UI (`/reports/revenue/page.tsx`)**
    - [ ] **Backend (Supabase Schema):**
        - [ ] Add `currency`, `default_tax_rate`, `prices_include_tax` columns to `stores` or a new `store_settings` table.
    - [ ] **Frontend (UI & Service Update):**
        - [ ] Update `storeService.ts` to fetch/update these settings.
        - [ ] Make "Revenue Settings" section in revenue report partially functional (save/load preference).
    - [ ] **Note:** Full application of these settings to calculations is a larger task.
- [ ] **Dynamic "Revenue by Source" Pie Chart**
    - [ ] **Backend (Schema Change & RPC):**
        - [ ] Add `order_source` column to `orders` table.
        - [ ] Create RPC: `get_revenue_by_source(p_store_id UUID, p_days_period INTEGER)`.
    - [ ] **Frontend (Service & UI Update):**
        - [ ] Update `reportService.ts` and the chart component.

## Phase 8: Complex Integrations (Significant Future Work)

- [ ] **Billing: Mobile Money Integration (Airtel, MTN)**
    - [ ] Detailed API research for Airtel and MTN.
    - [ ] Secure backend infrastructure (Edge Functions) for payment processing.
    - [ ] Robust error handling and transaction reconciliation.
    - [ ] UI for vendor account configuration and payout status.

## Phase 9: Final Testing & Deployment (Reiteration)
*(This aligns with the original Phase 9 & 10 from SUPABASE_INTEGRATION_ROADMAP.md)*

- [ ] **RLS Policy Deep Dive & Security Review**
- [ ] **Comprehensive CRUD Operations Testing**
- [ ] **User Authentication Flow Testing**
- [ ] **Image/File Uploads Testing**
- [ ] **Cross-Browser & Responsiveness Testing**
- [ ] **Performance Optimization (Indexes, Pagination)**
- [ ] **Code Cleanup & Documentation**
- [ ] **Final Vercel Deployment Checks**
    - [ ] Environment variables correctly set for production.
    - [ ] Custom domains configured if needed.
    - [ ] Test deployed application thoroughly.

---
*This roadmap will be updated as tasks are completed.*
