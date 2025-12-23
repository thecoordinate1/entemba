
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ScrollText } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
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
            <ScrollText className="h-5 w-5 text-primary" />
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
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            We are committed to protecting your privacy and ensuring you have control over your data.
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
                <TOCLink href="#collection">2. Information We Collect</TOCLink>
                <TOCLink href="#usage">3. How We Use Information</TOCLink>
                <TOCLink href="#sharing">4. Sharing Information</TOCLink>
                <TOCLink href="#security">5. Data Security</TOCLink>
                <TOCLink href="#rights">6. Your Rights</TOCLink>
                <TOCLink href="#contact">7. Contact Us</TOCLink>
              </nav>
            </aside>

            {/* Main Text */}
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
              <section id="introduction" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p>
                  E-Ntemba ("we," "our," or "us") provides a platform for vendors to manage their businesses. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services (the "Service"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
                </p>
              </section>

              <section id="collection" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                <p>We collect information you provide directly to us.</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li><strong>Personal Data:</strong> Name, email address, phone number, and shipping address when you register.</li>
                  <li><strong>Financial Data:</strong> Data related to your payment method (e.g. valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the Site. We store only very limited, if any, financial information that we collect. Otherwise, all financial information is stored by our payment processor.</li>
                  <li><strong>Business Data:</strong> Store details, product listings, sales data, and inventory information.</li>
                </ul>
              </section>

              <section id="usage" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To provide, operate, and maintain our Service.</li>
                  <li>To process your transactions and manage your orders.</li>
                  <li>To improve, personalize, and expand our Service.</li>
                  <li>To communicate with you, including for customer service, updates, and marketing.</li>
                  <li>To find and prevent fraud.</li>
                </ul>
              </section>

              <section id="sharing" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">4. Sharing of Information</h2>
                <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
                  <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
                </ul>
              </section>

              <section id="security" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
                <p>
                  We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                </p>
              </section>

              <section id="rights" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">6. Your Privacy Rights</h2>
                <p>
                  Depending on your location, you may have the right to access, rectify, or delete your personal data. You may also have the right to restrict or object to certain processing of your data. To exercise these rights, please contact us using the information below.
                </p>
              </section>

              <section id="contact" className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
                <div className="bg-muted p-6 rounded-lg">
                  <p className="mb-2">If you have questions or comments about this Privacy Policy, please contact us at:</p>
                  <a href="mailto:privacy@entemba.shop" className="text-primary font-semibold hover:underline">privacy@entemba.shop</a>
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
