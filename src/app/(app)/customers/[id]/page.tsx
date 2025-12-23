"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import NextImage from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, User as UserIcon, Users, ShieldCheck, ShieldX, Phone, MapPin, CalendarDays, ShoppingCart, DollarSign, Tag, AlertCircle, Eye, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CustomerStatus, Customer as CustomerUIType, OrderStatus as OrderStatusUIType, Order as OrderUIType } from "@/lib/types";
import { customerStatusColors, orderStatusColors, orderStatusIcons } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from '@/lib/supabase/client';
import type { User as AuthUser } from '@supabase/supabase-js';
import {
  getCustomerById,
  updateCustomer,
  type CustomerFromSupabase,
  type CustomerPayload,
} from "@/services/customerService";
import { getOrdersByCustomerAndStore, type OrderFromSupabase } from "@/services/orderService";
import { mapOrderFromSupabaseToUI } from "@/lib/order-mapper";
import { MetricCard } from "@/components/MetricCard";


// Form data type for Edit dialog
interface CustomerFormData {
  name: string;
  email: string;
  status: CustomerStatus;
  phone?: string;
  street_address?: string;
  city?: string;
  state_province?: string;
  zip_postal_code?: string;
  country?: string;
  tags?: string[];
  avatar_url?: string;
}

const mapCustomerFromSupabaseToUI = (customer: CustomerFromSupabase): CustomerUIType => {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    avatar: customer.avatar_url || "https://placehold.co/96x96.png",
    totalSpent: customer.total_spent ?? 0, // Ensure default value
    totalOrders: customer.total_orders ?? 0, // Ensure default value
    joinedDate: customer.joined_date ? new Date(customer.joined_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0], // Ensure default
    lastOrderDate: customer.last_order_date ? new Date(customer.last_order_date).toISOString().split("T")[0] : undefined,
    status: customer.status as CustomerStatus,
    tags: customer.tags || [],
    phone: customer.phone || undefined,
    address: {
      street: customer.street_address || "",
      city: customer.city || "",
      state: customer.state_province || "",
      zip: customer.zip_postal_code || "",
      country: customer.country || "",
    },
  };
};


