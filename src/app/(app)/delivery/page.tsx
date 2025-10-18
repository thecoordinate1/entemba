
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Phone, 
  Copy, 
  Link as LinkIcon, 
  AlertCircle,
  Package,
  User,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import type { User as AuthUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getSelfDeliveryOrdersForStore, updateOrderStatus, type OrderFromSupabase } from "@/services/orderService";
import type { Order as OrderUIType, OrderStatus } from "@/lib/types";
import { mapOrderFromSupabaseToUI } from "@/lib/order-mapper";
import { Badge } from "@/components/ui/badge";
import { orderStatusColors, orderStatusIcons } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const deliveryStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  Confirmed: ["Driver Picking Up", "Delivering"],
  "Driver Picking Up": ["Delivering"],
  Delivering: ["Delivered"],
  Pending: [],
  Delivered: [],
  Cancelled: [],
};

const DELIVERY_TIER_MINIMUMS = {
    Standard: 10,
    Economy: 25,
};


const DeliveryOrderCard: React.FC<{ order: OrderUIType, onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void; isUpdating: boolean }> = ({ order, onStatusUpdate, isUpdating }) => {
  const { toast } = useToast();
  const StatusIcon = orderStatusIcons[order.status];
  const possibleNextStatuses = deliveryStatusTransitions[order.status] || [];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {order.customerName}
              </CardTitle>
              <CardDescription>Order #{order.id.substring(0, 8)}...</CardDescription>
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isUpdating || possibleNextStatuses.length === 0}>
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {possibleNextStatuses.map(status => (
                  <DropdownMenuItem key={status} onClick={() => onStatusUpdate(order.id, status)}>
                    Mark as {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="pt-2 flex items-center gap-2">
             <Badge variant="outline" className={cn(orderStatusColors[order.status], "flex items-center gap-1.5 w-fit")}>
                <StatusIcon className="h-4 w-4" />
                {order.status}
            </Badge>
            {order.shippingMethod && (
                <Badge variant="secondary">{order.shippingMethod}</Badge>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-1"><MapPin className="h-4 w-4 text-muted-foreground"/>Shipping Address</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.shippingAddress}</p>
        </div>
        {order.customerPhone && (
            <div>
                 <h4 className="font-semibold flex items-center gap-2 mb-1"><Phone className="h-4 w-4 text-muted-foreground"/>Contact</h4>
                <a href={`tel:${order.customerPhone}`} className="text-sm text-primary hover:underline">{order.customerPhone}</a>
            </div>
        )}
        <Separator />
        <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2"><Package className="h-4 w-4 text-muted-foreground"/>Items ({order.itemsCount})</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                {order.detailedItems.map(item => (
                    <li key={item.productId}>{item.quantity} x {item.name}</li>
                ))}
            </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 bg-muted/50 p-3">
          {order.shippingLatitude && order.shippingLongitude && (
            <>
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${order.shippingLatitude},${order.shippingLongitude}`} target="_blank" rel="noopener noreferrer"><LinkIcon className="mr-2 h-4 w-4"/>Google Maps</a>
                </Button>
                 <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <a href={`http://maps.apple.com/?q=${order.shippingLatitude},${order.shippingLongitude}`} target="_blank" rel="noopener noreferrer"><LinkIcon className="mr-2 h-4 w-4"/>Apple Maps</a>
                </Button>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => {
                    navigator.clipboard.writeText(`${order.shippingLatitude}, ${order.shippingLongitude}`);
                    toast({ title: "Copied Coordinates" });
                }}>
                    <Copy className="mr-2 h-4 w-4"/>Copy Coords
                </Button>
            </>
          )}
      </CardFooter>
    </Card>
  );
};


