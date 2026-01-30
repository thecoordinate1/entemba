
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, BarChart3, ShoppingBag, Globe, ShieldCheck, Zap, Twitter, Facebook, Instagram, Linkedin, Github } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50 mix-blend-screen" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] opacity-50 mix-blend-screen" />
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center space-y-8">


              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground bg-size-200 animate-gradient-x animate-slide-in-from-bottom max-w-4xl">
                Master Your E-Commerce Empire with <span className="text-primary">E-Ntemba</span>
              </h1>

              <p className="max-w-[800px] text-lg md:text-xl text-muted-foreground animate-slide-in-from-bottom delay-100">
                The ultimate vendor dashboard designed for modern businesses. Manage multiple stores, track real-time analytics, and streamline fulfillment—all from one powerful interface.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-slide-in-from-bottom delay-200">
                <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 animate-pulse-primary hover:animate-none" asChild>
                  <Link href="/signup">
                    Start Selling
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full border-muted-foreground/20 hover:bg-muted/50 backdrop-blur-sm" asChild>
                  <Link href="/shop">
                    View Shop
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" className="h-12 px-8 text-lg rounded-full hover:bg-muted/30" asChild>
                  <Link href="/about">
                    Learn More
                  </Link>
                </Button>
              </div>

              {/* Dashboard Preview */}
              <div className="mt-16 relative w-full max-w-5xl mx-auto animate-slide-in-from-bottom delay-300 perspective-1000">
                <div className="relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden transform rotate-x-12 transition-transform duration-700 hover:rotate-x-0 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-purple-500/5 pointer-events-none" />
                  <Image
                    src="/dashboard-hero-v2.png"
                    alt="E-Ntemba Dashboard Interface"
                    width={1600}
                    height={900}
                    className="w-full h-auto object-cover"
                    priority
                    unoptimized
                  />
                </div>
                {/* Decorative elements behind the dashboard */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-b from-primary/10 to-transparent blur-3xl -rotate-6 rounded-[3rem]" />
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Stats */}
        <section className="py-12 border-y border-border/50 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Our Targets</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-foreground">1k+</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Active Vendors</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-foreground">K100M+</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Revenue Processed</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-foreground">99.9%</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Uptime</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-foreground">24/7</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Support</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 md:py-32 relative">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need to scale</h2>
              <p className="text-lg text-muted-foreground">Stop wrestling with spreadsheets, whatsapp messages. E-Ntemba gives you the professional tools to manage your business like a pro.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<ShoppingBag className="h-10 w-10 text-primary" />}
                title="Multi-Store Management"
                description="Run multiple brands or storefronts from a single account. Switch contexts instantly and keep everything organized."
              />
              <FeatureCard
                icon={<BarChart3 className="h-10 w-10 text-blue-500" />}
                title="Real-Time Analytics"
                description="Make data-driven decisions with live dashboards showing revenue, profit margins, and top-selling products."
              />
              <FeatureCard
                icon={<Zap className="h-10 w-10 text-yellow-500" />}
                title="Instant Order Updates"
                description="Never miss a sale. Receive real-time notifications for new orders and update statuses with a single click."
              />
              <FeatureCard
                icon={<Globe className="h-10 w-10 text-cyan-500" />}
                title="Country Wide Reach"
                description="Reach customers across the country. Our platform supports local delivery and country-wide shipping."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-10 w-10 text-green-500" />}
                title="Secure Payments"
                description="Built-in fraud protection and secure payment processing to keep your and your customers' data safe."
              />
              <FeatureCard
                icon={<CheckCircle2 className="h-10 w-10 text-purple-500" />}
                title="Inventory Sync"
                description="Automatically track stock levels across all your sales channels. Prevent overselling and stockouts."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />

          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-3xl border border-primary/20 bg-background/50 backdrop-blur-lg shadow-2xl">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to transform your business?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of successful vendors who trust E-Ntemba. No credit card required for the free tier.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform" asChild>
                  <Link href="/signup">
                    Create Your Free Account
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground pt-4">
                Free 14-day trial on Pro plans • Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border/50 bg-muted/10">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-primary" />
                E-Ntemba
              </h4>
              <p className="text-sm text-muted-foreground">
                Empowering local vendors with world-class e-commerce tools.
              </p>
              <div className="flex gap-4 pt-2">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/showcase" className="hover:text-primary transition-colors">Showcase</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} E-Ntemba. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group p-6 rounded-2xl border border-border/50 bg-card hover:bg-card/80 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="mb-4 p-3 rounded-xl bg-background border border-border/50 w-fit group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}
