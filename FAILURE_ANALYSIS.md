# E-Ntemba Application: Failure Analysis & Case Studies

This document outlines potential real-world failure scenarios for the E-Ntemba application. Understanding these edge cases is crucial for enhancing the system's robustness, reliability, and scalability before it handles high-volume production traffic.

---

### Case Study 1: Inventory Race Condition during a Flash Sale

**Scenario:**
A vendor runs a highly anticipated flash sale for a popular product, "Z-Kicks," with only 10 units left in stock. The sale goes live, and hundreds of customers attempt to purchase the item simultaneously through the customer-facing website, which interacts with the same Supabase backend.

**Point of Failure:**
The current stock management logic, implemented via the `decrement_product_stock_on_order_completion` database trigger, only reduces the `stock` count when an order's status is manually changed to 'Shipped' or 'Delivered'.

1.  **No Real-time Stock Reservation:** When a customer adds the item to their cart and proceeds to checkout, the stock is not reserved or checked in a transactionally safe manner.
2.  **Overselling:** The system could easily accept 20, 30, or even more "Pending" orders for the 10 available units because the stock count is only checked much later in the fulfillment process. The check isn't happening at the critical moment of purchase.

**Impact:**
*   **Customer Dissatisfaction:** The vendor will have to cancel a large number of orders, leading to angry customers, negative reviews, and damage to their brand reputation.
*   **Operational Chaos:** The vendor's dashboard will show numerous "Pending" orders that cannot be fulfilled, creating confusion and significant manual work to identify and cancel the excess orders.
*   **Financial Issues:** The vendor might have to issue multiple refunds, potentially incurring transaction fees for payments that have to be reversed.

**Mitigation/Solution:**
*   **Transactional Stock Check:** Implement a database function (RPC) like `create_order_and_decrement_stock` that wraps the entire order creation process in a single transaction. This function would:
    1.  Start a transaction.
    2.  Check if sufficient stock exists for all items in the cart.
    3.  If stock is insufficient, immediately reject the order and return an error.
    4.  If stock is sufficient, decrement the `products.stock` count.
    5.  Insert the new `orders` and `order_items` records.
    6.  Commit the transaction.
*   This ensures that stock is claimed atomically at the moment of purchase, making it impossible to oversell.

---

### Case Study 2: Dashboard & Reporting Timeouts for a High-Volume Store

**Scenario:**
A successful vendor has been using the platform for two years and has accumulated over 1 million orders and 50,000 unique products. The vendor logs into their dashboard to check their year-to-date profit report.

**Point of Failure:**
The reporting functions (`get_profit_summary_stats`, `get_all_products_profit_for_store`, etc.) perform complex calculations and aggregations across the entire `orders` and `order_items` tables for the given store.

1.  **Full Table Scans:** Without proper indexing or materialized views, these queries force the database to scan millions of rows every time a report is loaded.
2.  **RPC Timeout:** The database connection or the serverless function hosting the RPC has a timeout limit (e.g., 30-60 seconds). As the data grows, the query execution time will exceed this limit.

**Impact:**
*   **Unusable Reports:** The reporting pages will fail to load, showing a perpetual loading spinner or a generic error message. The vendor loses all visibility into their business performance.
*   **Dashboard Failure:** The main dashboard, which relies on similar aggregate functions, will also fail to load, making the entire application feel broken and unusable for the vendor.
*   **Database Strain:** Frequent, long-running queries can put a significant strain on the database, potentially impacting the performance of other critical operations like order creation.

**Mitigation/Solution:**
*   **Database Indexing:** Ensure all foreign keys (`store_id`, `product_id`, etc.) and frequently queried columns (`order_date`, `status`) have indexes.
*   **Materialized Views or Summary Tables:** For reporting, create summary tables that are updated periodically (e.g., nightly). For instance, a `daily_store_summary` table could pre-calculate daily revenue, profit, and units sold for each store. Reports would then query these much smaller, pre-aggregated tables, resulting in near-instant load times.
*   **Query Optimization:** Analyze and optimize the SQL within the RPC functions to ensure they are as efficient as possible, using appropriate `JOIN`s and `WHERE` clauses.

