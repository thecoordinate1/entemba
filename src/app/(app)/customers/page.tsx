"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Edit, Trash2, Search, Eye, User, Users, ShieldCheck, ShieldX, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Customer as CustomerUIType, CustomerStatus } from "@/lib/types";
import { customerStatusColors } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, downloadCSV } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import type { User as AuthUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  getCustomers,
  updateCustomer,
  deleteCustomer,
  getNewCustomersForStoreCount,
  type CustomerFromSupabase,
  type CustomerPayload,
} from "@/services/customerService";
import { MetricCard } from "@/components/MetricCard";
import { MobileCustomerCard } from "@/components/MobileCustomerCard";

const ITEMS_PER_PAGE = 10;

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

const defaultEditCustomerFormData: CustomerFormData = {
  name: "",
  email: "",
  status: "Active",
  phone: "",
  street_address: "",
  city: "",
  state_province: "",
  zip_postal_code: "",
  country: "",
  tags: [],
  avatar_url: "https://placehold.co/40x40.png",
};


const mapCustomerFromSupabaseToUI = (customer: CustomerFromSupabase): CustomerUIType => {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    avatar: customer.avatar_url || "https://placehold.co/40x40.png",
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


export default function CustomersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeId = searchParams.get("storeId");

  const [customers, setCustomers] = React.useState<CustomerUIType[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = React.useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerUIType | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState<CustomerFormData>(defaultEditCustomerFormData);

  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCustomers, setTotalCustomers] = React.useState(0);
  const [newCustomersCount, setNewCustomersCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [supabase]);

  React.useEffect(() => {
    const fetchCustomersData = async () => {
      if (!authUser || !storeId) {
        setIsLoadingCustomers(false);
        setCustomers([]);
        setTotalCustomers(0);
        return;
      }
      setIsLoadingCustomers(true);
      const { data, count, error } = await getCustomers(storeId, currentPage, ITEMS_PER_PAGE);

      const { data: newCustData } = await getNewCustomersForStoreCount(storeId, 30);
      if (newCustData) setNewCustomersCount(newCustData.count);

      if (error) {
        toast({ variant: "destructive", title: "Error Fetching Customers", description: error.message });
        setCustomers([]);
        setTotalCustomers(0);
      } else if (data) {
        setCustomers(data.map(mapCustomerFromSupabaseToUI));
        setTotalCustomers(count || 0);
      }
      setIsLoadingCustomers(false);
    };

    fetchCustomersData();
  }, [authUser, storeId, currentPage, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: CustomerStatus) => {
    setFormData(prev => ({ ...prev, status: value }));
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
    if (!selectedCustomer || !authUser) return;
    setIsSubmitting(true);
    const payload = preparePayload(formData);
    const { data: updatedCustomerData, error } = await updateCustomer(selectedCustomer.id, payload);
    setIsSubmitting(false);

    if (error || !updatedCustomerData) {
      toast({ variant: "destructive", title: "Error Updating Customer", description: error?.message || "Could not update customer." });
    } else {
      const updatedCustomerUI = mapCustomerFromSupabaseToUI(updatedCustomerData);
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? updatedCustomerUI : c));
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      setFormData(defaultEditCustomerFormData);
      toast({ title: "Customer Updated", description: `${updatedCustomerUI.name} has been successfully updated.` });
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer || !authUser) return;
    setIsSubmitting(true);
    const { error } = await deleteCustomer(selectedCustomer.id);
    setIsSubmitting(false);

    if (error) {
      toast({ variant: "destructive", title: "Error Deleting Customer", description: error.message });
    } else {
      toast({ title: "Customer Deleted", description: `${selectedCustomer.name} has been successfully deleted.`, variant: "destructive" });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      // Refetch customers for the current page or adjust pagination
      setTotalCustomers(prev => prev - 1);
      const newTotalPages = Math.ceil((totalCustomers - 1) / ITEMS_PER_PAGE);
      const newCurrentPage = Math.min(currentPage, newTotalPages > 0 ? newTotalPages : 1);
      if (currentPage !== newCurrentPage) {
        setCurrentPage(newCurrentPage);
      } else if (storeId) {
        // If still on the same page, refetch to update list
        const { data, count } = await getCustomers(storeId, newCurrentPage, ITEMS_PER_PAGE);
        if (data) setCustomers(data.map(mapCustomerFromSupabaseToUI));
        if (count !== null) setTotalCustomers(count);
      }
    }
  };

  const openEditDialog = (customer: CustomerUIType) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      status: customer.status,
      phone: customer.phone || "",
      street_address: customer.address?.street || "",
      city: customer.address?.city || "",
      state_province: customer.address?.state || "",
      zip_postal_code: customer.address?.zip || "",
      country: customer.address?.country || "",
      tags: customer.tags || [],
      avatar_url: customer.avatar,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (customer: CustomerUIType) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  // Export Handler
  const handleExport = () => {
    if (!customers.length) {
      toast({ title: "No customers to export", variant: "destructive" });
      return;
    }
    const data = customers.map(c => ({
      "Name": c.name,
      "Email": c.email,
      "Status": c.status,
      "Total Orders": c.totalOrders, // Changed from c.total_orders to c.totalOrders
      "Total Spent (ZMW)": c.totalSpent, // Changed from c.total_spent to c.totalSpent
      "Last Order": c.lastOrderDate ? format(new Date(c.lastOrderDate), 'yyyy-MM-dd') : 'Never' // Changed from c.last_order_date to c.lastOrderDate
    }));
    downloadCSV(data, `customers-export-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`);
    toast({ title: "Export Started", description: "Customer list is downloading." });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.tags && customer.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const renderCustomerFormFields = () => (
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
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag) }))}
          placeholder="e.g., VIP, Local, Wholesale"
        />
      </div>
    </>
  );

  const totalPages = Math.ceil(totalCustomers / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Users className="h-7 w-7" />Customers</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8 sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!authUser}
            />
          </div>
        </div>
      </div>
      {storeId && <p className="text-sm text-muted-foreground">Showing customers who have ordered from this store.</p>}
      {!storeId && <p className="text-sm text-muted-foreground">Please select a store to view its customers.</p>}

      {storeId && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Customers"
            value={totalCustomers.toLocaleString()}
            icon={Users}
            description="All time unique customers"
          />
          <MetricCard
            title="New This Month"
            value={newCustomersCount !== null ? newCustomersCount.toLocaleString() : "-"}
            icon={UserPlus}
            description="First order in last 30 days"
            trend={newCustomersCount && newCustomersCount > 0 ? `+${newCustomersCount}` : undefined}
            trendType="positive"
            className="md:col-span-1"
          />
        </div>
      )}


      {isLoadingCustomers && authUser && storeId && (
        <div className="space-y-2">
          {[...Array(ITEMS_PER_PAGE / 2)].map((_, i) => (
            <Skeleton key={`skel-cust-row-${i}`} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!isLoadingCustomers && authUser && storeId && (
        <>
          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4 mb-4">
            {filteredCustomers.map(customer => (
              <MobileCustomerCard
                key={customer.id}
                customer={customer}
                onView={() => router.push(`/customers/${customer.id}?storeId=${storeId}`)}
                onEdit={openEditDialog}
                onDelete={(id) => {
                  const c = customers.find(cust => cust.id === id);
                  if (c) openDeleteDialog(c);
                }}
              />
            ))}
          </div>

          <Card className="hidden md:block">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[80px] sm:table-cell">Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Total Spent</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Orders</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const StatusIcon = customer.status === 'Active' ? ShieldCheck : customer.status === 'Blocked' ? ShieldX : User;
                    return (
                      <TableRow key={customer.id} className="cursor-pointer" onClick={() => router.push(`/customers/${customer.id}?${searchParams.toString()}`)}>
                        <TableCell className="hidden sm:table-cell">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={customer.avatar} alt={customer.name} />
                            <AvatarFallback>{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{customer.email}</TableCell>
                        <TableCell className="text-right hidden lg:table-cell">ZMW {customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-center hidden lg:table-cell">{customer.totalOrders}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(customer.joinedDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(customerStatusColors[customer.status], "flex items-center gap-1.5 whitespace-nowrap text-xs")}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/customers/${customer.id}?${searchParams.toString()}`}>
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteDialog(customer)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
            {totalPages > 1 && (
              <CardFooter className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({totalCustomers} customers)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isLoadingCustomers}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || isLoadingCustomers}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
            {totalCustomers === 0 && !isLoadingCustomers && (
              <CardFooter className="flex items-center justify-center border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? `No customers found matching "${searchTerm}".` : "No customers have placed orders in this store yet."}
                </p>
              </CardFooter>
            )}
          </Card>
        </>
      )}

      {!authUser && !isLoadingCustomers && (
        <div className="text-center text-muted-foreground py-10">Please sign in to manage customers.</div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) { setFormData(defaultEditCustomerFormData); setSelectedCustomer(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>
              Update the customer's details.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <form onSubmit={handleEditCustomer}>
              <ScrollArea className="h-[70vh] pr-6">
                <div className="grid gap-4 py-4">
                  {renderCustomerFormFields()}
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setFormData(defaultEditCustomerFormData); setSelectedCustomer(null); }} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !authUser}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer "{selectedCustomer?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCustomer(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!isLoadingCustomers && authUser && filteredCustomers.length === 0 && customers.length > 0 && searchTerm && (
        <div className="text-center text-muted-foreground py-10">
          No customers found matching "{searchTerm}".
        </div>
      )}
    </div>
  );
}
