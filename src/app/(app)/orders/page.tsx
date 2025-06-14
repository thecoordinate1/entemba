
"use client";

import type { Order as OrderUIType, OrderStatus, Product as ProductUIType } from "@/lib/mockData"; // Using mockData types for UI consistency
import { orderStatusColors, orderStatusIcons } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Eye, Filter, MoreHorizontal, PlusCircle, Printer, Search, ShoppingCart, Trash2, Truck, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { getOrdersByStoreId, createOrder, updateOrderStatus, type OrderPayload, type OrderItemPayload, type OrderFromSupabase, getOrdersByStoreIdAndStatus } from "@/services/orderService";
import { getProductsByStoreId as fetchStoreProducts, type ProductFromSupabase } from "@/services/productService";
import { getCustomerByEmail, createCustomer as createNewCustomer, type CustomerPayload as NewCustomerPayload } from "@/services/customerService";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 10;

interface NewOrderItemEntry {
  productId: string;
  productName: string;
  productImage: string;
  productDataAiHint: string;
  unitPrice: number;
  quantity: number;
}

const defaultNewOrderData = {
  customerName: "",
  customerEmail: "",
  shippingAddress: "",
  billingAddress: "",
  shippingMethod: "",
  paymentMethod: "",
  trackingNumber: "",
  shippingLatitude: "",
  shippingLongitude: "",
  status: "Pending" as OrderStatus,
};

const mapOrderFromSupabaseToUI = (order: OrderFromSupabase): OrderUIType => {
  return {
    id: order.id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    date: new Date(order.order_date).toISOString().split("T")[0],
    total: order.total_amount,
    status: order.status as OrderStatus,
    itemsCount: order.order_items.reduce((sum, item) => sum + item.quantity, 0),
    detailedItems: order.order_items.map(item => ({
      productId: item.product_id || `deleted_${item.id}`,
      name: item.product_name_snapshot,
      quantity: item.quantity,
      price: item.price_per_unit_snapshot,
      image: item.product_image_url_snapshot || "https://placehold.co/50x50.png",
      dataAiHint: item.data_ai_hint_snapshot || "product",
    })),
    shippingAddress: order.shipping_address,
    billingAddress: order.billing_address,
    shippingMethod: order.shipping_method || undefined,
    paymentMethod: order.payment_method || undefined,
    trackingNumber: order.tracking_number || undefined,
    shippingLatitude: order.shipping_latitude || undefined,
    shippingLongitude: order.shipping_longitude || undefined,
  };
};

const mapProductFromSupabaseToProductUIType = (product: ProductFromSupabase): ProductUIType => {
  return {
    id: product.id,
    name: product.name,
    images: product.product_images.sort((a,b) => a.order - b.order).map(img => img.image_url),
    dataAiHints: product.product_images.sort((a,b) => a.order - b.order).map(img => img.data_ai_hint || ''),
    category: product.category,
    price: product.price,
    orderPrice: product.order_price ?? undefined,
    stock: product.stock,
    status: product.status as ProductUIType["status"],
    createdAt: new Date(product.created_at).toISOString().split("T")[0],
    description: product.description ?? undefined,
    fullDescription: product.full_description,
    sku: product.sku ?? undefined,
    tags: product.tags ?? undefined,
    weight: product.weight_kg ?? undefined,
    dimensions: product.dimensions_cm ? {
        length: product.dimensions_cm.length,
        width: product.dimensions_cm.width,
        height: product.dimensions_cm.height
    } : undefined,
  };
};