export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const { toast } = useToast();

  const customerId = params.id as string;
  const storeId = searchParamsHook.get("storeId");

  const [customer, setCustomer] = React.useState<CustomerUIType | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = React.useState(true);
  const [errorLoadingCustomer, setErrorLoadingCustomer] = React.useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<CustomerFormData | null>(null);

  const [customerOrders, setCustomerOrders] = React.useState<OrderUIType[]>([]);
  const [isLoadingCustomerOrders, setIsLoadingCustomerOrders] = React.useState(false);

  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [supabase]);

  React.useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!customerId) {
        setErrorLoadingCustomer("Customer ID is missing.");
        setIsLoadingCustomer(false);
        return;
      }
      if (!authUser) {
        setErrorLoadingCustomer("You must be signed in to view customer details.");
        setIsLoadingCustomer(false);
        return;
      }

      setIsLoadingCustomer(true);
      setErrorLoadingCustomer(null);
      setCustomer(null); // Reset customer state on new fetch
      setCustomerOrders([]); // Reset orders state

      try {
        const { data: fetchedCustomerData, error } = await getCustomerById(customerId);
        if (error) throw error;

        if (fetchedCustomerData) {
          const uiCustomer = mapCustomerFromSupabaseToUI(fetchedCustomerData);
          setCustomer(uiCustomer);
          setFormData({
            name: uiCustomer.name,
            email: uiCustomer.email,
            status: uiCustomer.status,
            phone: uiCustomer.phone || "",
            street_address: uiCustomer.address?.street || "",
            city: uiCustomer.address?.city || "",
            state_province: uiCustomer.address?.state || "",
            zip_postal_code: uiCustomer.address?.zip || "",
            country: uiCustomer.address?.country || "",
            tags: uiCustomer.tags || [],
            avatar_url: uiCustomer.avatar,
          });

          if (storeId) {
            setIsLoadingCustomerOrders(true);
            try {
              const { data: ordersData, error: ordersError } = await getOrdersByCustomerAndStore(fetchedCustomerData.id, storeId);
              if (ordersError) throw ordersError;
              setCustomerOrders(ordersData?.map(mapOrderFromSupabaseToUI) || []);
            } catch (ordersErr: any) {
              toast({ variant: "destructive", title: "Error Fetching Orders", description: ordersErr.message });
              setCustomerOrders([]);
            } finally {
              setIsLoadingCustomerOrders(false);
            }
          } else {
            // If no storeId, maybe show all orders globally or a message
            // For now, we assume storeId context is important for orders display here
            setCustomerOrders([]);
            console.warn("No storeId provided, not fetching customer orders for a specific store.");
          }
        } else {
          setErrorLoadingCustomer("Customer not found or you do not have access.");
        }
      } catch (err: any) {
        console.error("Error fetching customer details:", err);
        setErrorLoadingCustomer(err.message || "Failed to fetch customer details.");
        toast({ variant: "destructive", title: "Error", description: err.message || "Could not fetch customer details." });
      } finally {
        setIsLoadingCustomer(false);
      }
    };
    fetchCustomerDetails();
  }, [customerId, authUser, storeId, toast]); // Added storeId to dependency array

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleStatusChange = (value: CustomerStatus) => {
    setFormData(prev => prev ? { ...prev, status: value } : null);
  };

  const preparePayload = (data: CustomerFormData): CustomerPayload => {
    return {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      avatar_url: data.avatar_url,
      status: data.status,
      tags: data.tags && data.tags.length > 0 ? data.tags : null,
      street_address: data.street_address || null,
      city: data.city || null,
      state_province: data.state_province || null,
      zip_postal_code: data.zip_postal_code || null,
      country: data.country || null,
    };
  };

  const handleEditCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customer || !formData || !authUser) return;
    setIsSubmitting(true);
    const payload = preparePayload(formData);
    const { data: updatedCustomerData, error } = await updateCustomer(customer.id, payload);
    setIsSubmitting(false);

    if (error || !updatedCustomerData) {
      toast({ variant: "destructive", title: "Error Updating Customer", description: error?.message || "Could not update customer." });
    } else {
      const updatedCustomerUI = mapCustomerFromSupabaseToUI(updatedCustomerData);
      setCustomer(updatedCustomerUI);
      setIsEditDialogOpen(false);
      toast({ title: "Customer Updated", description: `${updatedCustomerUI.name} has been successfully updated.` });
    }
  };

  const renderCustomerFormFields = () => {
    if (!formData) return null;
    return (
      <>
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input id="phone" name="phone" type="tel" value={formData.phone || ""} onChange={handleInputChange} />
        </div>

        <Separator className="my-4" />
        <h4 className="font-medium text-md col-span-full">Address Details (Optional)</h4>
        <div className="grid gap-2">
          <Label htmlFor="street_address">Street Address</Label>
          <Input id="street_address" name="street_address" value={formData.street_address || ""} onChange={handleInputChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" value={formData.city || ""} onChange={handleInputChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="state_province">State/Province</Label>
            <Input id="state_province" name="state_province" value={formData.state_province || ""} onChange={handleInputChange} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="zip_postal_code">ZIP/Postal Code</Label>
            <Input id="zip_postal_code" name="zip_postal_code" value={formData.zip_postal_code || ""} onChange={handleInputChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" value={formData.country || ""} onChange={handleInputChange} />
          </div>
        </div>

        <Separator className="my-4" />
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" value={formData.status} onValueChange={handleStatusChange}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
          <Input
            id="tags"
            name="tags"
            value={formData.tags?.join(", ") || ""}
            onChange={(e) => setFormData(prev => prev ? { ...prev, tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag) } : null)}
            placeholder="e.g., VIP, Local, Wholesale"
          />
        </div>
      </>
    );
  }


  if (isLoadingCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"> <Skeleton className="h-10 w-40" /> <Skeleton className="h-10 w-24" /> </div>
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 flex-1"> <Skeleton className="h-8 w-3/4" /> <Skeleton className="h-4 w-1/2" /> </div>
          </CardHeader>
          <CardContent className="space-y-4"> <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-2/3" /> <Separator /> <Skeleton className="h-20 w-full" /> </CardContent>
        </Card>
        <Card><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (errorLoadingCustomer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Customer</h2>
        <p className="text-muted-foreground mb-6">{errorLoadingCustomer}</p>
        <Button variant="outline" onClick={() => router.push(`/customers?${searchParamsHook.toString()}`)}> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers List </Button>
      </div>
    );
  }

  if (!customer) {
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Customer not found.</p></div>;
  }

  const StatusIcon = customer.status === 'Active' ? ShieldCheck : customer.status === 'Blocked' ? ShieldX : UserIcon;


  /* 
    Calculate Metrics based on Store Context 
    If storeId is present, we calculate totals from the fetched orders for this store.
    Otherwise, we use the global totals from the customer profile.
  */
  const calculatedTotalSpent = storeId
    ? customerOrders.reduce((sum, order) => {
      // Exclude cancelled/refunded if necessary, but typically Total Spent includes valid orders
      // Here we assume 'Cancelled' orders don't count towards spend
      return (order.status !== 'Cancelled') ? sum + order.total : sum;
    }, 0)
    : (customer?.totalSpent ?? 0);

  const calculatedTotalOrders = storeId
    ? customerOrders.filter(o => o.status !== 'Cancelled').length
    : (customer?.totalOrders ?? 0);

  const calculatedAvgOrderValue = calculatedTotalOrders > 0
    ? calculatedTotalSpent / calculatedTotalOrders
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(`/customers?${searchParamsHook.toString()}`)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Button>
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen); if (!isOpen && customer) {
            setFormData({
              name: customer.name, email: customer.email, status: customer.status, phone: customer.phone || "",
              street_address: customer.address?.street || "", city: customer.address?.city || "",
              state_province: customer.address?.state || "", zip_postal_code: customer.address?.zip || "",
              country: customer.address?.country || "", tags: customer.tags || [],
              avatar_url: customer.avatar,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} disabled={!authUser}>
              <Edit className="mr-2 h-4 w-4" /> Edit Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit {customer.name}</DialogTitle>
              <DialogDescription>Update the customer's details.</DialogDescription>
            </DialogHeader>
            {formData && (
              <form onSubmit={handleEditCustomer}>
                <ScrollArea className="h-[70vh] pr-6">
                  <div className="grid gap-4 py-4">{renderCustomerFormFields()}</div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || !authUser}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Spent"
          value={`ZMW ${calculatedTotalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description={storeId ? "Value in this store" : "Lifetime value"}
        />
        <MetricCard
          title="Total Orders"
          value={calculatedTotalOrders.toString()}
          icon={ShoppingCart}
          description="Confirmed orders count"
        />
        <MetricCard
          title="Avg. Order Value"
          value={`ZMW ${calculatedAvgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="Average spend per order"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={customer.avatar} alt={customer.name} />
                  <AvatarFallback>{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg md:text-xl">{customer.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">{customer.email}</CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline" className={cn(customerStatusColors[customer.status], "flex items-center gap-1.5 text-xs px-2 py-0.5 w-fit")}>
                  <StatusIcon className="h-3 w-3" /> {customer.status}
                </Badge>
                {customer.phone && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full border border-border">
                    <Phone className="h-3 w-3" />{customer.phone}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              <div>
                <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Address
                </h4>
                {(customer.address?.street || customer.address?.city || customer.address?.country) ? (
                  <div className="text-sm space-y-1 bg-muted/30 p-3 rounded-md border border-border/50">
                    <p>{customer.address.street}</p>
                    <p>{customer.address.city}{customer.address.state && `, ${customer.address.state}`} {customer.address.zip}</p>
                    <p>{customer.address.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic pl-1">No address provided.</p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" /> Activity
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Joined</div>
                  <div className="text-right font-medium">{new Date(customer.joinedDate).toLocaleDateString()}</div>
                  <div className="text-muted-foreground">Last Order</div>
                  <div className="text-right font-medium">{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : "Never"}</div>
                </div>
              </div>

              {customer.tags && customer.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5" /> Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {customer.tags.map(tag => <Badge key={tag} variant="secondary" className="text-[10px] px-2">{tag}</Badge>)}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="text-[10px] text-muted-foreground border-t pt-3">
              ID: <span className="font-mono ml-1">{customer.id}</span>
            </CardFooter>
          </Card>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order History</CardTitle>
              <CardDescription>
                {storeId ? "Recent orders from this store." : "Recent orders from all stores (select a store to filter)."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {isLoadingCustomerOrders && (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              )}

              {!isLoadingCustomerOrders && customerOrders.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-muted/10">
                  <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                  <p>{storeId ? "No orders found in this store." : "Select a store to view orders."}</p>
                </div>
              )}

              {!isLoadingCustomerOrders && customerOrders.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerOrders.map((order) => {
                      const OrderStatusIcon = orderStatusIcons[order.status];
                      return (
                        <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/orders/${order.id}?${searchParamsHook.toString()}`)}>
                          <TableCell className="font-medium font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-xs">{new Date(order.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right font-medium">ZMW {order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn(orderStatusColors[order.status], "inline-flex items-center gap-1 whitespace-nowrap text-[10px] px-2 py-0.5")}>
                              <OrderStatusIcon className="h-3 w-3" />
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full" onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.id}?${searchParamsHook.toString()}`); }}>
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
