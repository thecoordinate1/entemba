
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
import { ArrowLeft, Edit, User as UserIcon, Users, ShieldCheck, ShieldX, Phone, MapPin, CalendarDays, ShoppingCart, DollarSign, Tag, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CustomerStatus, Customer as CustomerUIType } from "@/lib/mockData";
import { customerStatusColors } from "@/lib/mockData";
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
import { createClient } from '@/lib/supabase/client';
import type { User as AuthUser } from '@supabase/supabase-js';
import {
  getCustomerById,
  updateCustomer,
  type CustomerFromSupabase,
  type CustomerPayload,
} from "@/services/customerService";


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
  data_ai_hint_avatar?: string;
}

const mapCustomerFromSupabaseToUI = (customer: CustomerFromSupabase): CustomerUIType => {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    avatar: customer.avatar_url || "https://placehold.co/96x96.png",
    dataAiHintAvatar: customer.data_ai_hint_avatar || "person",
    totalSpent: customer.total_spent,
    totalOrders: customer.total_orders,
    joinedDate: new Date(customer.joined_date).toISOString().split("T")[0],
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

  const [customer, setCustomer] = React.useState<CustomerUIType | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = React.useState(true);
  const [errorLoadingCustomer, setErrorLoadingCustomer] = React.useState<string | null>(null);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<CustomerFormData | null>(null);
  
  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [supabase]);

  React.useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (customerId && authUser) {
        setIsLoadingCustomer(true);
        setErrorLoadingCustomer(null);
        try {
          const { data: fetchedCustomerData, error } = await getCustomerById(customerId);
          if (error) throw error;
          if (fetchedCustomerData) {
            const uiCustomer = mapCustomerFromSupabaseToUI(fetchedCustomerData);
            setCustomer(uiCustomer);
            // Pre-fill form data for edit dialog
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
              data_ai_hint_avatar: uiCustomer.dataAiHintAvatar,
            });
          } else {
            setErrorLoadingCustomer("Customer not found or you do not have access.");
            setCustomer(null);
          }
        } catch (err: any) {
          console.error("Error fetching customer details:", err);
          setErrorLoadingCustomer(err.message || "Failed to fetch customer details.");
          toast({ variant: "destructive", title: "Error", description: err.message || "Could not fetch customer details." });
          setCustomer(null);
        } finally {
          setIsLoadingCustomer(false);
        }
      } else if (!authUser) {
        setErrorLoadingCustomer("You must be signed in to view customer details.");
        setIsLoadingCustomer(false);
      }
    };
    fetchCustomerDetails();
  }, [customerId, authUser, toast]);

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
      data_ai_hint_avatar: data.data_ai_hint_avatar,
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
      setCustomer(updatedCustomerUI); // Update the customer state on the detail page
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
          <CardContent className="space-y-4"> <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-2/3" /> <Separator/> <Skeleton className="h-20 w-full" /> </CardContent>
        </Card>
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(`/customers?${searchParamsHook.toString()}`)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Button>
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen && customer) { 
             setFormData({
                name: customer.name, email: customer.email, status: customer.status, phone: customer.phone || "",
                street_address: customer.address?.street || "", city: customer.address?.city || "",
                state_province: customer.address?.state || "", zip_postal_code: customer.address?.zip || "",
                country: customer.address?.country || "", tags: customer.tags || [],
                avatar_url: customer.avatar, data_ai_hint_avatar: customer.dataAiHintAvatar,
            });
        }}}>
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

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={customer.avatar} alt={customer.name} data-ai-hint={customer.dataAiHintAvatar} />
            <AvatarFallback>{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl">{customer.name}</CardTitle>
            <CardDescription className="text-md mt-1">{customer.email}</CardDescription>
            {customer.phone && <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><Phone className="h-4 w-4"/>{customer.phone}</p>}
            <div className="mt-2">
                <Badge variant="outline" className={cn(customerStatusColors[customer.status], "flex items-center gap-1.5 text-sm px-3 py-1 w-fit")}>
                    <StatusIcon className="h-4 w-4" /> {customer.status}
                </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <Separator className="my-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary"/>Address</h4>
              {customer.address && (customer.address.street || customer.address.city) ? (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{customer.address.street}</p>
                  <p>{customer.address.city}{customer.address.state && `, ${customer.address.state}`} {customer.address.zip}</p>
                  <p>{customer.address.country}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No address on file.</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary"/>Activity</h4>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Joined:</dt>
                <dd>{new Date(customer.joinedDate).toLocaleDateString()}</dd>
                <dt className="text-muted-foreground">Last Order:</dt>
                <dd>{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : "N/A"}</dd>
                <dt className="text-muted-foreground flex items-center gap-1"><ShoppingCart className="h-4 w-4"/>Total Orders:</dt>
                <dd>{customer.totalOrders}</dd>
                <dt className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4"/>Total Spent:</dt>
                <dd>${customer.totalSpent.toFixed(2)}</dd>
              </dl>
            </div>
          </div>
          {customer.tags && customer.tags.length > 0 && (
            <>
              <Separator className="my-6" />
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center"><Tag className="mr-2 h-5 w-5 text-primary"/>Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {customer.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground border-t pt-4 mt-6">
          Customer ID: {customer.id}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order History (Placeholder)</CardTitle>
          <CardDescription>Recent orders placed by {customer.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Customer's order history will be displayed here. (Requires further integration)</p>
          {/* Placeholder for an order table or list */}
        </CardContent>
      </Card>
    </div>
  );
}
