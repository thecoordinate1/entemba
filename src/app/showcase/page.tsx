
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function ShowcasePage() {
  const cases = [
    {
      company: "Lusaka Fashion Hub",
      category: "Fashion",
      description: "How a local boutique scaled to nationwide delivery using E-Ntemba's logistics integration.",
      image: "https://placehold.co/600x400/png?text=Fashion+Hub",
      stats: "300% Growth in 6 months"
    },
    {
      company: "Zed Gadgets",
      category: "Electronics",
      description: "Managing inventory across 3 physical stores and one online dashboard.",
      image: "https://placehold.co/600x400/png?text=Zed+Gadgets",
      stats: "15k+ Monthly Orders"
    },
    {
      company: "Green Organic Farms",
      category: "Groceries",
      description: "Connecting fresh produce directly to consumers with subscription-based ordering.",
      image: "https://placehold.co/600x400/png?text=Organic+Farms",
      stats: "98% Customer Retention"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
        <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary" />
            E-Ntemba
            </Link>
             <div className="hidden md:flex gap-6">
                <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</Link>
                <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
                <Link href="/showcase" className="text-sm font-medium text-primary">Showcase</Link>
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

      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Success Stories</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                See how businesses are building their dreams on E-Ntemba.
            </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cases.map((item, index) => (
                    <div key={index} className="group overflow-hidden rounded-2xl border border-border/50 bg-card hover:shadow-xl transition-all duration-300">
                        <div className="relative aspect-video overflow-hidden">
                             <Image 
                                src={item.image} 
                                alt={item.company} 
                                fill 
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                             />
                        </div>
                        <div className="p-6 space-y-4">
                             <div className="text-sm text-primary font-medium uppercase tracking-wider">{item.category}</div>
                             <h3 className="text-2xl font-bold">{item.company}</h3>
                             <p className="text-muted-foreground">{item.description}</p>
                             <div className="pt-4 border-t border-border/50 font-semibold flex items-center gap-2">
                                <span className="text-green-500">VP</span> {item.stats}
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

       <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to write your own success story?</h2>
            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg rounded-full" asChild>
                <Link href="/signup">Start Selling Today</Link>
            </Button>
        </div>
      </section>
      
       <footer className="py-12 border-t border-border/50 bg-background text-foreground">
        <div className="container px-4 md:px-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} E-Ntemba. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
