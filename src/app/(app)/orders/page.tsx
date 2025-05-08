
"use client";

import * as React from "react";
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
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Search, Filter, PackageCheck, Printer, Truck, CheckCircle, XCircle, RefreshCw, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderStatus } from "@/lib/mockData";
import { initialOrders, statusColors, statusIcons } from "@/lib/mockData";

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "All">("All");
  const { toast } = useToast();

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    toast({ title: "Order Status Updated", description: `Order ${orderId} status changed to ${newStatus}.` });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> 
                {statusFilter === "All" ? "Filter Status" : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter === "All"}
                onCheckedChange={() => setStatusFilter("All")}
              >
                All
              </DropdownMenuCheckboxItem>
              {(Object.keys(statusIcons) as OrderStatus[]).map(status => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={() => setStatusFilter(status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Add New Order Button can be added here if needed */}
      </div>

      <Card>
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
              const Icon = statusIcons[order.status];
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div>{order.customerName}</div>
                    <div className="text-xs text-muted-foreground hidden sm:block">{order.customerEmail}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell className="hidden md:table-cell text-right">${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusColors[order.status]} flex items-center gap-1.5 whitespace-nowrap`}>
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
                          <Link href={`/orders/${order.id}`}>
                             <Eye className="mr-2 h-4 w-4" /> View Order Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast({title: "Label Printed", description: `Shipping label for ${order.id} sent to printer.`})}>
                          <Printer className="mr-2 h-4 w-4" /> Print Shipping Label
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        {(Object.keys(statusIcons) as OrderStatus[]).map(status => (
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
      </Card>
       {filteredOrders.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          No orders found matching your criteria.
        </div>
      )}
    </div>
  );
}

    