import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="mb-8">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Card className="mb-12 shadow-lg">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-primary">About E-Ntemba</CardTitle>
          <CardDescription className="text-xl text-muted-foreground mt-2">
            Empowering vendors with seamless e-commerce management.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-lg">
          <p>
            E-Ntemba is a comprehensive vendor dashboard designed to simplify the complexities of running an online business. 
            Our platform provides intuitive tools for managing multiple storefronts, product catalogs, orders, and customer interactions,
            all from a centralized hub.
          </p>
          <p>
            Our mission is to equip entrepreneurs and businesses of all sizes with the technology they need to thrive in the
            digital marketplace. We believe in the power of e-commerce to connect vendors with customers globally, and we're
            committed to making that process as efficient and effective as possible.
          </p>
          <div className="grid md:grid-cols-2 gap-8 items-center pt-6">
            <div>
                <h3 className="text-2xl font-semibold text-primary mb-3">Our Vision</h3>
                <p className="text-muted-foreground">
                    To be the leading platform that empowers vendors to build, manage, and scale their online businesses with confidence and ease. 
                    We envision a world where every entrepreneur has the tools to succeed in the digital economy.
                </p>
            </div>
            <Image 
                src="https://placehold.co/500x350.png" 
                alt="Team working on E-Ntemba" 
                width={500} 
                height={350} 
                className="rounded-lg shadow-md object-cover"
            />
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">Why Choose E-Ntemba?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>Unified Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Manage all your stores, products, and orders from one intuitive interface.</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>Scalable Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Whether you're just starting or rapidly growing, E-Ntemba scales with your business needs.</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>Data-Driven Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Access reports and analytics to make informed decisions and optimize your sales.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
