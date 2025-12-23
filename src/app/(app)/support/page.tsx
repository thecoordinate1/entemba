"use client";

import * as React from "react";
import { MessageCircle, Phone, Mail, FileQuestion, Send, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { createTicket, getUserTickets, type SupportTicket } from "@/services/supportService";
import { format } from "date-fns";

const FAQS = [
    {
        question: "How do I add a new product?",
        answer: "Go to the Products page and click on the 'Add Product' button in the top right corner. Fill in the details including name, price, and images, then click 'Create Product'."
    },
    {
        question: "When are payouts processed?",
        answer: "Payouts are processed every Monday for the previous week's sales. Ensure your banking or mobile money details are up to date in Settings > Payouts."
    },
    {
        question: "How do I change my store logo?",
        answer: "Navigate to Settings > Store. Click on the store logo placeholder or 'Change Logo' button to upload a new image."
    },
    {
        question: "What happens if a customer cancels an order?",
        answer: "If an order is cancelled before you confirm it, no action is needed. If you've already shipped it, please contact support immediately to halt the process if possible."
    },
];

export default function SupportPage() {
    const { toast } = useToast();
    const supabase = createClient();
    const [tickets, setTickets] = React.useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Form State
    const [subject, setSubject] = React.useState("");
    const [category, setCategory] = React.useState<"technical" | "billing" | "feature_request" | "other">("technical");
    const [message, setMessage] = React.useState("");

    React.useEffect(() => {
        async function loadTickets() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await getUserTickets(user.id);
            if (data) setTickets(data);
            setIsLoading(false);
        }
        loadTickets();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsSubmitting(false);
            return;
        }

        const { data, error } = await createTicket(user.id, {
            user_id: user.id,
            subject,
            message,
            category
        });

        setIsSubmitting(false);

        if (error) {
            toast({ variant: "destructive", title: "Submission Failed", description: error.message });
        } else if (data) {
            setTickets([data, ...tickets]);
            setSubject("");
            setMessage("");
            toast({ title: "Ticket Submitted", description: "Our team will review your request shortly." });
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'open': return "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20";
            case 'in_progress': return "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20";
            case 'resolved': return "bg-green-500/10 text-green-600 hover:bg-green-500/20";
            case 'closed': return "bg-slate-500/10 text-slate-600 hover:bg-slate-500/20";
            default: return "";
        }
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
                <p className="text-muted-foreground mt-1">Get answers to your questions or get in touch with our team.</p>
            </div>

            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="flex flex-col items-center text-center p-6 gap-3">
                        <div className="p-3 rounded-full bg-primary/10 text-primary"><MessageCircle className="h-6 w-6" /></div>
                        <div className="space-y-1">
                            <h3 className="font-semibold">WhatsApp Support</h3>
                            <p className="text-xs text-muted-foreground">Quick chat for urgent issues</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-2">Chat Now</Button>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="flex flex-col items-center text-center p-6 gap-3">
                        <div className="p-3 rounded-full bg-primary/10 text-primary"><Mail className="h-6 w-6" /></div>
                        <div className="space-y-1">
                            <h3 className="font-semibold">Email Us</h3>
                            <p className="text-xs text-muted-foreground">For detailed inquiries</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-2">support@entemba.com</Button>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="flex flex-col items-center text-center p-6 gap-3">
                        <div className="p-3 rounded-full bg-primary/10 text-primary"><Phone className="h-6 w-6" /></div>
                        <div className="space-y-1">
                            <h3 className="font-semibold">Call Center</h3>
                            <p className="text-xs text-muted-foreground">Mon-Fri, 9am - 5pm</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-2">+260 97 000 0000</Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: FAQ & History */}
                <div className="lg:col-span-2 space-y-8">

                    <Tabs defaultValue="faq" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="faq">Frequently Asked Questions</TabsTrigger>
                            <TabsTrigger value="history">My Tickets</TabsTrigger>
                        </TabsList>

                        <TabsContent value="faq" className="mt-4 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Common Questions</CardTitle>
                                    <CardDescription>Find quick answers to common platform questions.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {FAQS.map((faq, i) => (
                                            <AccordionItem key={i} value={`item-${i}`}>
                                                <AccordionTrigger>{faq.question}</AccordionTrigger>
                                                <AccordionContent className="text-muted-foreground">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ticket History</CardTitle>
                                    <CardDescription>Track the status of your reported issues.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="text-center py-8 text-muted-foreground">Loading tickets...</div>
                                    ) : tickets.length === 0 ? (
                                        <div className="text-center py-12 flex flex-col items-center gap-2 text-muted-foreground">
                                            <FileQuestion className="h-10 w-10 opacity-20" />
                                            <p>You haven't submitted any tickets yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {tickets.map(ticket => (
                                                <div key={ticket.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold">{ticket.subject}</span>
                                                            <Badge variant="outline" className={statusColor(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-1">{ticket.message}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                            <Clock className="h-3 w-3" /> {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Col: Contact Form */}
                <div>
                    <Card className="sticky top-6 border-primary/20 shadow-lg">
                        <CardHeader className="bg-primary/5 pb-4">
                            <CardTitle className="text-primary flex items-center gap-2"><Send className="h-5 w-5" /> Send a Request</CardTitle>
                            <CardDescription>Can't find what you need? Open a ticket.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Payment Issue" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="technical">Technical Issue</SelectItem>
                                            <SelectItem value="billing">Billing & Payouts</SelectItem>
                                            <SelectItem value="feature_request">Feature Request</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Message</Label>
                                    <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Describe your issue in detail..." required />
                                </div>
                                <Button type="submit" className="w-full shadow-md" disabled={isSubmitting}>
                                    {isSubmitting ? "Submitting..." : "Submit Ticket"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
