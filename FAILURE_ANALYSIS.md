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
