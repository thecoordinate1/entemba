
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Zap, BarChart3, Globe, ShieldCheck, ShoppingBag, Truck, Smartphone, Layers, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navigation Bar */}
            <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
                <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold text-xl flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary" />
                        E-Ntemba
                    </Link>
                    <div className="hidden md:flex gap-6">
                        <Link href="/features" className="text-sm font-medium text-primary">Features</Link>
                        <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
                        <Link href="/showcase" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Showcase</Link>
                        <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</Link>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/login">Log in</Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/signup">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-20 md:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
                <div className="container px-4 md:px-6 relative z-10 text-center">
                    <Badge className="mb-6 py-1 px-4 text-sm font-medium variant-secondary bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                        Powerful Tools for Modern Commerce
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
                        Everything you need to <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">dominate</span> your market
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        E-Ntemba isn't just a dashboard; it's a complete ecosystem designed to streamline your operations, boost your sales, and grow your brand.
                    </p>
                    <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20" asChild>
                        <Link href="/signup">Start Your Free Trial</Link>
                    </Button>
                </div>
            </section>

            {/* Core Features Grid */}
            <section className="py-20 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<BarChart3 className="h-8 w-8 text-blue-500" />}
                            title="Advanced Analytics"
                            description="Deep dive into your sales data. Track revenue, profit margins, and customer lifetime value in real-time."
                        />
                        <FeatureCard
                            icon={<ShoppingBag className="h-8 w-8 text-purple-500" />}
                            title="Multi-Channel Inventory"
                            description="Sync your stock across your online store, social media, and physical locations automatically."
                        />
                        <FeatureCard
                            icon={<Truck className="h-8 w-8 text-green-500" />}
                            title="Smart Fulfillment"
                            description="Automate your shipping process. Print labels, track packages, and keep customers updated effortlessly."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8 text-orange-500" />}
                            title="CRM & Marketing"
                            description="Manage customer relationships and run targeted marketing campaigns to drive repeat business."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="h-8 w-8 text-red-500" />}
                            title="Secure Payments"
                            description="Accept payments globally with our secure, PCI-compliant gateway. Fraud protection included."
                        />
                        <FeatureCard
                            icon={<Smartphone className="h-8 w-8 text-indigo-500" />}
                            title="Mobile Management"
                            description="Run your entire business from your phone with our fully responsive mobile app."
                        />
                    </div>
                </div>
            </section>

            {/* Detailed Feature Highlight - 1 */}
            <section className="py-24">
                <div className="container px-4 md:px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 relative rounded-xl overflow-hidden border border-border/50 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
                            <Image
                                src="/dashboard-hero-v2.png"
                                alt="Analytics Dashboard"
                                width={1600}
                                height={900}
                                className="w-full h-auto object-cover"
                                unoptimized
                            />
                        </div>
                        <div className="order-1 md:order-2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium">
                                <BarChart3 className="h-4 w-4" /> Analytics
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold">Data that drives decisions</h2>
                            <p className="text-lg text-muted-foreground">
                                Stop guessing. Our analytics engine gives you actionable insights into what's working and what's not. Visualize trends, identify top-performing products, and understand your customer demographics.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>Real-time revenue tracking</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>Automated sales reports</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>Inventory forecasting</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Detailed Feature Highlight - 2 */}
            <section className="py-24 bg-muted/20">
                <div className="container px-4 md:px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium">
                                <Layers className="h-4 w-4" /> Integrations
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold">Connect your favorite tools</h2>
                            <p className="text-lg text-muted-foreground">
                                E-Ntemba plays nice with others. Seamlessly integrate with the tools you already use for accounting, email marketing, and logistics.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>One-click integration with major carriers</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>Sync with accounting software</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>Social media sales channel connections</span>
                                </li>
                            </ul>
                        </div>
                        <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-2xl bg-card p-8 flex items-center justify-center min-h-[400px]">
                            <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                                <div className="bg-background p-6 rounded-lg shadow-sm border border-border flex items-center justify-center h-24">
                                    <span className="font-bold text-xl text-muted-foreground">Stripe</span>
                                </div>
                                <div className="bg-background p-6 rounded-lg shadow-sm border border-border flex items-center justify-center h-24">
                                    <span className="font-bold text-xl text-muted-foreground">PayPal</span>
                                </div>
                                <div className="bg-background p-6 rounded-lg shadow-sm border border-border flex items-center justify-center h-24">
                                    <span className="font-bold text-xl text-muted-foreground">DHL</span>
                                </div>
                                <div className="bg-background p-6 rounded-lg shadow-sm border border-border flex items-center justify-center h-24">
                                    <span className="font-bold text-xl text-muted-foreground">Slack</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10" />
                <div className="container px-4 md:px-6 relative z-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Ready to scale your business?</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        Join thousands of vendors who have transformed their business with E-Ntemba.
                    </p>
                    <Button size="lg" className="h-14 px-10 text-lg rounded-full" asChild>
                        <Link href="/signup">Get Started for Free</Link>
                    </Button>
                </div>
            </section>

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
        <div className="p-8 rounded-2xl border border-border/50 bg-card hover:bg-card/80 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
            <div className="mb-6 p-4 rounded-xl bg-background border border-border/50 w-fit">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    )
}
