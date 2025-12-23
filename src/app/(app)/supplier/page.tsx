"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type User as AuthUser } from "@supabase/supabase-js";
import { getCurrentVendorProfile, updateVendorStatus, type VendorProfile } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Truck, Package, DollarSign, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function SupplierPage() {
    const [loading, setLoading] = React.useState(true);
    const [profile, setProfile] = React.useState<VendorProfile | null>(null);
    const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    React.useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setAuthUser(user as AuthUser);
            const { profile: vendorProfile } = await getCurrentVendorProfile(user.id);
            setProfile(vendorProfile);
            setLoading(false);
        };
        init();
    }, [supabase, router]);

    const handleBecomeSupplier = async () => {
        if (!authUser) return;
        setIsUpdating(true);
        const { error } = await updateVendorStatus(authUser.id, true);
        setIsUpdating(false);

        if (error) {
            toast({
                title: "Error",
                description: "Failed to update supplier status. Please try again.",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Success",
            description: "You are now a registered supplier!",
        });

        // Refresh profile locally
        if (profile) {
            setProfile({ ...profile, is_supplier: true });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (profile?.is_supplier) {
        return (
            <div className="container py-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Supplier Dashboard</h1>
                        <p className="text-muted-foreground mt-2">Manage your wholesale products and orders.</p>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 px-3 py-1 flex gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Active Supplier
                    </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Inventory</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold">12</span>
                                <Package className="w-5 h-5 text-primary" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Products available for dropshipping</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full text-xs" asChild>
                                <Link href="/products?filter=dropship">Manage Inventory</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold">ZMW 0.00</span>
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">From dropshipping orders</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-muted/30 border rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <Truck className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Ready to scale?</h3>
                    <p className="max-w-md text-muted-foreground text-sm">
                        Add more products to your dropshipping catalog to reach more vendors and increase your sales volume without extra marketing.
                    </p>
                    <Button asChild>
                        <Link href="/products/new">Add New Product</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-12 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Expand Your Business</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Become a supplier on Entemba and let other vendors sell your products for you.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Wholesale Distribution</h3>
                            <p className="text-muted-foreground leading-relaxed">List your products at wholesale prices. Vendors import them and handle the marketing.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Seamless Fulfillment</h3>
                            <p className="text-muted-foreground leading-relaxed">When a vendor makes a sale, you get notified to ship the product directly to the customer.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Guaranteed Payment</h3>
                            <p className="text-muted-foreground leading-relaxed">Funds are held in escrow and released to you upon successful delivery.</p>
                        </div>
                    </div>
                </div>

                <Card className="border-2 shadow-xl border-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 bg-primary text-primary-foreground text-xs font-bold rounded-bl-xl">
                        BETA ACCESS
                    </div>
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl">Supplier Account</CardTitle>
                        <CardDescription>Activate your supplier features today</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium">Zero monthly fees for early adopters</p>
                        </div>
                        <Button
                            size="lg"
                            className="w-full text-lg h-14"
                            onClick={handleBecomeSupplier}
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            Activate Supplier Mode
                        </Button>
                    </CardContent>
                    <CardFooter className="justify-center pb-6">
                        <p className="text-xs text-muted-foreground text-center">
                            By activating, you agree to our Supplier Terms of Service and Fulfillment Policy.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
