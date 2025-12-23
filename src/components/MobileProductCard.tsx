"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Package, Tag, Archive } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Product as ProductUIType } from "@/lib/types";

interface MobileProductCardProps {
    product: ProductUIType;
    onEdit: (product: ProductUIType) => void;
    onDelete: (productId: string) => void;
    isDeleting: boolean;
}

export function MobileProductCard({ product, onEdit, onDelete, isDeleting }: MobileProductCardProps) {

    return (
        <Card className="mb-4 overflow-hidden border-l-4 shadow-sm border-l-primary">
            <CardContent className="p-4">
                <div className="flex gap-4">
                    {/* Image */}
                    <div className="shrink-0">
                        {product.image ? (
                            <div className="relative h-20 w-20 rounded-lg overflow-hidden border bg-muted">
                                <Image src={product.image} alt={product.name} fill className="object-cover" sizes="80px" />
                            </div>
                        ) : (
                            <div className="h-20 w-20 rounded-lg border bg-muted flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-sm truncate pr-2">{product.name}</h4>
                                <Badge variant={product.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-5">
                                    {product.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Tag className="h-3 w-3" />
                                <span>{product.category}</span>
                            </div>
                        </div>

                        <div className="flex items-end justify-between mt-2">
                            <div>
                                <span className="text-sm font-bold block">ZMW {product.price.toLocaleString()}</span>
                                <span className={cn("text-[10px]", product.stock < 10 ? "text-red-500 font-medium" : "text-muted-foreground")}>
                                    {product.stock} in stock
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(product)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(product.id)} disabled={isDeleting}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
