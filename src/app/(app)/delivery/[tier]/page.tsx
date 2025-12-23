
"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Truck } from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getConfirmedOrdersByDeliveryTier } from "@/services/orderService";
import type { Order as OrderUIType } from "@/lib/types";
import { mapOrderFromSupabaseToUI } from "@/lib/order-mapper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { orderStatusColors, orderStatusIcons } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DeliveryQueuePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const { toast } = useToast();

  const tier = params.tier as 'standard' | 'economy';
  const shippingMethod = tier === 'standard' ? 'Standard' : 'Economy';

  const [orders, setOrders] = React.useState<OrderUIType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [supabase]);

  React.useEffect(() => {
    const fetchQueueOrders = async () => {
      if (!storeId || !authUser) {
        setError("Please select a store to view delivery queues.");
        setIsLoading(false);
        setOrders([]);
        return;
      }
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await getConfirmedOrdersByDeliveryTier(storeId, shippingMethod);
      if (fetchError) {
        setError(fetchError.message);
        toast({ variant: "destructive", title: "Failed to load queue", description: fetchError.message });
        setOrders([]);
      } else {
        setOrders(data?.map(mapOrderFromSupabaseToUI) || []);
      }
      setIsLoading(false);
    };

    fetchQueueOrders();
  }, [storeId, authUser, shippingMethod, toast]);

  const queryParams = storeId ? `?storeId=${storeId}` : '';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2 capitalize">
          <Truck className="h-7 w-7" />{tier} Delivery Queue
        </h1>
        <Button variant="outline" onClick={() => router.push(`/delivery${queryParams}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Delivery Management
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders in Queue</CardTitle>
          <CardDescription>
            These orders are confirmed and waiting to be dispatched for {tier} delivery. Oldest orders are at the top.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={`skel-queue-row-${i}`} className="h-14 w-full" />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8" />
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && orders.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p>There are no orders in the {tier} delivery queue.</p>
            </div>
          )}

          {!isLoading && !error && orders.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => {
                  const StatusIcon = orderStatusIcons[order.status];
                  return (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => router.push(`/orders/${order.id}${queryParams}`)}>
                      <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">{order.shippingAddress}</TableCell>
                      <TableCell className="text-right">{order.itemsCount}</TableCell>
                      <TableCell className="text-right">ZMW {order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(orderStatusColors[order.status], "flex items-center gap-1.5 w-fit mx-auto")}>
                          <StatusIcon className="h-4 w-4" />
                          {order.status}
                        </Badge>
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
  );
}