---

### Case Study 3: Data Inconsistency after Product or Store Deletion

**Scenario:**
A vendor decides to discontinue a product line. They delete several products from their "Products" page. Later, they try to run a profit report for the previous year.

**Point of Failure:**
The `DELETE` operation on a product might cascade and remove records in a way that breaks historical reporting, or it might leave orphaned records.

1.  **`ON DELETE SET NULL` on `order_items`:** If the foreign key on `order_items.product_id` is set to `ON DELETE SET NULL`, historical order items will lose their connection to the product. This makes it impossible to calculate historical profit for that item, as the `order_price` (cost of goods) stored on the `products` table is lost.
2.  **`ON DELETE CASCADE`:** If the foreign key cascades, deleting a product would delete all historical `order_items` associated with it. This would completely erase historical sales data, making revenue and profit reports inaccurate.
3.  **No `ON DELETE` clause (Default `RESTRICT`):** The vendor would be blocked from deleting any product that has ever been sold, which is also not ideal.

**Impact:**
*   **Inaccurate Historical Reports:** The vendor's past revenue and profit figures would be incorrect, potentially leading to bad business decisions.
*   **Orphaned Data:** If not handled carefully, `order_items` could reference non-existent products, leading to application errors when trying to view old orders.
*   **Frustrating User Experience:** Vendors are unable to perform basic catalog cleanup without compromising their historical data.

**Mitigation/Solution:**
*   **Soft Deletes:** Implement a "soft delete" pattern. Instead of `DELETE`, update the `products.status` to 'Archived' or add a `deleted_at` timestamp column.
    *   **Update RLS Policies & Queries:** All data-fetching logic (for the store, reports, etc.) must be updated to exclude products where `status = 'Archived'` or `deleted_at IS NOT NULL`.
    *   **Maintain Data Integrity:** This approach preserves all historical records perfectly, ensuring reports remain accurate forever. The product is simply hidden from active views.
*   **Snapshotting COGS:** Ensure that the `order_items` table saves not only the `price_per_unit_snapshot` (sale price) but also a `cost_per_unit_snapshot` (what the vendor paid for it). This makes profit calculation completely independent of the live `products` table, protecting historical profit data even if the product's cost changes or the product is deleted.

---

### Case Study 4: Historical Profit Inaccuracy from Changing Product Costs

**Scenario:**
A vendor sells "Handmade Soaps". In January, their supplier charges ZMW 10 per unit, and they set the `order_price` on the `products` table to 10. They sell 50 units. In February, the supplier increases the cost to ZMW 12, and the vendor updates the `order_price` on the product to 12. At the end of the year, they run a profit report.

**Point of Failure:**
The profit calculation RPCs (`get_profit_summary_stats`, etc.) calculate profit by joining `order_items` with the `products` table and subtracting the *current* `products.order_price` from the `order_items.price_per_unit_snapshot`.

1.  **No Historical Cost Data:** The system does not store what the cost of goods sold (COGS) was *at the time of the sale*.
2.  **Retroactive Profit Miscalculation:** The year-end report will use the current cost of ZMW 12 for *all* sales, including the ones from January. This under-reports the profit made in January by ZMW 2 for every unit sold, skewing all historical financial data.

**Impact:**
*   **Inaccurate Financial Reporting:** The vendor cannot trust their own historical profit data. This can lead to incorrect tax filings, bad purchasing decisions, and a flawed understanding of their business's financial health.
*   **Loss of Confidence:** The vendor loses trust in the platform as a reliable tool for business management.

**Mitigation/Solution:**
*   **Snapshot COGS on `order_items`:** The most robust solution is to add a `cost_per_unit_snapshot` column to the `order_items` table.
*   **Update Order Creation Logic:** When an order is created, this new field must be populated with the `products.order_price` value at that moment.
*   **Update Reporting Functions:** All profit-related RPC functions must be rewritten to calculate profit using `SUM(price_per_unit_snapshot - cost_per_unit_snapshot)` directly from the `order_items` table, removing the join to the `products` table for this calculation. This completely decouples historical profit from current product costs.

