# E-Ntemba Vendor Dashboard

This is a comprehensive vendor dashboard for the E-Ntemba e-commerce platform, built with Next.js, Supabase, and ShadCN UI. It provides vendors with the tools they need to manage their stores, products, orders, and customers efficiently.

## Core Features

*   **Multi-Store Management:** Add and manage multiple storefronts from a single, unified account.
*   **Complete Product Catalog:** Full CRUD (Create, Read, Update, Delete) functionality for products, including multi-image uploads and inventory tracking.
*   **Order Processing Lifecycle:** View, manage, and update order statuses from "Pending" to "Delivered".
*   **Customer Relationship Management:** Keep track of all customer information, view their order history, and manage customer status.
*   **Dynamic Reporting & Analytics:** Access dynamic dashboards for tracking key metrics like revenue, profit, and top-performing products for each store.
*   **Secure Authentication:** User sign-up, sign-in, and password management powered by Supabase Auth, including email confirmation and password reset flows.
*   **AI-Powered Logistics:** Includes a delivery capacity estimator powered by Genkit to help plan logistics.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Backend & DB:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
*   **Generative AI:** [Firebase Genkit](https://firebase.google.com/docs/genkit)
*   **Deployment:** Ready for Vercel, Netlify, or any other modern hosting provider.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later)
*   A Supabase account and a new project.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repository-name.git
    cd your-repository-name
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    Create a file named `.env` in the root of the project and add your Supabase project credentials. You can find these in your Supabase project's "Settings" > "API" section.
    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

4.  **Set up the Supabase database:**
    Log in to your Supabase account, navigate to the "SQL Editor", and run the SQL scripts located in the `supabase/` directory of this project. You will also need to run the functions listed in the **Database Functions** section below.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Database Functions

You must run the following SQL functions in your Supabase SQL Editor for all application features to work correctly.

### `get_profit_summary_stats`
This function is required for the profit report page. It provides Year-to-Date (YTD) and current month profit summaries.
```sql
-- Calculates profit-related summary statistics for a given store.
-- This version specifically calculates Year-to-Date (YTD) and Current Month figures.
--
-- Parameters:
--   p_store_id: The UUID of the store to calculate profit stats for.
--
-- Returns:
--   A single row with the following columns:
--   - ytd_gross_profit: Gross profit from the beginning of the current year to date.
--   - ytd_cogs: Cost of Goods Sold from the beginning of the current year to date.
--   - current_month_gross_profit: Gross profit for the current calendar month.
--   - current_month_cogs: Cost of Goods Sold for the current calendar month.
--   - ytd_revenue_for_margin_calc: Total revenue YTD, used for margin calculation.
--   - current_month_revenue_for_margin_calc: Total revenue for the current month.

CREATE OR REPLACE FUNCTION get_profit_summary_stats(p_store_id UUID)
RETURNS TABLE (
    ytd_gross_profit NUMERIC,
    ytd_cogs NUMERIC,
    current_month_gross_profit NUMERIC,
    current_month_cogs NUMERIC,
    ytd_revenue_for_margin_calc NUMERIC,
    current_month_revenue_for_margin_calc NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Year-to-Date Calculations
        COALESCE(SUM(
            CASE
                WHEN o.order_date >= date_trunc('year', CURRENT_DATE) THEN
                    (oi.price_per_unit_snapshot - oi.cost_per_unit_snapshot) * oi.quantity
                ELSE 0
            END
        ), 0) AS ytd_gross_profit,

        COALESCE(SUM(
            CASE
                WHEN o.order_date >= date_trunc('year', CURRENT_DATE) THEN
                    oi.cost_per_unit_snapshot * oi.quantity
                ELSE 0
            END
        ), 0) AS ytd_cogs,

        -- Current Month Calculations
        COALESCE(SUM(
            CASE
                WHEN o.order_date >= date_trunc('month', CURRENT_DATE) THEN
                    (oi.price_per_unit_snapshot - oi.cost_per_unit_snapshot) * oi.quantity
                ELSE 0
            END
        ), 0) AS current_month_gross_profit,

        COALESCE(SUM(
            CASE
                WHEN o.order_date >= date_trunc('month', CURRENT_DATE) THEN
                    oi.cost_per_unit_snapshot * oi.quantity
                ELSE 0
            END
        ), 0) AS current_month_cogs,
        
        -- YTD Revenue for Margin Calculation
        COALESCE(SUM(
            CASE
                WHEN o.order_date >= date_trunc('year', CURRENT_DATE) THEN
                    oi.price_per_unit_snapshot * oi.quantity
                ELSE 0
            END
        ), 0) AS ytd_revenue_for_margin_calc,

        -- Current Month Revenue for Margin Calculation
        COALESCE(SUM(
            CASE
                WHEN o.order_date >= date_trunc('month', CURRENT_DATE) THEN
                    oi.price_per_unit_snapshot * oi.quantity
                ELSE 0
            END
        ), 0) AS current_month_revenue_for_margin_calc

    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.store_id = p_store_id
      AND o.status IN ('Shipped', 'Delivered'); -- The date filter is now inside each CASE
END;
$$ LANGUAGE plpgsql;

-- Grant execution permission to the 'authenticated' role
GRANT EXECUTE ON FUNCTION get_profit_summary_stats(UUID) TO authenticated;
```

