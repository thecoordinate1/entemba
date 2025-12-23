
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Globe, Heart, Lightbulb, Rocket, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">

      {/* 1. Navigation (Optional - if main layout doesn't provide it, kept simple back button for consistency with previous design) */}
      <div className="container mx-auto py-6 px-4 md:px-6">
        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
          Back to Home
        </Link>
      </div>

      {/* 2. Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="container px-4 md:px-6 relative z-10 text-center">
          <Badge className="mb-6 py-1 px-4 text-sm font-medium variant-secondary bg-primary/10 text-primary border-primary/20">
            Our Story
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
            Building the future of <span className="text-primary">local commerce</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            E-Ntemba is more than a platform; it's a movement to empower every vendor, shopkeeper, and entrepreneur with the technology they need to succeed in the digital age.
          </p>
        </div>
      </section>

      {/* 3. Mission & Vision */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
              <Image
                src="/dashboard-hero-v2.png"
                alt="E-Ntemba Dashboard Vision"
                width={800}
                height={600}
                className="w-full h-auto object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div className="text-white">
                  <p className="font-bold text-lg">Empowering 1000+ Vendors</p>
                  <p className="text-sm opacity-80">And counting...</p>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 text-blue-500 rounded-xl mb-4">
                  <Rocket className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  To democratize e-commerce technology. We believe that powerful business tools shouldn't be reserved for giant corporations. We're leveling the playing field, giving local vendors the same capabilities as major retailers.
                </p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 text-purple-500 rounded-xl mb-4">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  A connected marketplace where geography is no longer a barrier to success. We envision a world where a unique product made in a small town can easily reach customers across the entire country.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Our Values */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Driven by Values</h2>
            <p className="text-muted-foreground text-lg">The core principles that guide every decision we make.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm hover:translate-y-[-5px] transition-transform duration-300">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-primary">
                  <Heart className="h-8 w-8" />
                </div>
                <CardTitle>Customer Obsession</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                We don't just build software; we build solutions for real people. Your success is our only metric of success.
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm hover:translate-y-[-5px] transition-transform duration-300">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-orange-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-orange-500">
                  <Globe className="h-8 w-8" />
                </div>
                <CardTitle>Community First</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                We thrive when our community thrives. We actively support local initiatives and foster a network of mutual growth.
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm hover:translate-y-[-5px] transition-transform duration-300">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-green-500">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <CardTitle>Trust & Integrity</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Transparency is our foundation. We build secure, reliable systems because your trust is our most valuable asset.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. Why Choose Us (Refined) */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[800px] border-[60px] border-white rounded-full blur-[100px]" />
        </div>

        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Why top vendors choose <br /> E-Ntemba?</h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-md">
                Join the platform that understands the unique challenges of modern retail and provides the tools to solve them.
              </p>
              <Button size="lg" variant="secondary" className="h-12 px-8 rounded-full shadow-xl" asChild>
                <Link href="/signup">
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-xl mb-2">All-in-One Dashboard</h3>
                    <p className="opacity-80">Stop switching between 5 different apps. Manage inventory, orders, and shipping from one place.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  <Users className="h-6 w-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-xl mb-2">Designed for Teams</h3>
                    <p className="opacity-80">Granular permissions and multi-user support let your whole team collaborate effectively.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer CTA */}
      <section className="py-24 text-center">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold mb-6">Ready to write your success story?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="px-8 rounded-full h-12" asChild>
              <Link href="/signup">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 rounded-full h-12" asChild>
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
