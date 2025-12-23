
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navigation Bar (reused for consistency) */}
            <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
                <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold text-xl flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary" />
                        E-Ntemba
                    </Link>
                    <div className="hidden md:flex gap-6">
                        <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</Link>
                        <Link href="/pricing" className="text-sm font-medium text-primary">Pricing</Link>
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

            <section className="py-20 md:py-32 bg-muted/20">
                <div className="container px-4 md:px-6 text-center">
                    <Badge className="mb-6 py-1 px-4 text-sm font-medium variant-secondary bg-primary/10 text-primary border-primary/20">
                        Straightforward Pricing
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Plans for every stage of your journey
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-16">
                        Start for free, upgrade as you grow. No hidden fees.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Starter Plan */}
                        <PricingCard
                            title="Starter"
                            price="Free"
                            description="Perfect for new vendors just getting started."
                            features={[
                                "1 Store",
                                "Up to 50 Products",
                                "Basic Analytics",
                                "Standard Support",
                                "2.9% + 30¢ transaction fee"
                            ]}
                            cta="Start for Free"
                            ctaLink="/signup"
                        />
                        {/* Growth Plan */}
                        <PricingCard
                            title="Growth"
                            price="$29"
                            period="/mo"
                            description="For growing businesses needing more power."
                            features={[
                                "3 Stores",
                                "Unlimited Products",
                                "Advanced Analytics",
                                "Priority Support",
                                "2.0% transaction fee",
                                "Custom Domain Support"
                            ]}
                            isPopular={true}
                            cta="Start 14-Day Trial"
                            ctaLink="/signup?plan=growth"
                        />
                        {/* Pro Plan */}
                        <PricingCard
                            title="Pro"
                            price="$79"
                            period="/mo"
                            description="For high-volume sellers and scaling teams."
                            features={[
                                "10 Stores",
                                "Unlimited Products",
                                "Real-time Reports",
                                "24/7 Dedicated Support",
                                "1.0% transaction fee",
                                "API Access",
                                "Team Roles & Permissions"
                            ]}
                            cta="Start 14-Day Trial"
                            ctaLink="/signup?plan=pro"
                        />
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24">
                <div className="container px-4 md:px-6 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                    <div className="grid gap-8">
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Can I change plans later?</h3>
                            <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time from your account settings.</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Is there a free trial?</h3>
                            <p className="text-muted-foreground">We offer a 14-day free trial for our Growth and Pro plans. No credit card required to start.</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">What payment methods do you accept?</h3>
                            <p className="text-muted-foreground">We accept all major credit cards, PayPal, and Mobile Money.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer (Simplified) */}
            <footer className="py-12 border-t border-border/50 bg-muted/10">
                <div className="container px-4 md:px-6 text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} E-Ntemba. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

function PricingCard({ title, price, period, description, features, isPopular, cta, ctaLink }: {
    title: string,
    price: string,
    period?: string,
    description: string,
    features: string[],
    isPopular?: boolean,
    cta: string,
    ctaLink: string
}) {
    return (
        <div className={`relative p-8 rounded-2xl border ${isPopular ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-border/50 bg-card'} flex flex-col`}>
            {isPopular && (
                <div className="absolute top-0 right-0 -mr-2 -mt-2">
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary">Most Popular</Badge>
                </div>
            )}
            <div className="mb-6">
                <h3 className="text-2xl font-bold">{title}</h3>
                <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-extrabold">{price}</span>
                    {period && <span className="text-muted-foreground ml-1">{period}</span>}
                </div>
                <p className="text-muted-foreground mt-4">{description}</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                        <Check className="h-5 w-5 text-primary shrink-0" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <Button className={`w-full ${isPopular ? 'shadow-lg shadow-primary/20' : ''}`} variant={isPopular ? 'default' : 'outline'} size="lg" asChild>
                <Link href={ctaLink}>{cta}</Link>
            </Button>
        </div>
    )
}
