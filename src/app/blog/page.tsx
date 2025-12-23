
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ArrowRight } from "lucide-react";

export default function BlogPage() {
  const posts = [
    {
       title: "5 Tips to Optimizing Your Store for Black Friday",
       excerpt: "Get ready for the biggest shopping season of the year with our expert guide on inventory and marketing.",
       date: "Nov 1, 2025",
       image: "https://placehold.co/600x400/png?text=Black+Friday"
    },
    {
       title: "Understanding E-Commerce Logistics in Zambia",
       excerpt: "We break down the challenges and solutions for delivering products to customers across the country.",
       date: "Oct 24, 2025",
       image: "https://placehold.co/600x400/png?text=Logistics"
    },
    {
       title: "How to Take Product Photos That Sell",
       excerpt: "You don't need a professional camera. Learn how to use your phone to take stunning product shots.",
       date: "Oct 15, 2025",
       image: "https://placehold.co/600x400/png?text=Photography"
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
             <div className="flex gap-4">
                <Button variant="ghost" size="sm" asChild>
                   <Link href="/">Back to Home</Link>
                </Button>
            </div>
        </div>
        </nav>

      <section className="py-20 md:py-32 bg-muted/30">
         <div className="container px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">The E-Ntemba Blog</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Insights, updates, and resources for your business.
            </p>
         </div>
      </section>

      <section className="py-20">
         <div className="container px-4 md:px-6">
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {posts.map((post, index) => (
                     <article key={index} className="group flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-xl transition-all duration-300">
                         <div className="relative aspect-video overflow-hidden">
                             <Image 
                                 src={post.image}
                                 alt={post.title}
                                 fill
                                 className="object-cover transition-transform duration-500 group-hover:scale-105"
                             />
                         </div>
                         <div className="p-6 flex-1 flex flex-col">
                             <div className="flex items-center text-sm text-muted-foreground mb-3">
                                 <CalendarDays className="h-4 w-4 mr-2" />
                                 {post.date}
                             </div>
                             <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{post.title}</h3>
                             <p className="text-muted-foreground flex-1 line-clamp-3">
                                 {post.excerpt}
                             </p>
                             <div className="pt-4 mt-4 border-t border-border/50">
                                 <span className="text-primary font-medium flex items-center hover:underline cursor-pointer">
                                     Read More <ArrowRight className="ml-1 h-4 w-4" />
                                 </span>
                             </div>
                         </div>
                     </article>
                 ))}
             </div>
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
