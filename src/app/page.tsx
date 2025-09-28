
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Info, Store, Package, BarChart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 bg-gradient-to-br from-background to-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-4 animate-slide-in-from-bottom duration-700">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                  Welcome to E-Ntemba
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Your all-in-one solution for managing your online stores. Streamline your operations, track sales, and grow your business with ease.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row pt-6 animate-slide-in-from-bottom duration-700 delay-300">
                <Button size="lg" asChild className="animate-pulse-primary hover:animate-none">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/about">
                    Learn More
                    <Info className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
               <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 pt-20">
                <div className="grid gap-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm animate-fade-in-out">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                      <Store className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold">Step 1</h3>
                  </div>
                  <h4 className="text-lg font-semibold">Create Your Store</h4>
                  <p className="text-sm text-muted-foreground">
                    Sign up and create your first storefront in just a few clicks. Customize its name, description, and logo.
                  </p>
                </div>
                <div className="grid gap-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm animate-fade-in-out animation-delay-2000">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                      <Package className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold">Step 2</h3>
                  </div>
                  <h4 className="text-lg font-semibold">Add Your Products</h4>
                  <p className="text-sm text-muted-foreground">
                    Use our simple product management tools to upload images, set prices, and track your inventory.
                  </p>
                </div>
                <div className="grid gap-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm animate-fade-in-out animation-delay-4000">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                      <BarChart className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold">Step 3</h3>
                  </div>
                  <h4 className="text-lg font-semibold">Start Selling</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage incoming orders, track your revenue, and gain insights with our powerful reporting tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center animate-fade-in-scroll">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-muted-foreground">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need to Succeed
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  E-Ntemba provides a comprehensive suite of tools to help you manage your e-commerce business efficiently.
                </p>
              </div>
            </div>
            <div className="mx-auto flex flex-col items-center gap-8 pt-12">
              <div className="grid gap-1 p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow animate-slide-in-from-left duration-500 delay-200 w-full max-w-md">
                <h3 className="text-lg font-bold text-primary">Store Management</h3>
                <p className="text-sm text-muted-foreground">
                  Easily create and manage multiple online stores from a single dashboard.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow animate-slide-in-from-right duration-500 delay-300 w-full max-w-md">
                <h3 className="text-lg font-bold text-primary">Product Catalog</h3>
                <p className="text-sm text-muted-foreground">
                  Organize your products, manage inventory, and set pricing with intuitive tools.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow animate-slide-in-from-left duration-500 delay-400 w-full max-w-md">
                <h3 className="text-lg font-bold text-primary">Order Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Track orders, manage fulfillment, and keep your customers updated.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center bg-primary/5 p-12 rounded-lg animate-fade-in-scroll">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-primary">
                  Ready to Grow Your Business?
                </h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                  Join E-Ntemba today and take control of your e-commerce success. Sign up now to get started.
                </p>
              </div>
              <Button size="lg" asChild>
                <Link href="/signup">
                  Sign Up Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 E-Ntemba. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground">
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
