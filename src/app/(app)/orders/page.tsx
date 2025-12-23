"use client";

import type { OrderStatus, Product as ProductUIType } from "@/lib/types"; // Using types for UI consistency
import { format } from "date-fns";
import { orderStatusIcons, orderStatusColors } from "@/lib/types";
import { cn, downloadCSV } from "@/lib/utils";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Eye, Filter, MoreHorizontal, PlusCircle, Printer, Search, ShoppingCart, Trash2, Truck, MapPin, ChevronLeft, ChevronRight, Check, AlertTriangle, PackageSearch, Copy, LocateFixed, Link as LinkIcon, Building } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { getOrdersByStoreId, createOrder, updateOrderStatus, type OrderPayloadForRPC, type OrderItemPayload, type OrderFromSupabase, getOrdersByStoreIdAndStatus } from "@/services/orderService";
import { getProductsByStoreId as fetchStoreProducts, getProductsByIds, type ProductFromSupabase } from "@/services/productService";
import { getStoreById, type StoreFromSupabase } from "@/services/storeService";
import { getCustomerByEmail, createCustomer as createNewCustomer, type CustomerPayload as NewCustomerPayload } from "@/services/customerService";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order as OrderUIType } from "@/lib/types";
import { mapOrderFromSupabaseToUI } from "@/lib/order-mapper";
import { MobileOrderCard } from "@/components/MobileOrderCard";

const ITEMS_PER_PAGE = 10;

interface NewOrderItemEntry {
  productId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
}

const defaultNewOrderData = {
  customerName: "",
  customerEmail: "",
  customerSpecification: "",
  shippingAddress: "",
  billingAddress: "",
  shippingMethod: "Standard",
  paymentMethod: "",
  shippingLatitude: "",
  shippingLongitude: "",
  status: "Pending" as OrderStatus,
  delivery_type: null,
  delivery_cost: "",
  serviceFees: "",
  notes: "",
};


