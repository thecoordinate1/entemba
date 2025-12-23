"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, ChevronRight, Copy, DollarSign, MoreHorizontal, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Order as OrderUIType, OrderStatus } from "@/lib/types";
import { orderStatusColors, orderStatusIcons } from "@/lib/types";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface MobileOrderCardProps {
    order: OrderUIType;
    onCopyCode: (code: string) => void;
    onUpdateStatus: (status: OrderStatus) => void;
    isUpdating: boolean;
}

export function MobileOrderCard({ order, onCopyCode, onUpdateStatus, isUpdating }: MobileOrderCardProps) {
    const Icon = orderStatusIcons[order.status];

    return (
        <Card className="mb-4 overflow-hidden border-l-4 shadow-sm" style={{ borderLeftColor: orderStatusColors[order.status].split(' ')[0].replace('bg-', '') }}>
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${order.customerName}`} />
                            <AvatarFallback>{getInitials(order.customerName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="font-semibold text-sm">{order.customerName}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(order.date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/orders/${order.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            {(Object.keys(orderStatusIcons) as OrderStatus[]).map(status => (
                                order.status !== status && (
                                    <DropdownMenuItem key={status} onClick={() => onUpdateStatus(status)} disabled={isUpdating}>
                                        Mark as {status}
                                    </DropdownMenuItem>
                                )
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-muted/30 p-2 rounded flex flex-col justify-center">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Total</span>
                        <span className="text-sm font-bold flex items-center">
                            <DollarSign className="h-3 w-3 mr-0.5" />
                            {order.total.toLocaleString()}
                        </span>
                    </div>
                    <div className="bg-muted/30 p-2 rounded flex flex-col justify-center">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">ID</span>
                        <span className="text-xs font-mono truncate">#{order.id.slice(0, 8)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={cn("w-fit flex items-center gap-1", orderStatusColors[order.status])}>
                            <Icon className="h-3 w-3" />
                            {order.status}
                        </Badge>
                        {order.deliveryTier === 'Express' && (
                            <Badge variant="destructive" className="w-fit text-[10px] px-1 py-0 animate-pulse">
                                🚀 Express
                            </Badge>
                        )}
                    </div>

                    {order.deliveryCode && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCopyCode(order.deliveryCode!);
                            }}
                        >
                            {order.deliveryCode} <Copy className="ml-1 h-3 w-3" />
                        </Button>
                    )}

                    {!order.deliveryCode && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                            <Link href={`/orders/${order.id}`}>
                                Details <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
