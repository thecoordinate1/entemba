
# Implementation Plan - Products Page Enhancements

The goal is to enhance the Products page (`src/app/(app)/products/page.tsx`) to match the premium, metric-driven design of the Dashboard and Customer pages.

## User Objectives
- **Enhance Visual Appeal**: Adopt the "MetricCard" design and polished UI elements.
- **Improve Data Insight**: Display key inventory metrics at a glance.
- **Optimize Workflow**: Ensure smooth management of products.

## Proposed Changes

### 1. Service Layer Updates (`src/services/productService.ts`)
- [ ] Create `getStoreInventoryStats(storeId)` function to fetch:
    - Total Products count (Active/All)
    - Low Stock count (e.g., < 10 units)
    - Out of Stock count
    - Total Inventory Value (sum of price * stock)

### 2. UI Components - Products Page
- [ ] Import and integrate `MetricCard` component.
- [ ] Add a "Metrics Row" at the top of the page displaying:
    - **Total Products** (Icon: `Package`)
    - **Active Listings** (Icon: `Globe` or `CheckCircle`)
    - **Low Stock Alerts** (Icon: `AlertTriangle`, red accent)
    - **Total Value** (Icon: `DollarSign`)
- [ ] Refine the Product List Table/Cards:
    - Ensure consistent styling with Customers page.
    - Improve badges for styling.

### 3. Verification
- [ ] Verify `npm run build` passes.
- [ ] Verify data accuracy.

## Timeline
- **Estimated Time**: 30-45 minutes
- **Dependencies**: Existing `MetricCard` component.