export default function DeliveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const { toast } = useToast();
  
  const [allOrders, setAllOrders] = React.useState<OrderUIType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState<string | null>(null); // Store orderId being updated

  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [supabase]);

  const fetchDeliveryOrders = React.useCallback(async () => {
    if (!storeId || !authUser) {
      setError("Please select a store to view delivery orders.");
      setIsLoading(false);
      setAllOrders([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await getSelfDeliveryOrdersForStore(storeId);
    if (fetchError) {
      setError(fetchError.message);
      toast({ variant: "destructive", title: "Failed to load orders", description: fetchError.message });
      setAllOrders([]);
    } else {
      setAllOrders(data?.map(mapOrderFromSupabaseToUI) || []);
    }
    setIsLoading(false);
  }, [storeId, authUser, toast]);

  React.useEffect(() => {
    fetchDeliveryOrders();
  }, [fetchDeliveryOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    if (!storeId) return;
    setIsUpdatingStatus(orderId);
    const { data: updatedOrder, error: updateError } = await updateOrderStatus(orderId, storeId, newStatus);
    if (updateError) {
        toast({ variant: "destructive", title: "Update Failed", description: updateError.message });
    } else {
        toast({ title: "Status Updated", description: `Order status changed to ${newStatus}.` });
        // Optimistically update or refetch
        if(newStatus === 'Delivered') {
            setAllOrders(prev => prev.filter(o => o.id !== orderId));
        } else {
            setAllOrders(prev => prev.map(o => o.id === orderId ? mapOrderFromSupabaseToUI(updatedOrder!) : o));
        }
    }
    setIsUpdatingStatus(null);
  };
  
  const confirmedOrders = allOrders.filter(o => o.status === 'Confirmed');
  const activeDeliveryOrders = allOrders.filter(o => o.status !== 'Confirmed');

  const standardOrders = confirmedOrders.filter(o => o.shippingMethod === 'Standard');
  const economyOrders = confirmedOrders.filter(o => o.shippingMethod === 'Economy');

  const standardProgress = Math.min((standardOrders.length / DELIVERY_TIER_MINIMUMS.Standard) * 100, 100);
  const economyProgress = Math.min((economyOrders.length / DELIVERY_TIER_MINIMUMS.Economy) * 100, 100);

  const queryParams = storeId ? `?storeId=${storeId}` : '';


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Truck className="h-7 w-7"/>Self-Delivery Management</h1>
        <Button variant="outline" onClick={() => router.push(`/orders${queryParams}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Orders
        </Button>
      </div>

       <div className="grid md:grid-cols-2 gap-6">
            <Link href={`/delivery/standard${queryParams}`} className="group">
                <Card className="hover:border-primary transition-colors">
                    <CardHeader>
                        <CardTitle>Standard Delivery Queue</CardTitle>
                        <CardDescription>Orders waiting for standard delivery batch (2-4 days).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-muted-foreground">Orders in Queue</span>
                            <span className="font-bold">{standardOrders.length} / {DELIVERY_TIER_MINIMUMS.Standard}</span>
                        </div>
                        <Progress value={standardProgress} />
                    </CardContent>
                    <CardFooter className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                        View Queue <ChevronRight className="ml-1 h-4 w-4" />
                    </CardFooter>
                </Card>
            </Link>
             <Link href={`/delivery/economy${queryParams}`} className="group">
                <Card className="hover:border-primary transition-colors">
                    <CardHeader>
                        <CardTitle>Economy Delivery Queue</CardTitle>
                        <CardDescription>Orders waiting for economy delivery batch (4-7 days).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-muted-foreground">Orders in Queue</span>
                            <span className="font-bold">{economyOrders.length} / {DELIVERY_TIER_MINIMUMS.Economy}</span>
                        </div>
                        <Progress value={economyProgress} />
                    </CardContent>
                    <CardFooter className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                        View Queue <ChevronRight className="ml-1 h-4 w-4" />
                    </CardFooter>
                </Card>
            </Link>
        </div>


      <Card>
        <CardHeader>
          <CardTitle>Active Deliveries</CardTitle>
          <CardDescription>
            This page shows Express orders and other orders that are actively in the delivery process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8" />
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && activeDeliveryOrders.length === 0 && (
             <div className="text-center py-10 text-muted-foreground">
                <p>There are no active delivery orders.</p>
            </div>
          )}

          {!isLoading && !error && activeDeliveryOrders.length > 0 && (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeDeliveryOrders.map(order => (
                    <DeliveryOrderCard 
                        key={order.id} 
                        order={order} 
                        onStatusUpdate={handleStatusUpdate}
                        isUpdating={isUpdatingStatus === order.id}
                    />
                ))}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