---

### Case Study 5: Customer Data Drift and Historical Inconsistency

**Scenario:**
A loyal customer named "Jane Phiri" places several orders. She later gets married and updates her name in her profile to "Jane Banda". A year later, the vendor looks up an old order from before the name change.

**Point of Failure:**
The `orders` table stores `customer_name` and `customer_email` as snapshots, but it also has a `customer_id` linking to the `customers` table. The UI might inconsistently display data from either source.

1.  **Inconsistent UI Display:** A list of orders might show the snapshot "Jane Phiri", but clicking into the order details page might fetch the live customer profile via the `customer_id` and display the current name, "Jane Banda".
2.  **Search Confusion:** If the vendor searches for orders by "Jane Banda", they might not find the older orders that were placed under "Jane Phiri".

**Impact:**
*   **Vendor Confusion:** The vendor sees conflicting information, which can be confusing and lead to mistakes in customer service (e.g., addressing the customer by the wrong name).
*   **Broken Audit Trail:** It becomes difficult to trace a customer's complete history if their identifying information changes over time.

**Mitigation/Solution:**
*   **Prioritize a Single Source of Truth:** The UI should be designed to consistently use the `customer_id` to fetch the current customer profile for display on all pages (list and detail views).
*   **Use Snapshots for Invoices Only:** The snapshot fields (`customer_name_snapshot`, `shipping_address_snapshot`) should be explicitly reserved for generating historical documents like invoices or receipts, where the "point-in-time" data is legally required.
*   **Comprehensive Search:** The search functionality for orders should be able to search not only the snapshot fields but also the current details of the linked customer profile.

---

### Case Study 6: Cross-Store Data Pollution via Manual Order Creation

**Scenario:**
Vendor A ("Artisan Boutique") is creating a new manual order. The "Select Product" dropdown in the "Add Order" dialog lists *all* active products in the entire database, not just the products belonging to "Artisan Boutique". Vendor A accidentally selects and adds a "Z-Kick" sneaker, a product that belongs to Vendor B ("Tech Gadget Hub").

**Point of Failure:**
The data fetching logic for the "Add Order" product dropdown (`src/app/(app)/orders/page.tsx`) does not filter products by the currently selected `storeId`.

1.  **Data Leakage in UI:** The frontend exposes products from other vendors, which is a data privacy and integrity issue.
2.  **Order Integrity Violation:** An order is created for "Artisan Boutique" that contains an `order_item` referencing a product that does not belong to that store.
3.  **Downstream Errors:** This will cause numerous problems:
    *   Stock will be incorrectly decremented from Vendor B's inventory.
    *   Revenue and profit reports for both Vendor A and Vendor B will be inaccurate.
    *   Vendor A cannot fulfill the item, and Vendor B is unaware of the sale.

**Impact:**
*   **Complete Data Chaos:** This single action corrupts inventory, sales, and profit data for at least two different vendors.
*   **Security Breach:** It exposes product information between competing vendors.
*   **Untrustworthy Platform:** This kind of data leakage completely undermines the platform's viability as a multi-tenant solution.

**Mitigation/Solution:**
*   **Strict Frontend Filtering:** The `fetchStoreProducts` call in `orders/page.tsx` **must** be filtered by the current `storeIdFromUrl`. The `getProductsByStoreId` service function already supports this. This is an immediate and critical fix.
*   **Backend RLS on `order_items`:** Implement a Row Level Security policy on the `order_items` table that prevents an `order_item` from being inserted if its `product_id` does not belong to the same `store_id` as its parent `order`. This provides a crucial database-level backstop to prevent this from ever happening, even if the frontend has a bug.
*   **Transactional Integrity:** Wrap the entire `createOrder` process in a database transaction (RPC) that validates store ownership of all products before committing the order and its items.
