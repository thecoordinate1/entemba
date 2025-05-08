
"use client";

import * as React from "react";
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
import { MoreHorizontal, Search, Filter, PackageCheck, Printer, Truck, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: number;
}

const initialOrders: Order[] = [
  {
    id: "ORD001",
    customerName: "Alice Wonderland",
    customerEmail: "alice@example.com",
    date: "2023-05-01",
    total: 125.50,
    status: "Delivered",
    items: 3,
  },
  {
    id: "ORD002",
    customerName: "Bob The Builder",
    customerEmail: "bob@example.com",
    date: "2023-05-03",
    total: 75.20,
    status: "Shipped",
    items: 1,
  },
  {
    id: "ORD003",
    customerName: "Charlie Brown",
    customerEmail: "charlie@example.com",
    date: "2023-05-05",
    total: 210.00,
    status: "Processing",
    items: 5,
  },
  {
    id: "ORD004",
    customerName: "Diana Prince",
    customerEmail: "diana@example.com",
    date: "2023-05-06",
    total: 45.99,
    status: "Pending",
    items: 2,
  },
  {
    id: "ORD005",
    customerName: "Edward Scissorhands",
    customerEmail: "edward@example.com",
    date: "2023-05-02",
    total: 99.00,
    status: "Cancelled",
    items: 1,
  },
];

const statusColors: Record<OrderStatus, string> = {
  Pending: "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-400 border-yellow-500/30",
  Processing: "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-400 border-blue-500/30",
  Shipped: "bg-purple-500/20 text-purple-700 dark:bg-purple-500/30 dark:text-purple-400 border-purple-500/30",
  Delivered: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30",
  Cancelled: "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-400 border-red-500/30",
};

const statusIcons: Record<OrderStatus, React.ElementType> = {
  Pending: RefreshCw,
  Processing: PackageCheck,
  Shipped: Truck,
  Delivered: CheckCircle,
  Cancelled: XCircle,
};


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
                        <DropdownMenuItem>View Order Details</DropdownMenuItem>
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
