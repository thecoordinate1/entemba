
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Mail, MapPin, Phone, Clock, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">

            {/* Navigation */}
            <div className="container mx-auto py-6 px-4 md:px-6">
                <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Link>
            </div>

            {/* Hero Section */}
            <section className="relative py-12 md:py-20 text-center">
                <div className="container px-4 md:px-6">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Get in touch
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        We'd love to hear from you. Please fill out this form or shoot us an email.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="pb-20">
                <div className="container px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">

                        {/* Left Column: Contact Form */}
                        <Card className="shadow-lg border-muted">
                            <CardHeader>
                                <CardTitle>Send us a message</CardTitle>
                                <CardDescription>
                                    We'll get back to you within 24 hours.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="first-name">First name</Label>
                                            <Input id="first-name" placeholder="John" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last-name">Last name</Label>
                                            <Input id="last-name" placeholder="Doe" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" placeholder="john@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input id="subject" placeholder="How can we help?" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea id="message" placeholder="Leave us a message..." className="min-h-[150px]" />
                                    </div>
                                    <Button className="w-full h-12 text-lg" type="submit">
                                        <Send className="mr-2 h-4 w-4" /> Send Message
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Right Column: Info & FAQ */}
                        <div className="space-y-8">

                            {/* Contact Details */}
                            <div className="grid gap-6">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-primary/10 p-3 rounded-lg text-primary">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Email Us</h3>
                                        <p className="text-muted-foreground">Our friendly team is here to help.</p>
                                        <a href="mailto:support@entemba.com" className="text-primary hover:underline font-medium block mt-1">support@entemba.com</a>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="bg-primary/10 p-3 rounded-lg text-primary">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Visit Us</h3>
                                        <p className="text-muted-foreground">Come say hello at our office headquarters.</p>
                                        <p className="font-medium mt-1">101 Independence Avenue,<br />Lusaka, Zambia</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="bg-primary/10 p-3 rounded-lg text-primary">
                                        <Phone className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Call Us</h3>
                                        <p className="text-muted-foreground">Mon-Fri from 8am to 5pm.</p>
                                        <a href="tel:+260970000000" className="text-primary hover:underline font-medium block mt-1">+260 970 000 000</a>
                                    </div>
                                </div>
                            </div>

                            {/* FAQ Snippet */}
                            <div className="pt-8 border-t border-border">
                                <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger>Is there a free trial?</AccordionTrigger>
                                        <AccordionContent>
                                            Yes! We offer a 14-day free trial on all paid plans. No credit card required to start.
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="item-2">
                                        <AccordionTrigger>How do payouts work?</AccordionTrigger>
                                        <AccordionContent>
                                            Payouts are processed automatically every week to your registered bank account or mobile money wallet.
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="item-3">
                                        <AccordionTrigger>Can I change my plan later?</AccordionTrigger>
                                        <AccordionContent>
                                            Absolutely. You can upgrade or downgrade your plan at any time from your account settings.
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
