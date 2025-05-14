
"use client";

import type { Order, OrderItem, OrderStatus, Store } from "@/lib/mockData";
import { initialOrders, initialProducts, orderStatusColors, orderStatusIcons, initialStores } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { DollarSign, Eye, Filter, MoreHorizontal, PlusCircle, Printer, Search, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useSearchParams } from "next/navigation";


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
  status: "Pending" as OrderStatus,
};


export default function OrdersPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const [selectedStoreName, setSelectedStoreName] = React.useState<string | null>(null);

  const [orders, setOrders] = React.useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "All">("All");
  const { toast } = useToast();

  const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = React.useState(false);
  const [newOrderData, setNewOrderData] = React.useState(defaultNewOrderData);
  const [newOrderItems, setNewOrderItems] = React.useState<NewOrderItemEntry[]>([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = React.useState<string>("");
  const [quantityToAdd, setQuantityToAdd] = React.useState<number>(1);

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
    // In a real app, orders would be fetched based on storeId here
  }, [storeId]);


  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    const orderIndex = initialOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      initialOrders[orderIndex].status = newStatus;
    }
    toast({ title: "Order Status Updated", description: `Order ${orderId} status changed to ${newStatus}.` });
  };

  const filteredOrders = orders.filter(order => {
    // In a real app, orders would already be filtered by storeId from the backend
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


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
    const product = initialProducts.find(p => p.id === selectedProductIdToAdd);
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
          productImage: product.images[0] || "https://picsum.photos/50/50?grayscale",
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


  const handleCreateOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newOrderItems.length === 0) {
      toast({ title: "No Items", description: "Please add at least one product to the order.", variant: "destructive" });
      return;
    }

    const finalOrderItems: OrderItem[] = newOrderItems.map(item => ({
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      price: item.unitPrice,
      image: item.productImage,
      dataAiHint: item.productDataAiHint,
    }));

    const newOrder: Order = {
      id: `ORD_${Date.now()}`,
      // storeId: storeId || initialStores[0]?.id || "default_store", // Associate with selected store
      ...newOrderData,
      date: new Date().toISOString().split("T")[0],
      total: calculateNewOrderTotal,
      itemsCount: newOrderItems.reduce((sum, item) => sum + item.quantity, 0),
      detailedItems: finalOrderItems,
      billingAddress: newOrderData.billingAddress || newOrderData.shippingAddress,
    };

    initialOrders.unshift(newOrder); 
    setOrders([newOrder, ...orders]); 
    setIsAddOrderDialogOpen(false);
    toast({ title: "Order Created", description: `Order ${newOrder.id} has been successfully created for ${selectedStoreName || 'the current store'}.` });
    resetAddOrderForm();
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
              {(Object.keys(orderStatusIcons) as OrderStatus[]).map(status => (
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
        <Dialog open={isAddOrderDialogOpen} onOpenChange={(isOpen) => { setIsAddOrderDialogOpen(isOpen); if (!isOpen) resetAddOrderForm(); }}>
          <DialogTrigger asChild>
            <Button>
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
                            <Label htmlFor="shippingMethod">Shipping Method</Label>
                            <Input id="shippingMethod" name="shippingMethod" value={newOrderData.shippingMethod} onChange={handleNewOrderInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="paymentMethod">Payment Method</Label>
                            <Input id="paymentMethod" name="paymentMethod" value={newOrderData.paymentMethod} onChange={handleNewOrderInputChange} />
                        </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <h4 className="font-medium text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary"/>Order Items</h4>
                      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 items-end p-3 border rounded-md">
                        <div className="grid gap-1.5">
                          <Label htmlFor="productToAdd">Select Product</Label>
                          <Select value={selectedProductIdToAdd} onValueChange={setSelectedProductIdToAdd}>
                            <SelectTrigger id="productToAdd">
                              <SelectValue placeholder="Choose a product..." />
                            </SelectTrigger>
                            <SelectContent>
                              {initialProducts.filter(p => p.status === 'Active').map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} (${product.orderPrice !== undefined ? product.orderPrice.toFixed(2) : product.price.toFixed(2)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="quantityToAdd">Quantity</Label>
                          <Input id="quantityToAdd" type="number" min="1" value={quantityToAdd} onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)} />
                        </div>
                        <Button type="button" onClick={handleAddProductToOrder} className="self-end">Add Item</Button>
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
                                  <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">${(item.unitPrice * item.quantity).toFixed(2)}</TableCell>
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
                                <DollarSign className="h-5 w-5 mr-1 text-primary"/> {calculateNewOrderTotal.toFixed(2)}
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
                <Button type="button" variant="outline" onClick={() => setIsAddOrderDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Order</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {selectedStoreName && <p className="text-sm text-muted-foreground">Showing orders for store: <span className="font-semibold">{selectedStoreName}</span>. New orders will be added to this store.</p>}


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
              const Icon = orderStatusIcons[order.status];
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
                          <Link href={`/orders/${order.id}`}>
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
      </Card>
       {filteredOrders.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          No orders found matching your criteria.
        </div>
      )}
    </div>
  );
}
