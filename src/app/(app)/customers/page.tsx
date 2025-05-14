
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Search, Eye, User, Users, ShieldCheck, ShieldX, DollarSign, ShoppingBag, CalendarDays, Phone } from "lucide-react";
import NextImage from "next/image";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Customer, CustomerStatus, Store } from "@/lib/mockData";
import { initialCustomers, customerStatusColors, initialStores } from "@/lib/mockData";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const defaultNewCustomerData: Omit<Customer, 'id' | 'avatar' | 'dataAiHintAvatar' | 'totalSpent' | 'totalOrders' | 'joinedDate' | 'lastOrderDate'> = {
  name: "",
  email: "",
  status: "Active",
  phone: "",
  address: { street: "", city: "", state: "", zip: "", country: ""},
  tags: [],
};

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const [selectedStoreName, setSelectedStoreName] = React.useState<string | null>(null);

  const [customers, setCustomers] = React.useState<Customer[]>(initialCustomers);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  const [formData, setFormData] = React.useState<Omit<Customer, 'id' | 'avatar' | 'dataAiHintAvatar' | 'totalSpent' | 'totalOrders' | 'joinedDate' | 'lastOrderDate'>>(defaultNewCustomerData);

  React.useEffect(() => {
    if (storeId) {
      const store = initialStores.find((s: Store) => s.id === storeId);
      setSelectedStoreName(store ? store.name : "Unknown Store");
    } else if (initialStores.length > 0) {
        setSelectedStoreName(initialStores[0].name); 
    }
     else {
      setSelectedStoreName("No Store Selected");
    }
    // Customer data might be global, but their activity (totalSpent, totalOrders)
    // would ideally be filtered by storeId in a real backend.
  }, [storeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1] as keyof Customer["address"];
      setFormData(prev => ({
        ...prev,
        address: { ...(prev.address || defaultNewCustomerData.address!), [addressField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleStatusChange = (value: CustomerStatus) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const processCustomerForm = (currentData: typeof formData, currentCustomer?: Customer): Omit<Customer, 'id' | 'avatar' | 'dataAiHintAvatar' | 'totalSpent' | 'totalOrders' | 'joinedDate' | 'lastOrderDate'> => {
    return {
      name: currentData.name,
      email: currentData.email,
      phone: currentData.phone || undefined,
      address: currentData.address,
      status: currentData.status,
      tags: currentData.tags || [],
    };
  };

  const handleAddCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const customerData = processCustomerForm(formData);
      const newCustomer: Customer = {
        id: `cust_${Date.now()}`,
        ...customerData,
        avatar: "https://placehold.co/40x40.png", 
        dataAiHintAvatar: "person new",
        totalSpent: 0, // Initial values, would be calculated per store in real app
        totalOrders: 0, // Initial values
        joinedDate: new Date().toISOString().split("T")[0],
      };

      initialCustomers.unshift(newCustomer);
      setCustomers([newCustomer, ...customers]);
      setIsAddDialogOpen(false);
      setFormData(defaultNewCustomerData);
      toast({ title: "Customer Added", description: `${newCustomer.name} has been successfully added.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add customer." });
    }
  };

  const handleEditCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCustomer) return;
    try {
      const customerData = processCustomerForm(formData, selectedCustomer);
      const updatedCustomer: Customer = {
        ...selectedCustomer,
        ...customerData,
        // totalSpent and totalOrders would be recalculated based on selectedStoreId in a real app
      };
      
      const customerIndex = initialCustomers.findIndex(c => c.id === selectedCustomer.id);
      if (customerIndex !== -1) {
        initialCustomers[customerIndex] = updatedCustomer;
      }
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? updatedCustomer : c));
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      setFormData(defaultNewCustomerData);
      toast({ title: "Customer Updated", description: `${updatedCustomer.name} has been successfully updated.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not update customer." });
    }
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    const customerIndex = initialCustomers.findIndex(c => c.id === selectedCustomer.id);
    if (customerIndex !== -1) {
      initialCustomers.splice(customerIndex, 1);
    }
    setCustomers(customers.filter(c => c.id !== selectedCustomer.id));
    setIsDeleteDialogOpen(false);
    toast({ title: "Customer Deleted", description: `${selectedCustomer.name} has been successfully deleted.`, variant: "destructive" });
    setSelectedCustomer(null);
  };
  
  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
        name: customer.name,
        email: customer.email,
        status: customer.status,
        phone: customer.phone || "",
        address: customer.address || { street: "", city: "", state: "", zip: "", country: ""},
        tags: customer.tags || []
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
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
      
      <Separator className="my-4"/>
      <h4 className="font-medium text-md col-span-full">Address Details (Optional)</h4>
      <div className="grid gap-2">
        <Label htmlFor="address.street">Street Address</Label>
        <Input id="address.street" name="address.street" value={formData.address?.street || ""} onChange={handleInputChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="address.city">City</Label>
          <Input id="address.city" name="address.city" value={formData.address?.city || ""} onChange={handleInputChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address.state">State/Province</Label>
          <Input id="address.state" name="address.state" value={formData.address?.state || ""} onChange={handleInputChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="address.zip">ZIP/Postal Code</Label>
          <Input id="address.zip" name="address.zip" value={formData.address?.zip || ""} onChange={handleInputChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address.country">Country</Label>
          <Input id="address.country" name="address.country" value={formData.address?.country || ""} onChange={handleInputChange} />
        </div>
      </div>

      <Separator className="my-4"/>
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Users className="h-7 w-7"/>Customers</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8 sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => { setIsAddDialogOpen(isOpen); if (!isOpen) setFormData(defaultNewCustomerData); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setSelectedCustomer(null); setFormData(defaultNewCustomerData); setIsAddDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg"> 
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Enter the details for the new customer.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCustomer}>
                <ScrollArea className="h-[70vh] pr-6">
                  <div className="grid gap-4 py-4">
                   {renderCustomerFormFields()}
                  </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t">
                   <Button type="button" variant="outline" onClick={() => {setIsAddDialogOpen(false); setFormData(defaultNewCustomerData);}}>Cancel</Button>
                  <Button type="submit">Add Customer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {selectedStoreName && <p className="text-sm text-muted-foreground">Customer activity (Total Spent, Total Orders) reflects data for store: <span className="font-semibold">{selectedStoreName}</span>.</p>}


      <Card>
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
              <TableRow key={customer.id}>
                <TableCell className="hidden sm:table-cell">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={customer.avatar} alt={customer.name} data-ai-hint={customer.dataAiHintAvatar} />
                        <AvatarFallback>{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </TableCell>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{customer.email}</TableCell>
                <TableCell className="text-right hidden lg:table-cell">${customer.totalSpent.toFixed(2)}</TableCell>
                <TableCell className="text-center hidden lg:table-cell">{customer.totalOrders}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(customer.joinedDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(customerStatusColors[customer.status], "flex items-center gap-1.5 whitespace-nowrap text-xs")}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem> {/* Replace with Link to customer detail page if one exists */}
                          <Eye className="mr-2 h-4 w-4" /> View Details
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
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if(!isOpen) setFormData(defaultNewCustomerData); }}>
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
                <Button type="button" variant="outline" onClick={() => {setIsEditDialogOpen(false); setFormData(defaultNewCustomerData);}}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
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
            <AlertDialogCancel onClick={() => setSelectedCustomer(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {filteredCustomers.length === 0 && searchTerm && (
        <div className="text-center text-muted-foreground py-10">
          No customers found matching "{searchTerm}".
        </div>
      )}
       {filteredCustomers.length === 0 && !searchTerm && customers.length === 0 && (
        <div className="text-center text-muted-foreground py-10 col-span-full">
          No customers yet. Click "Add Customer" to get started.
        </div>
      )}
    </div>
  );
}

