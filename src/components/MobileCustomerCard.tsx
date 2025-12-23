"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, MapPin, DollarSign, ShoppingBag, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import type { Customer as CustomerUIType } from "@/lib/types";

interface MobileCustomerCardProps {
    customer: CustomerUIType;
    onEdit: (customer: CustomerUIType) => void;
    onDelete: (customerId: string) => void;
    onView: (customer: CustomerUIType) => void;
}

export function MobileCustomerCard({ customer, onEdit, onDelete, onView }: MobileCustomerCardProps) {
    return (
        <Card className="mb-4 overflow-hidden border-l-4 shadow-sm border-l-blue-500">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
                            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="font-semibold text-sm">{customer.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-muted/30 p-2 rounded">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider block mb-1">Total Spent</span>
                        <span className="text-sm font-bold flex items-center text-emerald-600">
                            <DollarSign className="h-3 w-3 mr-0.5" />
                            {customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider block mb-1">Orders</span>
                        <span className="text-sm font-bold flex items-center">
                            <ShoppingBag className="h-3 w-3 mr-1" />
                            {customer.totalOrders}
                        </span>
                    </div>
                </div>

                {customer.location && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-3 bg-muted/20 p-2 rounded">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{customer.location}</span>
                    </div>
                )}

                <div className="flex justify-end gap-2 border-t pt-3 mt-1">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onView(customer)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onEdit(customer)}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(customer.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
