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
    Log in to your Supabase account, navigate to the "SQL Editor", and run the SQL scripts located in the `supabase/` directory of this project. This will create the necessary tables and functions.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Next Steps

After your initial commit, you can continue to develop features. The standard workflow is:
1.  Make changes to your code.
2.  `git add .`
3.  `git commit -m "A descriptive message about your changes"`
4.  `git push origin main`
