
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Scale } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">

      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container px-4 md:px-6 h-16 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="font-semibold text-lg flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Legal Center
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 md:py-20 bg-muted/20">
        <div className="container px-4 md:px-6">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/5">
            Last Updated: October 29, 2025
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Please read these terms carefully before using our services.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-[250px_1fr] gap-12 items-start">

            {/* Table of Contents (Sticky) */}
            <aside className="hidden lg:block sticky top-24">
              <nav className="space-y-1">
                <TOCLink href="#introduction">1. Introduction</TOCLink>
                <TOCLink href="#accounts">2. User Accounts</TOCLink>
                <TOCLink href="#responsibilities">3. Vendor Responsibilities</TOCLink>
                <TOCLink href="#prohibited">4. Prohibited Conduct</TOCLink>
                <TOCLink href="#fees">5. Fees and Payments</TOCLink>
                <TOCLink href="#termination">6. Termination</TOCLink>
                <TOCLink href="#liability">7. Liability</TOCLink>
                <TOCLink href="#contact">8. Contact Us</TOCLink>
              </nav>
            </aside>

            {/* Main Text */}
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
              <section id="introduction" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p>
                  Welcome to E-Ntemba ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our vendor dashboard, services, and website (collectively, the "Service"). By creating an account or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service.
                </p>
              </section>

              <section id="accounts" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">2. User Accounts</h2>
                <p>
                  To use our Service, you must register for an account. You represent and warrant that all information you submit is true, accurate, current, and complete. You agree to update such information to keep it true, accurate, current, and complete. You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account.
                </p>
              </section>

              <section id="responsibilities" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">3. Vendor Responsibilities</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You are solely responsible for the products you sell, including their quality, safety, and legality.</li>
                  <li>You are responsible for all content you upload to the Service, including product descriptions, images, and pricing. You represent that you have all necessary rights to such content.</li>
                  <li>You agree to accurately manage your inventory and fulfill all orders placed through the platform in a timely manner.</li>
                  <li>You must handle customer service, returns, and refunds in accordance with applicable law and your own store policies.</li>
                </ul>
              </section>

              <section id="prohibited" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">4. Prohibited Conduct</h2>
                <p>You agree not to use the Service to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Sell illegal, counterfeit, stolen, or hazardous items.</li>
                  <li>Violate any local, state, national, or international law.</li>
                  <li>Infringe upon the rights of others, including copyright, trademark, privacy, publicity, or other personal or proprietary rights.</li>
                  <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
                </ul>
              </section>

              <section id="fees" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">5. Fees and Payments</h2>
                <p>
                  Use of our Service may be subject to transaction fees, subscription fees, or other charges, which will be disclosed to you. You are responsible for paying all applicable fees and taxes associated with your use of the Service and sales. Payouts to you will be made according to the payment schedule and method specified in your account settings.
                </p>
              </section>

              <section id="termination" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">6. Termination</h2>
                <p>
                  We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users of the Service, us, or third parties, or for any other reason.
                </p>
              </section>

              <section id="liability" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">7. Disclaimer of Warranties and Limitation of Liability</h2>
                <div className="bg-muted/50 p-6 rounded-lg text-sm font-mono border border-border">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE. IN NO EVENT SHALL E-NTEMBA BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
                </div>
              </section>

              <section id="contact" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
                <div className="bg-muted p-6 rounded-lg">
                  <p className="mb-2">If you have questions about these Terms, please contact us at:</p>
                  <a href="mailto:support@entemba.shop" className="text-primary font-semibold hover:underline">support@entemba.shop</a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function TOCLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="block py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
      {children}
    </a>
  )
}
