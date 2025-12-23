"use client";

import * as React from "react";
import { Plus, Tag, Percent, DollarSign, Calendar, MoreHorizontal, Trash2, Ban, CheckCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/MetricCard";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCouponsByStoreId, createCoupon, toggleCouponStatus, deleteCoupon, type Coupon, type CouponPayload } from "@/services/marketingService";
import { format } from "date-fns";
import { getCurrentVendorProfile } from "@/services/userService";
import { getStoresByUserId } from "@/services/storeService";

export default function MarketingPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const storeIdFromUrl = searchParams.get('storeId');
    const supabase = createClient();

    const [isLoading, setIsLoading] = React.useState(true);
    const [coupons, setCoupons] = React.useState<Coupon[]>([]);
    const [storeId, setStoreId] = React.useState<string | null>(null);

    // Create Form State
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [newCode, setNewCode] = React.useState("");
    const [newDesc, setNewDesc] = React.useState("");
    const [newType, setNewType] = React.useState<'percentage' | 'fixed_amount'>("percentage");
    const [newValue, setNewValue] = React.useState("");
    const [newMinSpend, setNewMinSpend] = React.useState("0");
    const [newLimit, setNewLimit] = React.useState("");
    const [newEndDate, setNewEndDate] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Init
    React.useEffect(() => {
        async function init() {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let targetStoreId = storeIdFromUrl;

            if (!targetStoreId) {
                // Fallback to first store
                const { data: stores } = await getStoresByUserId(user.id);
                if (stores && stores.length > 0) targetStoreId = stores[0].id;
            }

            setStoreId(targetStoreId);

            if (targetStoreId) {
                const { data, error } = await getCouponsByStoreId(targetStoreId);
                if (data) setCoupons(data);
                else console.error(error);
            }
            setIsLoading(false);
        }
        init();
    }, [storeIdFromUrl, supabase]);

    const handleCreate = async () => {
        if (!storeId || !newCode || !newValue) return;
        setIsSubmitting(true);

        const payload: CouponPayload = {
            code: newCode.toUpperCase(),
            description: newDesc || null,
            discount_type: newType,
            discount_value: parseFloat(newValue),
            min_spend: parseFloat(newMinSpend) || 0,
            usage_limit: newLimit ? parseInt(newLimit) : null,
            start_date: new Date().toISOString(),
            end_date: newEndDate ? new Date(newEndDate).toISOString() : null,
            is_active: true
        };

        const { data, error } = await createCoupon(storeId, payload);
        setIsSubmitting(false);

        if (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } else if (data) {
            setCoupons([data, ...coupons]);
            setIsCreateOpen(false);
            resetForm();
            toast({ title: "Coupon Created", description: `${data.code} is now active.` });
        }
    };

    const resetForm = () => {
        setNewCode(""); setNewDesc(""); setNewValue(""); setNewMinSpend("0"); setNewLimit(""); setNewEndDate("");
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const { error } = await toggleCouponStatus(id, !currentStatus);
        if (!error) {
            setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
            toast({ title: currentStatus ? "Coupon Deactivated" : "Coupon Activated" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;
        const { error } = await deleteCoupon(id);
        if (!error) {
            setCoupons(coupons.filter(c => c.id !== id));
            toast({ title: "Coupon Deleted" });
        }
    };

    // Metrics
    const activeCount = coupons.filter(c => c.is_active).length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + c.used_count, 0);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
                    <p className="text-muted-foreground mt-1">Create campaigns and coupons to boost sales.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> Create Coupon
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>New Coupon</DialogTitle>
                            <DialogDescription>Create a discount code for your customers.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="code" className="text-right">Code</Label>
                                <Input id="code" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="SUMMER10" className="col-span-3 uppercase" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">Type</Label>
                                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed_amount">Fixed Amount (ZMW)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="value" className="text-right">Value</Label>
                                <Input id="value" type="number" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder={newType === 'percentage' ? "10" : "50"} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="min_spend" className="text-right">Min Spend</Label>
                                <Input id="min_spend" type="number" value={newMinSpend} onChange={e => setNewMinSpend(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="limit" className="text-right">Total Limit</Label>
                                <Input id="limit" type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)} placeholder="Unlimited" className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleCreate} disabled={!newCode || !newValue || isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Coupon"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Metrics */}
            <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Active Coupons"
                    value={activeCount.toString()}
                    icon={Tag}
                    description="Live promotions"
                />
                <MetricCard
                    title="Total Redemptions"
                    value={totalRedemptions.toString()}
                    icon={Ticket}
                    description="All time usage"
                />
                {/* Placeholder Metrics for future */}
                <MetricCard
                    title="Conversion Rate"
                    value="-"
                    icon={Percent}
                    description="Coupon usage rate"
                />
                <MetricCard
                    title="Discount Value"
                    value="-"
                    icon={DollarSign}
                    description="Total discounts given"
                />
            </div>

            {/* Coupon List */}
            <Card className="border-border/60 shadow-sm">
                <CardHeader>
                    <CardTitle>Coupons</CardTitle>
                    <CardDescription>Manage your active and expired discount codes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No coupons found. Create one to get started!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                coupons.map((coupon) => (
                                    <TableRow key={coupon.id} className="group">
                                        <TableCell className="font-mono font-medium text-primary">
                                            {coupon.code}
                                            {coupon.min_spend > 0 && <span className="block text-xs text-muted-foreground font-sans">Min: {coupon.min_spend}</span>}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `ZMW ${coupon.discount_value}`}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.used_count} / {coupon.usage_limit || "∞"}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.is_active ? (
                                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Active</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-200">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(coupon.created_at), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(coupon.id, coupon.is_active)}>
                                                        {coupon.is_active ? <><Ban className="mr-2 h-4 w-4" /> Deactivate</> : <><CheckCircle className="mr-2 h-4 w-4" /> Activate</>}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(coupon.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