### `get_total_products_sold_for_store`

This function is required for the "Products Sold" card on the main dashboard.

```sql
-- Calculates the total number of individual product units sold for a given store.
-- It only counts items from orders that are marked as 'Shipped' or 'Delivered'.
--
-- Parameters:
--   p_store_id: The UUID of the store to calculate the total products sold for.
--
-- Returns:
--   An integer representing the total quantity of items sold.

CREATE OR REPLACE FUNCTION get_total_products_sold_for_store(p_store_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_products_sold INTEGER;
BEGIN
    SELECT COALESCE(SUM(oi.quantity), 0)
    INTO total_products_sold
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.store_id = p_store_id
      AND o.status IN ('Shipped', 'Delivered');

    RETURN total_products_sold;
END;
$$ LANGUAGE plpgsql;

-- Grant execution permission to the 'authenticated' role
GRANT EXECUTE ON FUNCTION get_total_products_sold_for_store(UUID) TO authenticated;
```

### `create_order_with_snapshots`

This function is required for creating new orders from the "Add Order" dialog. It ensures that product and pricing data are captured correctly at the time of sale.

```sql
-- Creates a new order and its associated items with price and cost snapshots.
-- This function is designed to be called via RPC from the application.
-- It ensures that historical order data is accurate even if product prices change later.
--
-- Parameters:
--   p_store_id: The UUID of the store the order belongs to.
--   p_customer_id: The UUID of the customer placing the order.
--   p_order_payload: A JSON object containing the main order details.
--   p_order_items: A JSON array of objects, each representing an item in the order.

CREATE OR REPLACE FUNCTION create_order_with_snapshots(
    p_store_id UUID,
    p_customer_id UUID,
    p_order_payload JSONB,
    p_order_items JSONB
)
RETURNS UUID AS $$
DECLARE
    new_order_id UUID;
    item RECORD;
    product_info RECORD;
BEGIN
    -- Insert the main order record
    INSERT INTO orders (
        store_id,
        customer_id,
        customer_name,
        customer_email,
        total_amount,
        status,
        shipping_address,
        billing_address,
        shipping_method,
        payment_method,
        shipping_latitude,
        shipping_longitude,
        delivery_type,
        customer_specification,
        delivery_cost
    )
    VALUES (
        p_store_id,
        p_customer_id,
        p_order_payload->>'customer_name',
        p_order_payload->>'customer_email',
        (p_order_payload->>'total_amount')::DECIMAL,
        (p_order_payload->>'status')::TEXT,
        p_order_payload->>'shipping_address',
        p_order_payload->>'billing_address',
        p_order_payload->>'shipping_method',
        p_order_payload->>'payment_method',
        (p_order_payload->>'shipping_latitude')::FLOAT,
        (p_order_payload->>'shipping_longitude')::FLOAT,
        COALESCE((p_order_payload->>'delivery_type')::TEXT, 'self_delivery'),
        p_order_payload->>'customer_specification',
        (p_order_payload->>'delivery_cost')::DECIMAL
    )
    RETURNING id INTO new_order_id;

    -- Loop through the items in the JSON array and insert them
    FOR item IN SELECT * FROM jsonb_to_recordset(p_order_items) AS x(
        product_id UUID,
        quantity INTEGER
        -- Other fields like name/price are taken directly from products table
    )
    LOOP
        -- Get the current product details to create snapshots
        SELECT
            p.name,
            p.price,
            p.order_price,
            pi.image_url AS primary_image_url
        INTO product_info
        FROM products p
        LEFT JOIN (
            SELECT product_id, image_url
            FROM product_images
            WHERE "order" = 0
        ) AS pi ON pi.product_id = p.id
        WHERE p.id = item.product_id;

        -- Insert the order item with snapshots
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            product_name_snapshot,
            price_per_unit_snapshot,
            cost_per_unit_snapshot,
            product_image_url_snapshot
        )
        VALUES (
            new_order_id,
            item.product_id,
            item.quantity,
            product_info.name,
            product_info.price, -- This is the sale price
            COALESCE(product_info.order_price, product_info.price), -- This is the Cost of Goods Sold
            product_info.primary_image_url
        );
    END LOOP;

    RETURN new_order_id;
END;
$$ LANGUAGE plpgsql;


-- Grant execution permission to the 'authenticated' role
GRANT EXECUTE ON FUNCTION create_order_with_snapshots(UUID, UUID, JSONB, JSONB) TO authenticated;
```

