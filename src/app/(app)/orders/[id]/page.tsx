
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { initialOrders, type Order, type OrderStatus, statusColors, statusIcons } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Printer, MapPin, User, CalendarDays, CreditCard, Truck as ShippingTruckIcon, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.id as string;

  const [order, setOrder] = React.useState<Order | null>(null);

  React.useEffect(() => {
    const foundOrder = initialOrders.find((o) => o.id === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
    } else {
      console.error("Order not found");
      // router.push('/orders'); 
    }
  }, [orderId, router]);

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!order) return;
    
    // Update order in our "global" state (initialOrders array) for demo purposes
    const orderIndex = initialOrders.findIndex(o => o.id === order.id);
    if (orderIndex !== -1) {
      initialOrders[orderIndex].status = newStatus;
    }
    setOrder({ ...order, status: newStatus }); // Update local state
    toast({ title: "Order Status Updated", description: `Order ${order.id} status changed to ${newStatus}.` });
  };


  if (!order) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading order details or order not found...</p>
      </div>
    );
  }

  const CurrentStatusIcon = statusIcons[order.status];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast({title: "Label Printed", description: `Shipping label for ${order.id} sent to printer.`})}>
            <Printer className="mr-2 h-4 w-4" /> Print Shipping Label
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" /> Update Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Change Order Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(statusIcons) as OrderStatus[]).map(status => (
                order.status !== status && (
                  <DropdownMenuItem key={status} onClick={() => handleUpdateStatus(status)}>
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
              <CardTitle className="text-2xl">Order {order.id}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <CalendarDays className="h-4 w-4 text-muted-foreground" /> 
                {new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </div>
            <Badge variant="outline" className={`${statusColors[order.status]} text-base px-4 py-2 flex items-center gap-2`}>
              <CurrentStatusIcon className="h-5 w-5" />
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-1">
              <h4 className="font-semibold flex items-center"><User className="mr-2 h-5 w-5 text-primary" /> Customer</h4>
              <p>{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary" /> Shipping Address</h4>
              <p className="text-sm whitespace-pre-line">{order.shippingAddress}</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary" /> Payment</h4>
              <p className="text-sm">{order.paymentMethod || "Not specified"}</p>
              <p className="text-sm font-semibold flex items-center"><DollarSign className="mr-1 h-4 w-4 text-primary" /> Total: ${order.total.toFixed(2)}</p>
            </div>
          </div>
          
          {order.shippingMethod && (
            <div className="mb-6 space-y-1">
                <h4 className="font-semibold flex items-center"><ShippingTruckIcon className="mr-2 h-5 w-5 text-primary" /> Shipping</h4>
                <p className="text-sm">Method: {order.shippingMethod}</p>
                {order.trackingNumber && <p className="text-sm">Tracking: <a href="#" className="text-primary hover:underline">{order.trackingNumber}</a></p>}
            </div>
          )}

          <Separator className="my-4" />
          <h3 className="text-xl font-semibold mb-3">Order Items ({order.itemsCount})</h3>
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
                <TableRow key={index}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={50}
                      height={50}
                      className="rounded-md object-cover"
                      data-ai-hint={item.dataAiHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                     <Link href={`/products/${item.productId}`} className="hover:text-primary hover:underline">
                        {item.name}
                     </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.productId}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-4">
             <div className="w-full sm:w-1/3 space-y-2">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${order.total.toFixed(2)}</span> {/* Assuming total includes everything for now */}
                </div>
                <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>$0.00</span> {/* Placeholder */}
                </div>
                 <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>$0.00</span> {/* Placeholder */}
                </div>
                <Separator />
                 <div className="flex justify-between font-bold text-lg">
                    <span>Order Total:</span>
                    <span>${order.total.toFixed(2)}</span>
                </div>
             </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground border-t pt-4">
          Order ID: {order.id}
        </CardFooter>
      </Card>

      {/* Placeholder for Order History / Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Order History & Notes (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Timeline of order events and internal notes will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    