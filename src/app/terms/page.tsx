
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
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

      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-bold">Terms of Service</CardTitle>
          <CardDescription>Last Updated: October 29, 2025</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p>
              Welcome to E-Ntemba ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our vendor dashboard, services, and website (collectively, the "Service"). By creating an account or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">2. User Accounts</h2>
            <p>
              To use our Service, you must register for an account. You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. You must provide accurate and complete information during registration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">3. Vendor Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You are solely responsible for the products you sell, including their quality, safety, and legality.</li>
              <li>You are responsible for all content you upload to the Service, including product descriptions, images, and pricing. You represent that you have all necessary rights to such content.</li>
              <li>You agree to accurately manage your inventory and fulfill all orders placed through the platform in a timely manner.</li>
              <li>You must handle customer service, returns, and refunds in accordance with applicable law and your own store policies.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">4. Prohibited Conduct</h2>
            <p>
              You agree not to use the Service to:
            </p>
             <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Sell illegal, counterfeit, or hazardous items.</li>
              <li>Violate any applicable laws, regulations, or third-party rights.</li>
              <li>Upload malicious software or engage in any activity that could harm the Service or its users.</li>
              <li>Misrepresent your identity or the products you sell.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">5. Fees and Payments</h2>
            <p>
              Use of our Service may be subject to transaction fees, subscription fees, or other charges, which will be disclosed to you. You are responsible for paying all applicable fees and taxes associated with your use of the Service and sales. Payouts to you will be made according to the payment schedule and method specified in your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">6. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at our discretion, without notice, for any conduct that we believe violates these Terms or is otherwise harmful to our community or Service. You may terminate your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">7. Disclaimer of Warranties and Limitation of Liability</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE. IN NO EVENT SHALL E-NTEMBA BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">8. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will provide notice of any significant changes. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

           <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:support@entemba.shop" className="text-primary hover:underline">support@entemba.shop</a>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
