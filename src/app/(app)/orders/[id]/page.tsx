
"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import NextImage from "next/image"; // Aliased to avoid conflict
import Link from "next/link";
import type { Order as OrderUIType, OrderStatus as OrderStatusUIType } from "@/lib/mockData"; // UI types
import { orderStatusColors, orderStatusIcons } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Printer, MapPin, User, CalendarDays, CreditCard, Truck as ShippingTruckIcon, DollarSign, AlertCircle, LocateFixed, Bike, Package, PackageSearch, Link as LinkIcon, Copy, ClipboardList, Phone, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { getOrderById, updateOrderStatus, type OrderFromSupabase, type OrderStatus as OrderStatusFromSupabase } from "@/services/orderService";
import { createClient } from '@/lib/supabase/client';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const mapOrderFromSupabaseToUI = (order: OrderFromSupabase): OrderUIType => {
  return {
    id: order.id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customers?.phone || undefined, // Extract phone from nested customer
    date: new Date(order.order_date).toISOString().split("T")[0],
    total: order.total_amount,
    status: order.status as OrderStatusUIType,
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
    deliveryType: order.delivery_type || undefined,
    pickupAddress: order.pickup_address || undefined,
    pickupLatitude: order.pickup_latitude || undefined,
    pickupLongitude: order.pickup_longitude || undefined,
    customerSpecification: order.customer_specification || undefined,
    deliveryCost: order.delivery_cost ?? undefined,
  };
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParamsHook = useSearchParams(); 
  const { toast } = useToast();
  
  const orderId = params.id as string;
  const storeId = searchParamsHook.get("storeId");

  const [order, setOrder] = React.useState<OrderUIType | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = React.useState(true);
  const [errorLoadingOrder, setErrorLoadingOrder] = React.useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [isUpdatingDeliveryType, setIsUpdatingDeliveryType] = React.useState(false);

  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [supabase]);

  React.useEffect(() => {
    const fetchOrderDetails = async () => {
      if (orderId && storeId && authUser) {
        setIsLoadingOrder(true);
        setErrorLoadingOrder(null);
        try {
          const { data: fetchedOrderData, error } = await getOrderById(orderId, storeId);
          if (error) {
            throw error;
          }
          if (fetchedOrderData) {
            setOrder(mapOrderFromSupabaseToUI(fetchedOrderData));
          } else {
            setErrorLoadingOrder("Order not found or you do not have access.");
            setOrder(null);
          }
        } catch (err: any) {
          console.error("Error fetching order details:", err);
          setErrorLoadingOrder(err.message || "Failed to fetch order details.");
          toast({ variant: "destructive", title: "Error", description: err.message || "Could not fetch order details." });
          setOrder(null);
        } finally {
          setIsLoadingOrder(false);
        }
      } else if (!storeId && authUser) {
        setErrorLoadingOrder("Store ID is missing. Cannot fetch order details.");
        setIsLoadingOrder(false);
      } else if (!authUser) {
        setErrorLoadingOrder("You must be signed in to view order details.");
        setIsLoadingOrder(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, storeId, authUser, toast]);

  const handleUpdateStatus = async (newStatus: OrderStatusUIType) => {
    if (!order || !storeId || !authUser) {
        toast({variant: "destructive", title: "Cannot update status", description: "Order details, store ID or user information is missing."})
        return;
    }
    setIsUpdatingStatus(true);
    try {
      const { data: updatedOrderData, error } = await updateOrderStatus(order.id, storeId, newStatus as OrderStatusFromSupabase);
      if (error) {
        throw error;
      }
      if (updatedOrderData) {
        setOrder(mapOrderFromSupabaseToUI(updatedOrderData));
        toast({ title: "Order Status Updated", description: `Order ${order.id} status changed to ${newStatus}.` });
      }
    } catch (err: any) {
      console.error("Error updating order status:", err);
      toast({ variant: "destructive", title: "Error Updating Status", description: err.message || "Could not update order status." });
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  const handleDeliveryTypeChange = async (newDeliveryType: 'courier' | 'self_delivery') => {
    if (!order || !storeId || !authUser || order.deliveryType === newDeliveryType) {
        return;
    }
    setIsUpdatingDeliveryType(true);
    try {
        const { data: updatedOrderData, error } = await updateOrderStatus(order.id, storeId, order.status as OrderStatusFromSupabase, {
            deliveryType: newDeliveryType
        });
        if (error) {
            throw error;
        }
        if (updatedOrderData) {
            setOrder(mapOrderFromSupabaseToUI(updatedOrderData));
            toast({ title: "Delivery Type Updated", description: `Delivery type set to ${newDeliveryType === 'courier' ? 'Courier' : 'Self Delivery'}.` });
        }
    } catch (err: any) {
        console.error("Error updating delivery type:", err);
        toast({ variant: "destructive", title: "Update Failed", description: err.message || "Could not update delivery type." });
    } finally {
        setIsUpdatingDeliveryType(false);
    }
  };

  if (isLoadingOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-36" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-1/3 mt-2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Separator/>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (errorLoadingOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Order</h2>
        <p className="text-muted-foreground mb-6">{errorLoadingOrder}</p>
        <Button variant="outline" onClick={() => router.push(`/orders?${searchParamsHook.toString()}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders List
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Order not found or you do not have access.</p>
      </div>
    );
  }

  const CurrentStatusIcon = orderStatusIcons[order.status];
  const subtotal = order.detailedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = order.deliveryCost || 0;
  const tax = 0; // Tax is currently not implemented

  const canChangeDeliveryType = !['Delivered', 'Cancelled'].includes(order.status) && !!order.deliveryType;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(`/orders?${searchParamsHook.toString()}`)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast({title: "Label Printed", description: `Shipping label for ${order.id} sent to printer.`})}>
            <Printer className="mr-2 h-4 w-4" /> Print Shipping Label
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isUpdatingStatus}>
                <Edit className="mr-2 h-4 w-4" /> {isUpdatingStatus ? "Updating..." : "Update Status"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Change Order Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(orderStatusIcons) as OrderStatusUIType[]).map(status => (
                order.status !== status && (
                  <DropdownMenuItem key={status} onClick={() => handleUpdateStatus(status)} disabled={isUpdatingStatus}>
                    Mark as {status}
                  </DropdownMenuItem>
                )
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl">Order #{order.id.substring(0,8)}...</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <CalendarDays className="h-4 w-4 text-muted-foreground" /> 
                {new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </div>
            <Badge variant="outline" className={cn(orderStatusColors[order.status], "text-base px-4 py-2 flex items-center gap-2")}>
              <CurrentStatusIcon className="h-5 w-5" />
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="space-y-1">
              <h4 className="font-semibold flex items-center"><User className="mr-2 h-5 w-5 text-primary" /> Customer</h4>
              <p>{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              {order.customerPhone && (
                 <Button asChild variant="outline" size="sm" className="mt-2">
                    <a href={`tel:${order.customerPhone}`}>
                        <Phone className="mr-2 h-4 w-4"/> Call Customer
                    </a>
                </Button>
              )}
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary" /> Payment</h4>
              <p className="text-sm">{order.paymentMethod || "Not specified"}</p>
              <p className="text-sm font-semibold flex items-center"><DollarSign className="mr-1 h-4 w-4 text-primary" /> Total: ZMW {order.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Order Items ({order.itemsCount})</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU/ID</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.detailedItems.map((item, index) => (
                <TableRow key={`${item.productId}-${index}`}>
                  <TableCell className="hidden sm:table-cell">
                    <NextImage
                      src={item.image}
                      alt={item.name}
                      width={50}
                      height={50}
                      className="rounded-md object-cover"
                      data-ai-hint={item.dataAiHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                     <Link href={`/products/${item.productId}?${searchParamsHook.toString()}`} className="hover:text-primary hover:underline">
                        {item.name}
                     </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.productId}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">ZMW {item.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                  <TableCell className="text-right">ZMW {(item.quantity * item.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-4">
             <div className="w-full sm:w-1/3 space-y-2">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>ZMW {subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>ZMW {shippingCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>ZMW {tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <Separator />
                 <div className="flex justify-between font-bold text-lg">
                    <span>Order Total:</span>
                    <span>ZMW {order.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2"><ShippingTruckIcon className="h-6 w-6 text-primary"/> Delivery</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h4 className="font-semibold flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary" /> Shipping Address</h4>
                        <p className="text-sm whitespace-pre-line">{order.shippingAddress}</p>
                        {order.shippingLatitude && order.shippingLongitude && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <LocateFixed className="h-3 w-3" /> 
                            Lat: {order.shippingLatitude.toFixed(4)}, Lng: {order.shippingLongitude.toFixed(4)}
                            </p>
                        )}
                    </div>
                    {order.pickupAddress && (
                        <div className="space-y-1">
                            <h4 className="font-semibold flex items-center"><PackageSearch className="mr-2 h-5 w-5 text-primary" /> Pickup Location</h4>
                            <p className="text-sm whitespace-pre-line">{order.pickupAddress}</p>
                            {order.pickupLatitude && order.pickupLongitude && (
                                <div className="flex items-center gap-2 pt-1">
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${order.pickupLatitude},${order.pickupLongitude}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><LinkIcon className="h-3 w-3"/>Google Maps</a>
                                    <span className="text-xs text-muted-foreground">|</span>
                                    <a href={`http://maps.apple.com/?q=${order.pickupLatitude},${order.pickupLongitude}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><LinkIcon className="h-3 w-3"/>Apple Maps</a>
                                    <Button size="icon" variant="ghost" className="h-5 w-5 ml-auto" onClick={() => {
                                        navigator.clipboard.writeText(`${order.pickupLatitude}, ${order.pickupLongitude}`);
                                        toast({title: "Copied coordinates to clipboard"});
                                    }}>
                                        <Copy className="h-3 w-3"/>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <p className="font-medium">Delivery Type:</p>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={!canChangeDeliveryType || isUpdatingDeliveryType}>
                                    {isUpdatingDeliveryType ? "Updating..." : (order.deliveryType ? (order.deliveryType === 'courier' ? 'Courier' : 'Self Delivery') : "Not Set")}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Change Delivery Type</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={order.deliveryType || ""} onValueChange={(value) => handleDeliveryTypeChange(value as 'courier' | 'self_delivery')}>
                                    <DropdownMenuRadioItem value="courier">Courier</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="self_delivery">Self Delivery</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {order.shippingMethod && <p className="text-sm">Method: {order.shippingMethod}</p>}
                    {order.trackingNumber && <p className="text-sm">Tracking #: <span className="font-mono text-primary">{order.trackingNumber}</span></p>}
                </div>
            </div>
        </CardContent>
      </Card>
      
      {order.customerSpecification && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary"/> Customer Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {order.customerSpecification}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Add internal notes about this order..." rows={3}/>
          <Button className="mt-3">Add Note</Button>
          <Separator className="my-4"/>
          <p className="text-muted-foreground text-sm">No notes added yet. Timeline of order events will also be displayed here in the future.</p>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground border-t pt-4">
          Order ID: {order.id}
        </CardFooter>
      </Card>
    </div>
  );
}