export default function OrdersPage() {
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams.get("storeId");
  const [selectedStoreName, setSelectedStoreName] = React.useState<string | null>(null);

  const [orders, setOrders] = React.useState<OrderUIType[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "All">("All");
  const { toast } = useToast();

  const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = React.useState(false);
  const [newOrderData, setNewOrderData] = React.useState(defaultNewOrderData);
  const [newOrderItems, setNewOrderItems] = React.useState<NewOrderItemEntry[]>([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = React.useState<string>("");
  const [quantityToAdd, setQuantityToAdd] = React.useState<number>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [storeProducts, setStoreProducts] = React.useState<ProductUIType[]>([]);
  const [isLoadingStoreProducts, setIsLoadingStoreProducts] = React.useState(false);

  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<User | null>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalOrders, setTotalOrders] = React.useState(0);

  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  React.useEffect(() => {
    if (storeIdFromUrl) {
      supabase.from('stores').select('name').eq('id', storeIdFromUrl).single().then(({data}) => {
        setSelectedStoreName(data?.name || "Selected Store");
      });

      if (authUser) {
        setIsLoadingOrders(true);
        setIsLoadingStoreProducts(true); // Keep this for Add Order dialog

        let fetchPromise;
        if (statusFilter === "All") {
          fetchPromise = getOrdersByStoreId(storeIdFromUrl, currentPage, ITEMS_PER_PAGE);
        } else {
          fetchPromise = getOrdersByStoreIdAndStatus(storeIdFromUrl, statusFilter, currentPage, ITEMS_PER_PAGE);
        }

        fetchPromise
          .then(({ data, count, error }) => {
            if (error) {
              toast({ variant: "destructive", title: "Error fetching orders", description: error.message });
              setOrders([]);
              setTotalOrders(0);
            } else if (data) {
              setOrders(data.map(mapOrderFromSupabaseToUI));
              setTotalOrders(count || 0);
            }
          })
          .finally(() => setIsLoadingOrders(false));

        // Fetch products for the store (no pagination needed for this dropdown)
        fetchStoreProducts(storeIdFromUrl, 1, 1000) // Fetch a large number for dropdown
          .then(({ data: productsData, error: productsError }) => {
            if (productsError) {
              toast({ variant: "destructive", title: "Error fetching store products", description: productsError.message });
              setStoreProducts([]);
            } else if (productsData) {
              setStoreProducts(productsData.map(mapProductFromSupabaseToProductUIType).filter(p => p.status === 'Active'));
            }
          })
          .finally(() => setIsLoadingStoreProducts(false));

      } else {
        setOrders([]);
        setTotalOrders(0);
        setIsLoadingOrders(false);
        setStoreProducts([]);
        setIsLoadingStoreProducts(false);
      }
    } else {
      setSelectedStoreName("No Store Selected");
      setOrders([]);
      setTotalOrders(0);
      setIsLoadingOrders(false);
      setStoreProducts([]);
      setIsLoadingStoreProducts(false);
    }
  }, [storeIdFromUrl, authUser, statusFilter, currentPage, toast, supabase]);


  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, trackingNumber?: string) => {
    if (!storeIdFromUrl) {
        toast({ variant: "destructive", title: "Store Not Selected", description: "Cannot update order status without a selected store." });
        return;
    }
    const { data: updatedOrderData, error } = await updateOrderStatus(orderId, storeIdFromUrl, newStatus, trackingNumber);
    if (error) {
      toast({ variant: "destructive", title: "Error Updating Status", description: error.message });
    } else if (updatedOrderData) {
      const updatedOrderUI = mapOrderFromSupabaseToUI(updatedOrderData);
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrderUI : o));
      toast({ title: "Order Status Updated", description: `Order ${orderId} status changed to ${newStatus}.` });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }); // Sorting by date is handled by the service now.


  const resetAddOrderForm = () => {
    setNewOrderData(defaultNewOrderData);
    setNewOrderItems([]);
    setSelectedProductIdToAdd("");
    setQuantityToAdd(1);
  };

  const handleAddProductToOrder = () => {
    if (!selectedProductIdToAdd || quantityToAdd <= 0) {
      toast({ title: "Invalid Input", description: "Please select a product and specify a valid quantity.", variant: "destructive" });
      return;
    }
    const product = storeProducts.find(p => p.id === selectedProductIdToAdd);
    if (!product) {
      toast({ title: "Product Not Found", variant: "destructive" });
      return;
    }

    const existingItemIndex = newOrderItems.findIndex(item => item.productId === product.id);
    if (existingItemIndex > -1) {
      const updatedItems = [...newOrderItems];
      updatedItems[existingItemIndex].quantity += quantityToAdd;
      setNewOrderItems(updatedItems);
    } else {
      setNewOrderItems(prevItems => [
        ...prevItems,
        {
          productId: product.id,
          productName: product.name,
          productImage: product.images[0] || "https://placehold.co/50x50.png",
          productDataAiHint: product.dataAiHints[0] || "product",
          unitPrice: product.orderPrice !== undefined ? product.orderPrice : product.price,
          quantity: quantityToAdd,
        }
      ]);
    }
    setSelectedProductIdToAdd("");
    setQuantityToAdd(1);
  };

  const handleRemoveProductFromOrder = (productId: string) => {
    setNewOrderItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const handleNewOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewOrderData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewOrderStatusChange = (value: OrderStatus) => {
    setNewOrderData(prev => ({ ...prev, status: value }));
  };

  const calculateNewOrderTotal = React.useMemo(() => {
    return newOrderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [newOrderItems]);


  const handleCreateOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!storeIdFromUrl || !authUser) {
      toast({ variant: "destructive", title: "Error", description: "Store or user not identified." });
      return;
    }
    if (newOrderItems.length === 0) {
      toast({ title: "No Items", description: "Please add at least one product to the order.", variant: "destructive" });
      return;
    }
    if (!newOrderData.customerName.trim() || !newOrderData.customerEmail.trim()) {
        toast({ variant: "destructive", title: "Missing Customer Info", description: "Customer Name and Email are required." });
        return;
    }
    setIsSubmitting(true);

    let customerIdForOrder: string | null = null;

    try {
      const { data: existingCustomer, error: getCustomerError } = await getCustomerByEmail(newOrderData.customerEmail);
      if (getCustomerError) {
        throw new Error(`Failed to check for existing customer: ${getCustomerError.message}`);
      }

      if (existingCustomer) {
        customerIdForOrder = existingCustomer.id;
      } else {
        const newCustomerPayload: NewCustomerPayload = {
          name: newOrderData.customerName,
          email: newOrderData.customerEmail,
          status: 'Active',
        };
        const { data: newlyCreatedCustomer, error: createCustomerError } = await createNewCustomer(newCustomerPayload);
        if (createCustomerError || !newlyCreatedCustomer) {
          throw new Error(`Failed to create new customer: ${createCustomerError?.message || 'Unknown error'}`);
        }
        customerIdForOrder = newlyCreatedCustomer.id;
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Customer Management Error", description: error.message });
      setIsSubmitting(false);
      return;
    }


    const orderPayload: OrderPayload = {
      store_id: storeIdFromUrl,
      customer_id: customerIdForOrder,
      customer_name: newOrderData.customerName,
      customer_email: newOrderData.customerEmail,
      total_amount: calculateNewOrderTotal,
      status: newOrderData.status,
      shipping_address: newOrderData.shippingAddress,
      billing_address: newOrderData.billingAddress || newOrderData.shippingAddress,
      shipping_method: newOrderData.shippingMethod || null,
      payment_method: newOrderData.paymentMethod || null,
      tracking_number: newOrderData.trackingNumber || null,
      shipping_latitude: newOrderData.shippingLatitude ? parseFloat(newOrderData.shippingLatitude) : null,
      shipping_longitude: newOrderData.shippingLongitude ? parseFloat(newOrderData.shippingLongitude) : null,
    };

    const itemsPayload: OrderItemPayload[] = newOrderItems.map(item => ({
      product_id: item.productId,
      product_name_snapshot: item.productName,
      quantity: item.quantity,
      price_per_unit_snapshot: item.unitPrice,
      product_image_url_snapshot: item.productImage,
      data_ai_hint_snapshot: item.productDataAiHint,
    }));

    const { data: newOrderFromBackend, error } = await createOrder(orderPayload, itemsPayload);

    if (error || !newOrderFromBackend) {
      toast({ variant: "destructive", title: "Error Creating Order", description: error?.message || "Could not create order." });
    } else {
      toast({ title: "Order Created", description: `Order ${newOrderFromBackend.id} has been successfully created for ${selectedStoreName || 'the current store'}.` });
      setIsAddOrderDialogOpen(false);
      resetAddOrderForm();
      // Refetch current page to include new order if it falls on this page (and sort is by date desc)
      if (currentPage === 1) { // Only auto-refresh if on the first page for new items
        const { data, count } = statusFilter === "All"
          ? await getOrdersByStoreId(storeIdFromUrl, 1, ITEMS_PER_PAGE)
          : await getOrdersByStoreIdAndStatus(storeIdFromUrl, statusFilter, 1, ITEMS_PER_PAGE);
        if (data) setOrders(data.map(mapOrderFromSupabaseToUI));
        if (count !== null) setTotalOrders(count);
      } else {
        setCurrentPage(1); // Go to first page to see new order
      }
    }
    setIsSubmitting(false);
  };

  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="pl-8 sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!storeIdFromUrl || !authUser}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!storeIdFromUrl || !authUser}>
                <Filter className="mr-2 h-4 w-4" />
                {statusFilter === "All" ? "Filter Status" : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter === "All"}
                onCheckedChange={() => { setStatusFilter("All"); setCurrentPage(1); }}
              >
                All
              </DropdownMenuCheckboxItem>
              {(Object.keys(orderStatusIcons) as OrderStatus[]).map(status => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={() => { setStatusFilter(status); setCurrentPage(1);}}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Dialog open={isAddOrderDialogOpen} onOpenChange={(isOpen) => { setIsAddOrderDialogOpen(isOpen); if (!isOpen) resetAddOrderForm(); }}>
          <DialogTrigger asChild>
            <Button disabled={!storeIdFromUrl || !authUser}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Create New Order {selectedStoreName ? `for ${selectedStoreName}`: ''}</DialogTitle>
              <DialogDescription>
                Fill in the details to manually create a new order.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrder}>
              <ScrollArea className="h-[65vh] pr-4">
                <div className="grid gap-4 px-2 pb-6 pt-0">
                  <Card>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="customerName">Customer Name</Label>
                        <Input id="customerName" name="customerName" value={newOrderData.customerName} onChange={handleNewOrderInputChange} required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="customerEmail">Customer Email</Label>
                        <Input id="customerEmail" name="customerEmail" type="email" value={newOrderData.customerEmail} onChange={handleNewOrderInputChange} required />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="shippingAddress">Shipping Address</Label>
                            <Textarea id="shippingAddress" name="shippingAddress" value={newOrderData.shippingAddress} onChange={handleNewOrderInputChange} required rows={3}/>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="billingAddress">Billing Address (Optional)</Label>
                            <Textarea id="billingAddress" name="billingAddress" value={newOrderData.billingAddress} onChange={handleNewOrderInputChange} placeholder="Leave blank if same as shipping" rows={3}/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="shippingLatitude">Shipping Latitude (Optional)</Label>
                            <Input id="shippingLatitude" name="shippingLatitude" type="number" step="any" value={newOrderData.shippingLatitude} onChange={handleNewOrderInputChange} placeholder="e.g., 34.0522" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shippingLongitude">Shipping Longitude (Optional)</Label>
                            <Input id="shippingLongitude" name="shippingLongitude" type="number" step="any" value={newOrderData.shippingLongitude} onChange={handleNewOrderInputChange} placeholder="e.g., -118.2437" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shippingMethod">Shipping Method</Label>
                            <Input id="shippingMethod" name="shippingMethod" value={newOrderData.shippingMethod} onChange={handleNewOrderInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="paymentMethod">Payment Method</Label>
                            <Input id="paymentMethod" name="paymentMethod" value={newOrderData.paymentMethod} onChange={handleNewOrderInputChange} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="trackingNumber">Tracking Number (Optional)</Label>
                            <div className="relative">
                                <Truck className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input id="trackingNumber" name="trackingNumber" value={newOrderData.trackingNumber || ""} onChange={handleNewOrderInputChange} className="pl-8" />
                            </div>
                        </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <h4 className="font-medium text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary"/>Order Items</h4>
                      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 items-end p-3 border rounded-md">
                        <div className="grid gap-1.5">
                          <Label htmlFor="productToAdd">Select Product</Label>
                          <Select value={selectedProductIdToAdd} onValueChange={setSelectedProductIdToAdd} disabled={isLoadingStoreProducts || storeProducts.length === 0}>
                            <SelectTrigger id="productToAdd">
                              <SelectValue placeholder={isLoadingStoreProducts ? "Loading products..." : storeProducts.length === 0 ? "No products in store" : "Choose a product..."} />
                            </SelectTrigger>
                            <SelectContent>
                              {storeProducts.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} (ZMW {product.orderPrice !== undefined ? product.orderPrice.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : product.price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})})
                                </SelectItem>
                              ))}
                              {storeProducts.length === 0 && !isLoadingStoreProducts && <SelectItem value="no-prods" disabled>No active products</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="quantityToAdd">Quantity</Label>
                          <Input id="quantityToAdd" type="number" min="1" value={quantityToAdd} onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)} />
                        </div>
                        <Button type="button" onClick={handleAddProductToOrder} className="self-end" disabled={!selectedProductIdToAdd || isLoadingStoreProducts}>Add Item</Button>
                      </div>

                      {newOrderItems.length > 0 && (
                        <div className="space-y-2">
                          <Label>Current Items in Order:</Label>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[60px] hidden sm:table-cell">Image</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {newOrderItems.map(item => (
                                <TableRow key={item.productId}>
                                  <TableCell className="hidden sm:table-cell">
                                    <Image src={item.productImage} alt={item.productName} width={40} height={40} className="rounded-md object-cover" data-ai-hint={item.productDataAiHint}/>
                                  </TableCell>
                                  <TableCell className="font-medium">{item.productName}</TableCell>
                                  <TableCell className="text-right">{item.quantity}</TableCell>
                                  <TableCell className="text-right">ZMW {item.unitPrice.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</TableCell>
                                  <TableCell className="text-right">ZMW {(item.unitPrice * item.quantity).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</TableCell>
                                  <TableCell>
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveProductFromOrder(item.productId)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-end items-center gap-4">
                            <Label className="text-lg font-semibold">Order Total:</Label>
                            <div className="text-xl font-bold flex items-center">
                                <DollarSign className="h-5 w-5 mr-1 text-primary"/> {calculateNewOrderTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                            </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6 grid gap-2">
                      <Label htmlFor="orderStatus">Order Status</Label>
                      <Select name="status" value={newOrderData.status} onValueChange={handleNewOrderStatusChange}>
                        <SelectTrigger id="orderStatus">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(orderStatusIcons) as OrderStatus[]).map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 mt-4 border-t px-6">
                <Button type="button" variant="outline" onClick={() => {setIsAddOrderDialogOpen(false); resetAddOrderForm();}} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !authUser || !storeIdFromUrl}>{isSubmitting ? "Creating..." : "Create Order"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!authUser && <p className="text-center text-muted-foreground py-4">Please sign in to manage orders.</p>}
      {authUser && !storeIdFromUrl && <p className="text-center text-muted-foreground py-4">Please select a store to view orders.</p>}
      {authUser && storeIdFromUrl && selectedStoreName && <p className="text-sm text-muted-foreground">Showing orders for store: <span className="font-semibold">{selectedStoreName}</span>. New orders will be added to this store.</p>}

      {isLoadingOrders && authUser && storeIdFromUrl && (
         <div className="space-y-2">
          {[...Array(ITEMS_PER_PAGE / 2)].map((_, i) => ( // Show fewer skeletons
            <Skeleton key={`skel-order-row-${i}`} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!isLoadingOrders && authUser && storeIdFromUrl && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const Icon = orderStatusIcons[order.status];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0,8)}...</TableCell>
                      <TableCell>
                        <div>{order.customerName}</div>
                        <div className="text-xs text-muted-foreground hidden sm:block">{order.customerEmail}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{new Date(order.date).toLocaleDateString()}</TableCell>
                      <TableCell className="hidden md:table-cell text-right">ZMW {order.total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(orderStatusColors[order.status], "flex items-center gap-1.5 whitespace-nowrap")}>
                          <Icon className="h-3.5 w-3.5" />
                          {order.status}
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
                            <DropdownMenuItem asChild>
                              <Link href={`/orders/${order.id}?${searchParams.toString()}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Order Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({title: "Label Printed", description: `Shipping label for ${order.id} sent to printer.`})}>
                              <Printer className="mr-2 h-4 w-4" /> Print Shipping Label
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                            {(Object.keys(orderStatusIcons) as OrderStatus[]).map(status => (
                              order.status !== status && (
                                <DropdownMenuItem key={status} onClick={() => handleUpdateStatus(order.id, status)}>
                                  Mark as {status}
                                </DropdownMenuItem>
                              )
                            ))}
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
                Page {currentPage} of {totalPages} ({totalOrders} orders)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
          {totalOrders === 0 && !isLoadingOrders && (
             <CardFooter className="flex items-center justify-center border-t pt-4">
                <p className="text-sm text-muted-foreground">
                    {searchTerm ? `No orders found matching "${searchTerm}".` : "No orders yet for this store and filter."}
                </p>
             </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}

