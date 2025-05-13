
# Supabase Integration Roadmap for E-Ntemba Vendor Dashboard

This document outlines the steps to integrate Supabase as the backend for the E-Ntemba vendor dashboard application, replacing the current mock data implementation.

## Phase 1: Supabase Project Setup & Schema Design

### 1.1. Create Supabase Project
- Go to [supabase.com](https://supabase.com) and create a new project.
- Note down the Project URL and `anon` public key. These will be needed for the Next.js application.
- Choose a strong database password and save it securely.

### 1.2. Database Schema Design
Define the necessary tables in the Supabase SQL editor or GUI. Consider relationships, data types, and constraints.

**Initial Table Structures:**

*   **`users` (managed by Supabase Auth)**
    *   `id` (uuid, primary key, references `auth.users.id`)
    *   `username` (text)
    *   `avatar_url` (text, nullable)
    *   `created_at` (timestamp with time zone, default `now()`)
    *   `updated_at` (timestamp with time zone, default `now()`)

*   **`stores`**
    *   `id` (uuid, primary key, default `gen_random_uuid()`)
    *   `user_id` (uuid, foreign key references `users.id`)
    *   `name` (text, not null)
    *   `description` (text, not null)
    *   `logo_url` (text, nullable)
    *   `data_ai_hint` (text, nullable)
    *   `status` (text, not null, e.g., "Active", "Inactive", "Maintenance")
    *   `category` (text, not null)
    *   `location` (text, nullable)
    *   `created_at` (timestamp with time zone, default `now()`)
    *   `updated_at` (timestamp with time zone, default `now()`)

*   **`social_links`**
    *   `id` (uuid, primary key, default `gen_random_uuid()`)
    *   `store_id` (uuid, foreign key references `stores.id`, on delete cascade)
    *   `platform` (text, not null, e.g., "Instagram", "Facebook", "Twitter")
    *   `url` (text, not null)
    *   `created_at` (timestamp with time zone, default `now()`)

*   **`products`**
    *   `id` (uuid, primary key, default `gen_random_uuid()`)
    *   `store_id` (uuid, foreign key references `stores.id`, not null)
    *   `name` (text, not null)
    *   `category` (text, not null)
    *   `price` (decimal, not null)
    *   `order_price` (decimal, nullable)
    *   `stock` (integer, not null, default 0)
    *   `status` (text, not null, e.g., "Active", "Draft", "Archived")
    *   `description` (text, nullable)
    *   `full_description` (text, not null)
    *   `sku` (text, nullable, unique per store)
    *   `tags` (array of text, nullable)
    *   `weight_kg` (decimal, nullable)
    *   `dimensions_cm` (jsonb, nullable, e.g., `{"length": 10, "width": 10, "height": 10}`)
    *   `created_at` (timestamp with time zone, default `now()`)
    *   `updated_at` (timestamp with time zone, default `now()`)

*   **`product_images`**
    *   `id` (uuid, primary key, default `gen_random_uuid()`)
    *   `product_id` (uuid, foreign key references `products.id`, on delete cascade)
    *   `image_url` (text, not null)
    *   `data_ai_hint` (text, nullable)
    *   `order` (integer, default 0) - for image display order
    *   `created_at` (timestamp with time zone, default `now()`)

*   **`orders`**
    *   `id` (uuid, primary key, default `gen_random_uuid()`)
    *   `store_id` (uuid, foreign key references `stores.id`, not null)
    *   `customer_name` (text, not null)
    *   `customer_email` (text, not null)
    *   `order_date` (timestamp with time zone, default `now()`)
    *   `total_amount` (decimal, not null)
    *   `status` (text, not null, e.g., "Pending", "Processing", "Shipped", "Delivered", "Cancelled")
    *   `shipping_address` (text, not null)
    *   `billing_address` (text, not null)
    *   `shipping_method` (text, nullable)
    *   `payment_method` (text, nullable)
    *   `tracking_number` (text, nullable)
    *   `created_at` (timestamp with time zone, default `now()`)
    *   `updated_at` (timestamp with time zone, default `now()`)

*   **`order_items`**
    *   `id` (uuid, primary key, default `gen_random_uuid()`)
    *   `order_id` (uuid, foreign key references `orders.id`, on delete cascade)
    *   `product_id` (uuid, foreign key references `products.id`) // Can be nullable if product is deleted, or handle differently
    *   `product_name_snapshot` (text, not null) // Snapshot of product name at time of order
    *   `quantity` (integer, not null)
    *   `price_per_unit_snapshot` (decimal, not null) // Snapshot of price at time of order
    *   `product_image_url_snapshot` (text, nullable) // Snapshot of main image URL
    *   `created_at` (timestamp with time zone, default `now()`)

### 1.3. Authentication Setup
- Review Supabase Auth settings.
- Enable desired sign-in methods (e.g., email/password, social logins).
- Configure email templates if necessary.

### 1.4. Storage Setup
- Create Supabase Storage buckets:
    - `product_images` (public or private with signed URLs, depending on access patterns)
    - `store_logos` (public)
    - `user_avatars` (public)
- Define storage policies for access control.

## Phase 2: Next.js Application Integration

### 2.1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 2.2. Configure Supabase Client in Next.js
- Create environment variables for Supabase URL and Anon Key in `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
  ```
- Create a Supabase client utility (`src/lib/supabase/client.ts` for client-side, `src/lib/supabase/server.ts` for server-side/Route Handlers if needed).
  ```typescript
  // src/lib/supabase/client.ts
  import { createBrowserClient } from '@supabase/ssr';

  export function createClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  ```
  ```typescript
  // src/lib/supabase/server.ts (Example for Route Handlers / Server Components)
  import { createServerClient, type CookieOptions } from '@supabase/ssr';
  import { cookies } from 'next/headers';

  export function createClient() {
    const cookieStore = cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
  }
  ```
- Set up Supabase Auth Helpers for Next.js (`@supabase/auth-helpers-nextjs`) for easier session management if using Pages Router or for specific SSR scenarios with App Router. For App Router, `@supabase/ssr` is generally preferred.

### 2.3. Create Supabase Helper/Service Functions
- Create service files (e.g., `src/services/storeService.ts`, `src/services/productService.ts`, `src/services/orderService.ts`) to encapsulate Supabase data fetching and mutation logic.
- These functions will interact with the Supabase client to perform CRUD operations.

## Phase 3: Authentication

### 3.1. Implement User Sign-up & Sign-in
- Create authentication pages (sign-up, sign-in, password reset).
- Use Supabase client methods for authentication (e.g., `supabase.auth.signUp`, `supabase.auth.signInWithPassword`).
- Handle user sessions and redirects.

### 3.2. Protect Routes & API Endpoints
- Implement middleware (`src/middleware.ts`) to protect authenticated routes.
  ```typescript
  // src/middleware.ts
  import { createServerClient, type CookieOptions } from '@supabase/ssr'
  import { NextResponse, type NextRequest } from 'next/server'

  export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // if user is not signed in and the current path is not /login, redirect the user to /login
    if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/signup')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // if user is signed in and the current path is /login or /signup, redirect to dashboard
    if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }


    return response
  }

  export const config = {
    matcher: [
      /*
       * Match all request paths except for the ones starting with:
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       * Feel free to modify this pattern to include more paths.
       */
      '/((?!_next/static|_next/image|favicon.ico|auth).*)',
    ],
  }
  ```
- Ensure API routes (if any) also check for authentication.

### 3.3. Update User Profile Management (Settings Page)
- Refactor the "Profile" tab in `settings/page.tsx` to fetch and update user data (username, avatar) from the `users` table (linked to `auth.users`).
- Integrate Supabase Storage for avatar uploads.

## Phase 4: Data Management - Stores

### 4.1. Refactor `stores/page.tsx`
- **List Stores:** Fetch stores associated with the logged-in user from Supabase.
- **Create Store:** Save new store data to Supabase, associating it with the `user_id`.
- **Edit Store:** Update store details in Supabase.
- **Delete Store:** Remove store data from Supabase.
- Update `social_links` table accordingly.

### 4.2. Refactor `settings/page.tsx` (Store Details Section)
- When a store is selected (via `storeId` query param), fetch its details from Supabase.
- Save updates to store name, description, category, location, status, logo, and social links to Supabase.
- Integrate Supabase Storage for store logo uploads.

## Phase 5: Data Management - Products

### 5.1. Refactor `products/page.tsx`
- **List Products:** Fetch products belonging to the currently selected store from Supabase.
- **Create Product:** Save new product data to Supabase, associating it with the `store_id`. Handle image uploads to Supabase Storage and save URLs to `product_images` table.
- **Edit Product:** Update product details in Supabase. Manage `product_images` (add, remove, reorder).
- **Delete Product:** Remove product data and associated images from Supabase.

### 5.2. Refactor `products/[id]/page.tsx`
- Fetch detailed product information, including all its images from `product_images`.
- Allow editing of product details and images, saving changes to Supabase.

### 5.3. Integrate Supabase Storage for Product Images
- Modify image upload components to upload files directly to the `product_images` bucket in Supabase Storage.
- Store the public URLs (or manage signed URLs if private) in the `product_images` table.
- Handle deletion of images from storage when a product image record is deleted or the product itself is deleted.

## Phase 6: Data Management - Orders

### 6.1. Refactor `orders/page.tsx`
- **List Orders:** Fetch orders associated with the currently selected store from Supabase.
- **Create Order (Manual Entry):**
    - Save new order data to the `orders` table in Supabase.
    - Save associated items to the `order_items` table.
    - Ensure `store_id` is correctly associated.

### 6.2. Refactor `orders/[id]/page.tsx`
- Fetch detailed order information, including items from `order_items`.
- Allow updating order status and saving changes to Supabase.

## Phase 7: Dashboard Integration

### 7.1. Update `dashboard/page.tsx`
- Fetch relevant statistics (total revenue, active orders, products sold, new customers for the selected store) from Supabase. This will require writing SQL queries or using Supabase RPC functions for aggregations.
- Fetch top-performing products for the selected store.

## Phase 8: Security

### 8.1. Implement Row Level Security (RLS)
- Define RLS policies for all tables to ensure users can only access and modify their own data (or data related to their stores).
    - Example for `stores`: A user can select their own stores. `(auth.uid() = user_id)`
    - Example for `products`: A user can manage products for stores they own. `(store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()))`
- Test RLS policies thoroughly.

### 8.2. Review and Secure API Routes
- If any API routes are kept or added, ensure they properly authorize requests based on the authenticated user and RLS.

## Phase 9: Testing & Refinement

### 9.1. Comprehensive Testing
- Test all CRUD operations for stores, products, and orders.
- Test user authentication flows (sign-up, sign-in, sign-out, password reset).
- Test image and file uploads to Supabase Storage.
- Verify RLS policies are working as expected.
- Test edge cases and error handling.

### 9.2. Performance Optimization
- Analyze database query performance.
- Add indexes to tables on frequently queried columns.
- Consider pagination for long lists.

## Phase 10: Deployment

### 10.1. Environment Variables
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correctly configured in the deployment environment (e.g., Vercel, Netlify).
- If using a service role key for server-side operations (e.g., in cron jobs or specific admin tasks, not generally for user-facing requests), ensure it's securely stored (`SUPABASE_SERVICE_ROLE_KEY`).

### 10.2. Final Checks
- Review database backup strategy (Supabase handles this, but be aware of options).
- Perform a final security review.

This roadmap provides a structured approach to integrating Supabase. Each phase may have sub-tasks and require iterative development.
