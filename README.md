# E-Ntemba Vendor Dashboard

This is a comprehensive vendor dashboard for the E-Ntemba e-commerce platform, built with Next.js, Supabase, and ShadCN UI. It provides vendors with the tools they need to manage their stores, products, orders, and customers efficiently.

## Features

*   **Store Management:** Add and manage multiple storefronts from a single account.
*   **Product Catalog:** Full CRUD (Create, Read, Update, Delete) functionality for products, including image uploads and inventory tracking.
*   **Order Processing:** View and update order statuses to manage the fulfillment lifecycle.
*   **Customer Management:** Keep track of customer information and their order history.
*   **Reporting & Analytics:** Dynamic dashboards for tracking key metrics like revenue and profit.
*   **Secure Authentication:** User sign-up, sign-in, and password management powered by Supabase Auth.
*   **AI Integration:** Utilizes Genkit for AI-powered features like the delivery capacity estimator.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Backend & DB:** [Supabase](https://supabase.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
*   **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn
*   A Supabase account and project

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your_username/your_repository_name.git
    ```
2.  Install NPM packages:
    ```bash
    npm install
    ```
3.  Set up your environment variables. Create a file named `.env` in the root of the project and add your Supabase credentials:
    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
