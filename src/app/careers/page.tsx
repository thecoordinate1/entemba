
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, MapPin, Briefcase } from "lucide-react";

export default function CareersPage() {
  const positions = [
    {
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "Remote (Zambia)",
      type: "Full-time"
    },
     {
      title: "Product Designer",
      department: "Design",
      location: "Lusaka, Zambia",
      type: "Full-time"
    },
     {
      title: "Customer Success Manager",
      department: "Support",
      location: "Remote",
      type: "Full-time"
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Join the E-Ntemba Team</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We're building the future of e-commerce in Africa. Come help us empower millions of entrepreneurs.
            </p>
         </div>
      </section>

      <section className="py-20">
         <div className="container px-4 md:px-6 max-w-4xl mx-auto">
             <h2 className="text-2xl font-bold mb-8">Open Positions</h2>
             <div className="space-y-4">
                 {positions.map((job, index) => (
                     <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border border-border/50 bg-card hover:border-primary/50 transition-colors">
                         <div className="mb-4 md:mb-0">
                             <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
                             <div className="flex gap-4 text-sm text-muted-foreground">
                                 <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.department}</span>
                                 <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                             </div>
                         </div>
                         <Button variant="outline" asChild>
                             <Link href="#">Apply Now</Link>
                         </Button>
                     </div>
                 ))}
             </div>
             <p className="mt-12 text-center text-muted-foreground">
                 Don't see a perfect fit? Send your resume to <a href="mailto:careers@entemba.shop" className="text-primary hover:underline">careers@entemba.shop</a>.
             </p>
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