const mapProductFromSupabaseToProductUIType = (product: ProductFromSupabase): ProductUIType => {
  return {
    id: product.id,
    name: product.name,
    images: product.product_images.sort((a, b) => a.order - b.order).map(img => img.image_url),
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
  const router = useRouter();
  const storeIdFromUrl = searchParams.get("storeId");
  const [selectedStore, setSelectedStore] = React.useState<StoreFromSupabase | null>(null);

  const [orders, setOrders] = React.useState<OrderUIType[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "All">("All");
  const { toast } = useToast();

  const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = React.useState(false);

  // Auto-open dialog if action=new
  React.useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddOrderDialogOpen(true);
    }
  }, [searchParams]);
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

  const [orderToProcess, setOrderToProcess] = React.useState<OrderUIType | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = React.useState(false);
  const [isPickupLocationDialogOpen, setIsPickupLocationDialogOpen] = React.useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = React.useState(false);
  const [isOutOfStockDialogOpen, setIsOutOfStockDialogOpen] = React.useState(false);
  const [pickupLocationInfo, setPickupLocationInfo] = React.useState<{ address: string; coords: { lat: number, lng: number } | null }>({ address: "", coords: null });
  const [isFetchingLocation, setIsFetchingLocation] = React.useState(false);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = React.useState(false);
  const isTransitioningToDelivery = React.useRef(false);


  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  // Reset pagination when store changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [storeIdFromUrl]);

  React.useEffect(() => {
    const fetchPageData = async () => {
      if (!storeIdFromUrl || !authUser) {
        setOrders([]);
        setTotalOrders(0);
        setStoreProducts([]);
        setSelectedStore(null);
        setIsLoadingOrders(!storeIdFromUrl && !!authUser); // Only loading if store is missing but user is logged in
        setIsLoadingStoreProducts(false);
        return;
      }

      setIsLoadingOrders(true);
      setIsLoadingStoreProducts(true);

      try {
        const storePromise = getStoreById(storeIdFromUrl, authUser.id);
        const ordersPromise = statusFilter === "All"
          ? getOrdersByStoreId(storeIdFromUrl, currentPage, ITEMS_PER_PAGE)
          : getOrdersByStoreIdAndStatus(storeIdFromUrl, statusFilter, currentPage, ITEMS_PER_PAGE);
        const productsPromise = fetchStoreProducts(storeIdFromUrl, 1, 1000); // Fetch all for dropdown

        const [storeResult, ordersResult, productsResult] = await Promise.allSettled([storePromise, ordersPromise, productsPromise]);

        if (storeResult.status === 'fulfilled' && !storeResult.value.error) {
          setSelectedStore(storeResult.value.data);
        } else if (storeResult.status === 'rejected' || storeResult.value.error) {
          const error = storeResult.status === 'fulfilled' ? storeResult.value.error : storeResult.reason;
          toast({ variant: "destructive", title: "Error fetching store details", description: error.message });
        }

        if (ordersResult.status === 'fulfilled' && !ordersResult.value.error) {
          setOrders(ordersResult.value.data?.map(mapOrderFromSupabaseToUI) || []);
          setTotalOrders(ordersResult.value.count || 0);
        } else if (ordersResult.status === 'rejected' || ordersResult.value.error) {
          const error = ordersResult.status === 'fulfilled' ? ordersResult.value.error : ordersResult.reason;
          toast({ variant: "destructive", title: "Error fetching orders", description: error.message });
        }

        if (productsResult.status === 'fulfilled' && !productsResult.value.error) {
          setStoreProducts(productsResult.value.data?.map(mapProductFromSupabaseToProductUIType).filter(p => p.status === 'Active') || []);
        } else if (productsResult.status === 'rejected' || productsResult.value.error) {
          const error = productsResult.status === 'fulfilled' ? productsResult.value.error : productsResult.reason;
          toast({ variant: "destructive", title: "Error fetching store products", description: error.message });
        }

      } catch (error: any) {
        toast({ variant: "destructive", title: "An unexpected error occurred", description: error.message });
      } finally {
        setIsLoadingOrders(false);
        setIsLoadingStoreProducts(false);
      }
    };

    fetchPageData();
  }, [storeIdFromUrl, authUser?.id, statusFilter, currentPage, toast]);

  React.useEffect(() => {
    const checkStockAndProceed = async () => {
      if (!orderToProcess || !storeIdFromUrl) return;

      setIsProcessingOrder(true);
      const productIds = orderToProcess.detailedItems.map(item => item.productId);
      const { data: productsInOrder, error } = await getProductsByIds(productIds);

      if (error) {
        toast({ variant: "destructive", title: "Error Checking Stock", description: error.message });
        setIsProcessingOrder(false);
        setOrderToProcess(null);
        return;
      }

      if (!productsInOrder) {
        toast({ variant: "destructive", title: "Error", description: "Could not retrieve product data for this order." });
        setIsProcessingOrder(false);
        setOrderToProcess(null);
        return;
      }

      const isEverythingInStock = orderToProcess.detailedItems.every(item => {
        const product = productsInOrder.find(p => p.id === item.productId);
        if (!product) return false;
        return product.stock >= item.quantity;
      });

      setIsProcessingOrder(false);
      if (isEverythingInStock) {
        const defaultCoords = (selectedStore?.pickup_latitude && selectedStore?.pickup_longitude)
          ? { lat: selectedStore.pickup_latitude, lng: selectedStore.pickup_longitude }
          : null;
        setPickupLocationInfo({ address: selectedStore?.location || "", coords: defaultCoords });
        setIsPickupLocationDialogOpen(true);
      } else {
        setIsOutOfStockDialogOpen(true);
      }
    };

    if (orderToProcess && !isPickupLocationDialogOpen && !isDeliveryDialogOpen && !isOutOfStockDialogOpen) {
      checkStockAndProceed();
    }
  }, [orderToProcess, storeIdFromUrl, toast, selectedStore, isPickupLocationDialogOpen, isDeliveryDialogOpen, isOutOfStockDialogOpen]);


  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    options?: {
      trackingNumber?: string | null;
      deliveryType?: 'self_delivery' | 'courier' | null;
      pickup_address?: string | null;
      pickup_latitude?: number | null;
      pickup_longitude?: number | null;
    },
    showToast: boolean = true
  ): Promise<boolean> => {
    if (!storeIdFromUrl) {
      toast({ variant: "destructive", title: "Store Not Selected", description: "Cannot update order status without a selected store." });
      return false;
    }
    const { data: updatedOrderData, error } = await updateOrderStatus(orderId, storeIdFromUrl, newStatus, options);
    if (error) {
      toast({ variant: "destructive", title: "Error Updating Status", description: error.message });
      return false;
    } else if (updatedOrderData) {
      const updatedOrderUI = mapOrderFromSupabaseToUI(updatedOrderData);
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrderUI : o));
      if (showToast) {
        toast({ title: "Order Status Updated", description: `Order ${orderId.substring(0, 8)}... status changed to ${newStatus}.` });
      }
      return true;
    }
    return false;
  };

  const handleConfirmDelivery = async (deliveryType: 'self_delivery' | 'courier') => {
    if (!orderToProcess || !storeIdFromUrl) return;

    setIsConfirmingDelivery(true);
    try {
      const success = await handleUpdateStatus(orderToProcess.id, 'Confirmed', {
        deliveryType,
        pickup_address: pickupLocationInfo.address,
        pickup_latitude: pickupLocationInfo.coords?.lat,
        pickup_longitude: pickupLocationInfo.coords?.lng
      }, false);

      if (success) {
        toast({
          title: "Order Confirmed",
          description: `The order is now confirmed. A tracking number will be assigned by the system.`
        });
      }
    } finally {
      setIsConfirmingDelivery(false);
      setIsDeliveryDialogOpen(false);
      setOrderToProcess(null);
      setPickupLocationInfo({ address: "", coords: null });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocation Not Supported", description: "Your browser does not support geolocation." });
      return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPickupLocationInfo({ address: "Current GPS Location", coords: { lat: latitude, lng: longitude } });
        setIsFetchingLocation(false);
        toast({ title: "Location Captured", description: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}` });
      },
      (error) => {
        toast({ variant: "destructive", title: "Geolocation Failed", description: error.message });
        setIsFetchingLocation(false);
      }
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });


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
          unitPrice: product.price,
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

  const handleShippingMethodChange = (value: string) => {
    setNewOrderData(prev => ({ ...prev, shippingMethod: value }));
  };

  const handleNewOrderStatusChange = (value: OrderStatus) => {
    setNewOrderData(prev => ({ ...prev, status: value }));
  };

  const calculateNewOrderTotal = React.useMemo(() => {
    const itemsTotal = newOrderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const deliveryCost = parseFloat(String(newOrderData.delivery_cost)) || 0;
    const serviceFees = parseFloat(String(newOrderData.serviceFees)) || 0;
    return itemsTotal + deliveryCost + serviceFees;
  }, [newOrderItems, newOrderData.delivery_cost, newOrderData.serviceFees]);


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

    if (!customerIdForOrder) {
      toast({ variant: "destructive", title: "Customer Error", description: "Could not identify or create a customer for this order." });
      setIsSubmitting(false);
      return;
    }

    const orderPayload: OrderPayloadForRPC = {
      customer_name: newOrderData.customerName,
      customer_email: newOrderData.customerEmail,
      total_amount: calculateNewOrderTotal,
      status: newOrderData.status,
      shipping_address: newOrderData.shippingAddress,
      billing_address: newOrderData.billingAddress || newOrderData.shippingAddress,
      delivery_tier: newOrderData.shippingMethod || null,
      payment_method: newOrderData.paymentMethod || null,
      shipping_latitude: newOrderData.shippingLatitude ? parseFloat(String(newOrderData.shippingLatitude)) : null,
      shipping_longitude: newOrderData.shippingLongitude ? parseFloat(String(newOrderData.shippingLongitude)) : null,
      delivery_type: null,
      customer_specification: newOrderData.customerSpecification || null,
      delivery_cost: newOrderData.delivery_cost ? parseFloat(String(newOrderData.delivery_cost)) : null,
      service_fees: newOrderData.serviceFees ? parseFloat(String(newOrderData.serviceFees)) : 0,
      notes: newOrderData.notes ? { content: newOrderData.notes } : null,
    };

    const itemsPayload: OrderItemPayload[] = newOrderItems.map(item => ({
      product_id: item.productId,
      product_name_snapshot: item.productName,
      quantity: item.quantity,
      price_per_unit_snapshot: item.unitPrice,
      product_image_url_snapshot: item.productImage,
    }));

    const { data: newOrderId, error } = await createOrder(storeIdFromUrl, customerIdForOrder, orderPayload, itemsPayload);

    if (error || !newOrderId) {
      toast({ variant: "destructive", title: "Error Creating Order", description: error?.message || "Could not create order." });
    } else {
      toast({ title: "Order Created", description: `Order ${newOrderId.id.substring(0, 8)}... has been successfully created.` });
      setIsAddOrderDialogOpen(false);
      resetAddOrderForm();
      if (currentPage === 1) {
        const { data, count } = statusFilter === "All"
          ? await getOrdersByStoreId(storeIdFromUrl, 1, ITEMS_PER_PAGE)
          : await getOrdersByStoreIdAndStatus(storeIdFromUrl, statusFilter, 1, ITEMS_PER_PAGE);
        if (data) setOrders(data.map(mapOrderFromSupabaseToUI));
        if (count !== null) setTotalOrders(count);
      } else {
        setCurrentPage(1);
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

  // Export Handler
  const handleExport = () => {
    if (!filteredOrders.length) {
      toast({ title: "No orders to export", variant: "destructive" });
      return;
    }
    const data = filteredOrders.map(o => ({
      "Order ID": o.id,
      "Date": format(new Date(o.date), 'yyyy-MM-dd HH:mm'),
      "Customer": o.customerName,
      "Status": o.status,
      "Total (ZMW)": o.total,
      "Items": o.detailedItems.length,
      "Payment": o.paymentMethod,
      "Delivery": o.deliveryTier
    }));
    downloadCSV(data, `orders-export-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`);
    toast({ title: "Export Started", description: "Your CSV file is downloading." });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-6 bg-muted/5 min-h-screen pb-20">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage and track your customer orders.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredOrders.length === 0}>
            <Printer className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" asChild disabled={!storeIdFromUrl || !authUser}>
            <Link href={`/delivery?${searchParams.toString()}`}>
              <Truck className="mr-2 h-4 w-4" />
              Delivery
            </Link>
          </Button>
          <Dialog open={isAddOrderDialogOpen} onOpenChange={(isOpen) => { setIsAddOrderDialogOpen(isOpen); if (!isOpen) resetAddOrderForm(); }}>
            <DialogTrigger asChild>
              <Button disabled={!storeIdFromUrl || !authUser} className="shadow-lg shadow-primary/20">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Order
              </Button>
            </DialogTrigger>
            {/* ... Existing Dialog Content ... */}
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle>Create New Order {selectedStore ? `for ${selectedStore.name}` : ''}</DialogTitle>
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
                      <CardContent className="pt-6 grid gap-2">
                        <Label htmlFor="customerSpecification">Customer Specification (Optional)</Label>
                        <Textarea id="customerSpecification" name="customerSpecification" value={newOrderData.customerSpecification} onChange={handleNewOrderInputChange} placeholder="e.g., Please gift wrap the items." rows={3} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="shippingAddress">Shipping Address</Label>
                          <Textarea id="shippingAddress" name="shippingAddress" value={newOrderData.shippingAddress} onChange={handleNewOrderInputChange} required rows={3} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="billingAddress">Billing Address (Optional)</Label>
                          <Textarea id="billingAddress" name="billingAddress" value={newOrderData.billingAddress} onChange={handleNewOrderInputChange} placeholder="Leave blank if same as shipping" rows={3} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                          <Label htmlFor="shippingCoords">Shipping Coordinates (Lat, Lng)</Label>
                          <Input
                            id="shippingCoords"
                            name="shippingCoords"
                            value={(newOrderData.shippingLatitude && newOrderData.shippingLongitude) ? `${newOrderData.shippingLatitude}, ${newOrderData.shippingLongitude}` : ""}
                            onChange={(e) => {
                              const [latStr, lngStr] = e.target.value.split(',').map(s => s.trim());
                              const lat = parseFloat(latStr);
                              const lng = parseFloat(lngStr);
                              setNewOrderData(prev => ({
                                ...prev,
                                shippingLatitude: !isNaN(lat) ? String(lat) : "",
                                shippingLongitude: !isNaN(lng) ? String(lng) : "",
                              }));
                            }}
                            placeholder="e.g., -15.4167, 28.2833"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="shippingMethod">Delivery Tier</Label>
                          <Select name="shippingMethod" value={newOrderData.shippingMethod} onValueChange={handleShippingMethodChange}>
                            <SelectTrigger id="shippingMethod">
                              <SelectValue placeholder="Select delivery speed" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Express">Express (1-2 days)</SelectItem>
                              <SelectItem value="Standard">Standard (2-4 days)</SelectItem>
                              <SelectItem value="Economy">Economy (4-7 days)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="deliveryCost">Delivery Cost</Label>
                          <Input id="deliveryCost" name="delivery_cost" type="number" step="0.01" value={newOrderData.delivery_cost} onChange={handleNewOrderInputChange} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="paymentMethod">Payment Method</Label>
                          <Input id="paymentMethod" name="paymentMethod" value={newOrderData.paymentMethod} onChange={handleNewOrderInputChange} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="serviceFees">Service Fees</Label>
                          <Input id="serviceFees" name="serviceFees" type="number" step="0.01" value={newOrderData.serviceFees} onChange={handleNewOrderInputChange} placeholder="0.00" />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                          <Label htmlFor="notes">Internal Notes</Label>
                          <Textarea id="notes" name="notes" value={newOrderData.notes} onChange={handleNewOrderInputChange} placeholder="Internal notes about this order..." rows={2} />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <h4 className="font-medium text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" />Order Items</h4>
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
                                    {product.name} (ZMW {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
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
                                      <Image src={item.productImage} alt={item.productName} width={40} height={40} className="rounded-md object-cover" />
                                    </TableCell>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">ZMW {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right">ZMW {(item.unitPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
                            ZMW {calculateNewOrderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <Button type="button" variant="outline" onClick={() => { setIsAddOrderDialogOpen(false); resetAddOrderForm(); }} disabled={isSubmitting}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || !authUser || !storeIdFromUrl}>{isSubmitting ? "Creating..." : "Create Order"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="flex flex-col gap-4">
        <Tabs defaultValue="All" className="w-full" value={statusFilter} onValueChange={(val) => { setStatusFilter(val as any); setCurrentPage(1); }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
              <TabsTrigger value="All" className="rounded-sm px-4">All</TabsTrigger>
              <TabsTrigger value="Pending" className="rounded-sm px-4">Pending</TabsTrigger>
              <TabsTrigger value="Confirmed" className="rounded-sm px-4">Confirmed</TabsTrigger>
              <TabsTrigger value="Shipped" className="rounded-sm px-4">Shipped</TabsTrigger>
              <TabsTrigger value="Delivered" className="rounded-sm px-4">Delivered</TabsTrigger>
              <TabsTrigger value="Cancelled" className="rounded-sm px-4">Cancelled</TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders..."
                className="pl-9 w-full sm:w-[250px] bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!storeIdFromUrl || !authUser}
              />
            </div>
          </div>

          <TabsContent value={statusFilter} className="mt-0">
            {!authUser ? (
              <div className="text-center text-muted-foreground py-10 bg-muted/10 rounded-xl border border-dashed">Please sign in to manage orders.</div>
            ) : !storeIdFromUrl ? (
              <div className="text-center text-muted-foreground py-10 bg-muted/10 rounded-xl border border-dashed">Please select a store to view orders.</div>
            ) : isLoadingOrders ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={`skel-${i}`} className="overflow-hidden border-none shadow-sm">
                    <CardContent className="p-4 flex gap-4 items-center">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] border rounded-2xl bg-gradient-to-br from-background to-muted/20 text-center p-8">
                <div className="bg-muted p-6 rounded-full mb-4">
                  <PackageSearch className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {searchTerm ? `We couldn't find any orders matching "${searchTerm}".` : `There are no ${statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} orders to display yet.`}
                </p>
                {statusFilter !== 'All' ? (
                  <Button variant="outline" onClick={() => setStatusFilter("All")}>View All Orders</Button>
                ) : (
                  <Button onClick={() => setIsAddOrderDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create First Order
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop View: Table */}
                <div className="hidden md:block rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden animate-in fade-in duration-500 slide-in-from-bottom-4">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[100px]">Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => {
                        const Icon = orderStatusIcons[order.status];
                        return (
                          <TableRow key={order.id} className="cursor-pointer hover:bg-muted/30 transition-colors group" onClick={() => router.push(`/orders/${order.id}?${searchParams.toString()}`)}>
                            <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                              #{order.id.substring(0, 8).toUpperCase()}
                              {order.deliveryCode && (
                                <div
                                  className="mt-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full w-fit flex items-center gap-1 cursor-pointer hover:bg-emerald-100 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(order.deliveryCode!);
                                    toast({ title: "Code Copied", description: "Delivery code copied to clipboard." });
                                  }}
                                >
                                  {order.deliveryCode}
                                  <Copy className="h-2.5 w-2.5" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${order.customerName}`} />
                                  <AvatarFallback>{getInitials(order.customerName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{order.customerName}</span>
                                  <span className="text-xs text-muted-foreground hidden sm:inline-block">{order.customerEmail}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                              {new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ZMW {order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 items-start">
                                <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium border shadow-sm", orderStatusColors[order.status])}>
                                  <Icon className="mr-1 h-3 w-3" />
                                  {order.status}
                                </Badge>
                                {order.deliveryTier === 'Express' && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 rounded-full animate-pulse">
                                    🚀 Express
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}?${searchParams.toString()}`)}>
                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                  </DropdownMenuItem>
                                  {order.status === 'Pending' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => setOrderToProcess(order)}
                                        disabled={isProcessingOrder && orderToProcess?.id === order.id}
                                      >
                                        <PackageSearch className="mr-2 h-4 w-4" />
                                        {isProcessingOrder && orderToProcess?.id === order.id ? "Checking Stock..." : "Process Order"}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                  <div className="grid grid-cols-2 gap-1 p-1">
                                    {(Object.keys(orderStatusIcons) as OrderStatus[]).map(status => (
                                      order.status !== status && (
                                        <Button
                                          key={status}
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-full justify-start text-[10px] px-1"
                                          onClick={() => handleUpdateStatus(order.id, status)}
                                        >
                                          {status}
                                        </Button>
                                      )
                                    ))}
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  {filteredOrders.map(order => (
                    <MobileOrderCard
                      key={order.id}
                      order={order}
                      onCopyCode={(code) => {
                        navigator.clipboard.writeText(code);
                        toast({ title: "Copied", description: "Code copied to clipboard" });
                      }}
                      onUpdateStatus={(status) => handleUpdateStatus(order.id, status)}
                      isUpdating={isUpdatingStatus}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} ({totalOrders} orders)
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
                        <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                        Next <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs - Kept functionally same but ensures they render at root level correctly */}
      {/* Pickup Location Dialog */}
      <AlertDialog open={isPickupLocationDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen && !isTransitioningToDelivery.current) {
          setOrderToProcess(null);
        }
        setIsPickupLocationDialogOpen(isOpen);
        if (!isOpen) isTransitioningToDelivery.current = false; // Reset after close
      }}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><PackageSearch className="h-6 w-6 text-primary" /> Set Pickup Location</AlertDialogTitle>
            <AlertDialogDescription>Confirm the pickup location before proceeding to delivery options.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pickupAddress">Pickup Address</Label>
              <Input id="pickupAddress" value={pickupLocationInfo.address} onChange={(e) => setPickupLocationInfo(prev => ({ ...prev, address: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="savedLocation">Use Saved Location</Label>
              <Select onValueChange={(value) => {
                if (value === selectedStore?.location) {
                  const coords = selectedStore.pickup_latitude && selectedStore.pickup_longitude
                    ? { lat: selectedStore.pickup_latitude, lng: selectedStore.pickup_longitude }
                    : null;
                  setPickupLocationInfo({ address: value, coords });
                }
              }} defaultValue={selectedStore?.location || ""}>
                <SelectTrigger id="savedLocation">
                  <SelectValue placeholder="Select a saved location..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedStore?.location && <SelectItem value={selectedStore.location}><Building className="inline-block mr-2 h-4 w-4" />{selectedStore.location}</SelectItem>}
                  <SelectItem value="new" disabled>Add new location (TBD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <Button variant="outline" className="w-full" type="button" onClick={handleUseCurrentLocation} disabled={isFetchingLocation}>
              <LocateFixed className="mr-2 h-4 w-4" /> {isFetchingLocation ? "Fetching..." : "Use Current GPS Location"}
            </Button>
            <div className="space-y-2">
              <Label htmlFor="pickupCoords">Coordinates (Lat, Lng)</Label>
              <Input id="pickupCoords" value={pickupLocationInfo.coords ? `${pickupLocationInfo.coords.lat}, ${pickupLocationInfo.coords.lng}` : ""}
                onChange={(e) => {
                  const [lat, lng] = e.target.value.split(',').map(s => parseFloat(s.trim()));
                  if (!isNaN(lat) && !isNaN(lng)) {
                    setPickupLocationInfo(prev => ({ ...prev, coords: { lat, lng } }));
                  } else {
                    setPickupLocationInfo(prev => ({ ...prev, coords: null }));
                  }
                }}
                placeholder="e.g., -15.4167, 28.2833"
              />
            </div>
            {pickupLocationInfo.coords && (
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">Map Links</p>
                <p className="text-xs text-muted-foreground">Click to open, or copy coordinates and paste into your map app.</p>
                <div className="flex items-center gap-2">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${pickupLocationInfo.coords.lat},${pickupLocationInfo.coords.lng}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><LinkIcon className="h-3 w-3" />Google Maps</a>
                  <span>|</span>
                  <a href={`http://maps.apple.com/?q=${pickupLocationInfo.coords.lat},${pickupLocationInfo.coords.lng}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><LinkIcon className="h-3 w-3" />Apple Maps</a>
                  <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" type="button" onClick={() => {
                    navigator.clipboard.writeText(`${pickupLocationInfo.coords?.lat}, ${pickupLocationInfo.coords?.lng}`);
                    toast({ title: "Copied to clipboard" });
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              isTransitioningToDelivery.current = true;
              setIsPickupLocationDialogOpen(false);
              setIsDeliveryDialogOpen(true);
            }}>Confirm &amp; Proceed</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delivery Method Dialog */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) { setOrderToProcess(null); } setIsDeliveryDialogOpen(isOpen); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Check className="h-6 w-6 text-green-500" />Order Confirmed: #{orderToProcess?.id.substring(0, 8)}...</DialogTitle>
            <DialogDescription>
              All items are in stock. Please select a delivery method to move this order to "Confirmed".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleConfirmDelivery('self_delivery')} disabled={isConfirmingDelivery}>
              {isConfirmingDelivery ? "Confirming..." : "Self-Delivery"}
            </Button>
            <Button onClick={() => handleConfirmDelivery('courier')} disabled={isConfirmingDelivery}>
              {isConfirmingDelivery ? "Confirming..." : "Request Courier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Out of Stock Dialog */}
      <AlertDialog open={isOutOfStockDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) { setOrderToProcess(null); setIsOutOfStockDialogOpen(false); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-yellow-500" />Items Out of Stock</AlertDialogTitle>
            <AlertDialogDescription>
              One or more items in order #{orderToProcess?.id.substring(0, 8)}... are out of stock. Please review the order to make adjustments before confirming.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setOrderToProcess(null); setIsOutOfStockDialogOpen(false); }}>Close</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link href={`/orders/${orderToProcess?.id}?${searchParams.toString()}`}>View Order Details</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