### `get_top_products_by_revenue` (with date filtering)
```sql
CREATE OR REPLACE FUNCTION get_top_products_by_revenue(
    p_store_id UUID,
    p_limit INTEGER,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_category TEXT,
    primary_image_url TEXT,
    primary_image_data_ai_hint TEXT,
    total_revenue_generated NUMERIC,
    units_sold BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        oi.product_id,
        p.name AS product_name,
        p.category AS product_category,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY "order" LIMIT 1) AS primary_image_url,
        (SELECT pi.data_ai_hint FROM product_images pi WHERE pi.product_id = p.id ORDER BY "order" LIMIT 1) AS primary_image_data_ai_hint,
        SUM(oi.price_per_unit_snapshot * oi.quantity) AS total_revenue_generated,
        SUM(oi.quantity) AS units_sold
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.store_id = p_store_id
      AND o.status IN ('Shipped', 'Delivered')
      AND (p_start_date IS NULL OR o.order_date >= p_start_date)
      AND (p_end_date IS NULL OR o.order_date <= p_end_date)
    GROUP BY oi.product_id, p.name, p.category, p.id
    ORDER BY total_revenue_generated DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_top_products_by_revenue(UUID, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
```

### `get_top_products_by_profit` (with date filtering)
```sql
CREATE OR REPLACE FUNCTION get_top_products_by_profit(
    p_store_id UUID,
    p_limit INTEGER,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_category TEXT,
    primary_image_url TEXT,
    primary_image_data_ai_hint TEXT,
    total_profit_generated NUMERIC,
    units_sold BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        oi.product_id,
        p.name AS product_name,
        p.category AS product_category,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY "order" LIMIT 1) AS primary_image_url,
        (SELECT pi.data_ai_hint FROM product_images pi WHERE pi.product_id = p.id ORDER BY "order" LIMIT 1) AS primary_image_data_ai_hint,
        SUM((oi.price_per_unit_snapshot - oi.cost_per_unit_snapshot) * oi.quantity) AS total_profit_generated,
        SUM(oi.quantity) AS units_sold
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.store_id = p_store_id
      AND o.status IN ('Shipped', 'Delivered')
      AND (p_start_date IS NULL OR o.order_date >= p_start_date)
      AND (p_end_date IS NULL OR o.order_date <= p_end_date)
    GROUP BY oi.product_id, p.name, p.category, p.id
    ORDER BY total_profit_generated DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_top_products_by_profit(UUID, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
```

### `get_all_products_revenue_for_store`
```sql
CREATE OR REPLACE FUNCTION get_all_products_revenue_for_store(
    p_store_id UUID,
    p_days_period INTEGER DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_category TEXT,
    primary_image_url TEXT,
    primary_image_data_ai_hint TEXT,
    total_revenue_generated NUMERIC,
    units_sold BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        oi.product_id,
        p.name AS product_name,
        p.category AS product_category,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY "order" LIMIT 1) AS primary_image_url,
        (SELECT pi.data_ai_hint FROM product_images pi WHERE pi.product_id = p.id ORDER BY "order" LIMIT 1) AS primary_image_data_ai_hint,
        SUM(oi.price_per_unit_snapshot * oi.quantity) AS total_revenue_generated,
        SUM(oi.quantity) AS units_sold
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.store_id = p_store_id
      AND o.status IN ('Shipped', 'Delivered')
      AND (p_days_period IS NULL OR o.order_date >= (CURRENT_DATE - (p_days_period || ' days')::INTERVAL))
    GROUP BY oi.product_id, p.name, p.category, p.id
    ORDER BY total_revenue_generated DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_all_products_revenue_for_store(UUID, INTEGER) TO authenticated;
```


## Next Steps

After your initial commit, you can continue to develop features. The standard workflow is:
1.  Make changes to your code.
2.  `git add .`
3.  `git commit -m "A descriptive message about your changes"`
4.  `git push origin main`
