"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import NextImage from "next/image"; // Renamed to avoid conflict with Image from lucide-react
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Star, Tag, Weight, Ruler, ShoppingCart, DollarSign, UploadCloud, Image as ImageIconLucide, Calculator, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Added DialogTrigger here
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import {
  getProductById,
  updateProduct,
  type ProductPayload,
  type ProductFromSupabase,
  type ProductImageFromSupabase,
} from "@/services/productService";
import { getCurrentVendorProfile } from "@/services/userService";
import type { Product as ProductUIType } from "@/lib/types";
import { calculateDeliveryCapacity, type CalculateCapacityOutput } from "@/ai/flows/calculate-delivery-capacity-flow";
import { ProductForm, type ProductFormValues } from "../components/product-form";

const MAX_IMAGES = 5;




// Helper to map backend product to UI product type
const mapProductFromSupabaseToUI = (product: ProductFromSupabase): ProductUIType & { raw: ProductFromSupabase } => {
  return {
    id: product.id,
    name: product.name,
    images: product.product_images.sort((a, b) => a.order - b.order).map(img => img.image_url),
    category: product.category,
    price: product.price,
    orderPrice: product.order_price ?? undefined,
    stock: product.stock,
    status: product.status as ProductUIType["status"],
    createdAt: new Date(product.created_at).toISOString().split("T")[0],
    description: product.description ?? undefined,
    fullDescription: product.full_description,
    sku: product.sku ?? undefined,
    tags: product.tags ?? undefined,
    weight: product.weight_kg ?? undefined,
    dimensions: product.dimensions_cm ? {
      length: product.dimensions_cm.length,
      width: product.dimensions_cm.width,
      height: product.dimensions_cm.height
    } : undefined,
    is_dropshippable: product.is_dropshippable,
    supplier_product_id: product.supplier_product_id,
    supplier_price: product.supplier_price,
    raw: product // Store raw data for form initialization
  };
};


export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const productId = params.id as string;
  const storeIdFromUrl = searchParams.get("storeId");

  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<User | null>(null);
  const [isSupplier, setIsSupplier] = React.useState(false);

  const [product, setProduct] = React.useState<(ProductUIType & { raw: ProductFromSupabase }) | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = React.useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // State for Edit Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  // Delivery Capacity State
  const [vehicleType, setVehicleType] = React.useState<'car' | 'bike'>('bike');
  const [capacityResult, setCapacityResult] = React.useState<CalculateCapacityOutput | null>(null);
  const [isCalculatingCapacity, setIsCalculatingCapacity] = React.useState(false);
  const [capacityError, setCapacityError] = React.useState<string | null>(null);




  React.useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setAuthUser(user);
      if (user) {
        const { profile } = await getCurrentVendorProfile(user.id);
        if (profile?.is_supplier) setIsSupplier(true);
      }
    });
  }, [supabase]);

  const fetchProductData = React.useCallback(async () => {
    if (!productId) return;
    setIsLoadingProduct(true);
    try {
      const { data, error } = await getProductById(productId);
      if (error) throw error;
      if (data) {
        const uiProduct = mapProductFromSupabaseToUI(data);
        setProduct(uiProduct);
      } else {
        throw new Error("Product not found");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error Fetching Product", description: err.message });
      setProduct(null);
    } finally {
      setIsLoadingProduct(false);
    }
  }, [productId, toast]);


  React.useEffect(() => {
    if (productId) {
      fetchProductData();
    } else {
      setIsLoadingProduct(false);
      setProduct(null);
    }
  }, [productId, fetchProductData]);


  const handleFormSubmit = async (values: ProductFormValues, images: { file: File | null; id?: string; preview: string; order: number }[]) => {
    if (!product || !authUser || !storeIdFromUrl) {
      toast({ variant: "destructive", title: "Error", description: "Product data, user, or store ID missing." });
      return;
    }
    setIsSubmitting(true);

    const payload: ProductPayload = {
      name: values.name,
      category: values.category,
      price: values.price,
      order_price: values.order_price,
      stock: values.stock,
      status: values.status as any,
      description: values.description,
      full_description: values.full_description,
      sku: values.sku,
      tags: values.tags,
      weight_kg: values.weight_kg,
      dimensions_cm: (values.dimensions_length && values.dimensions_width && values.dimensions_height) ? {
        length: values.dimensions_length,
        width: values.dimensions_width,
        height: values.dimensions_height
      } : null,
      attributes: values.attributes || null,
      is_dropshippable: values.is_dropshippable,
      supplier_price: values.supplier_price,
    };

    try {
      // Map images for update
      const imagesToUpdate = images.map((img, idx) => ({
        id: img.id,
        file: img.file || undefined,
        existingUrl: img.file ? undefined : img.preview,
        order: idx
      }));

      const { error } = await updateProduct(product.id, authUser.id, storeIdFromUrl, payload, imagesToUpdate);
      if (error) throw error;

      toast({ title: "Product Updated", description: "Product has been successfully updated." });
      setIsEditDialogOpen(false);
      fetchProductData();

    } catch (e: any) {
      console.error("Error in handleEditProduct:", e);
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCalculateCapacity = async () => {
    if (!product || !product.dimensions || !product.weight) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Product dimensions and weight are required to calculate capacity.",
      });
      return;
    }

    setIsCalculatingCapacity(true);
    setCapacityResult(null);
    setCapacityError(null);

    try {
      const input = {
        productName: product.name,
        productDimensions: product.dimensions,
        productWeight: product.weight,
        vehicleType: vehicleType,
      };

      const result = await calculateDeliveryCapacity(input);
      setCapacityResult(result);
    } catch (error: any) {
      console.error("Error calculating capacity:", error);
      const errorMessage = error.message || "An unexpected error occurred.";
      setCapacityError(errorMessage);
      toast({
        variant: "destructive",
        title: "Calculation Failed",
        description: errorMessage,
      });
    } finally {
      setIsCalculatingCapacity(false);
    }
  };




  if (isLoadingProduct) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto p-4 sm:p-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-4">
        <div className="bg-muted p-4 rounded-full">
          <Tag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Product Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          The product you are looking for does not exist or you do not have permission to view it.
        </p>
        <Button onClick={() => router.push(`/products?${searchParams.toString()}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>
      </div>
    );
  }

  const statusColor =
    product.status === "Active" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" :
      product.status === "Draft" ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" :
        "text-slate-600 bg-slate-50 dark:bg-slate-950/30 dark:text-slate-400 border-slate-200 dark:border-slate-800";

  const currentImage = product.images[selectedImageIndex] || "https://placehold.co/600x600.png?text=No+Image";

  return (
    <div className="pb-20 bg-muted/5 min-h-screen">
      {/* Top Navigation & Actions */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 sm:px-8 py-4 mb-8 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 self-start sm:self-auto overflow-hidden">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/products?${searchParams.toString()}`)} className="shrink-0 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Products
            </Button>
            <div className="h-4 w-[1px] bg-border shrink-0" />
            <span className="font-medium truncate max-w-[200px] sm:max-w-md">{product.name}</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsEditDialogOpen(true)} disabled={!authUser || !storeIdFromUrl} className="shadow-sm">
                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                </Button>
              </DialogTrigger>

              {/* Render Content same as before but inside the new layout structure if needed, or keeping component logic separate. 
                       For brevity in replacement, re-using the existing DialogContent logic below. 
                    */}
              <DialogContent className="sm:max-w-3xl overflow-hidden flex flex-col max-h-[90vh] p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b bg-muted/10">
                  <DialogTitle>Edit Product</DialogTitle>
                  <DialogDescription>Update the essential details for {product.name}.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <ProductForm
                    initialData={product.raw} // Pass raw supabase object
                    onSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                    onCancel={() => setIsEditDialogOpen(false)}
                    isSupplier={isSupplier}
                  />
                </div>
              </DialogContent>
            </Dialog >
          </div >
        </div >
      </div >

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* LEFT COLUMN: IMAGES */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border shadow-sm bg-white dark:bg-slate-950 group">
              <NextImage
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
                unoptimized={currentImage.startsWith('blob:')}
              />
              <div className="absolute top-4 left-4">
                <Badge variant="outline" className={cn("backdrop-blur-md shadow-sm border px-3 py-1 font-semibold", statusColor)}>
                  {product.status}
                </Badge>
              </div>
            </div>

            {product.images.length > 0 && (
              <ScrollArea className="w-full pb-2">
                <div className="flex gap-4">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={cn(
                        "relative h-24 w-32 shrink-0 overflow-hidden rounded-lg border-2 transition-all hover:opacity-100",
                        selectedImageIndex === i ? "border-primary shadow-md opacity-100 ring-2 ring-primary/20" : "border-transparent opacity-70 hover:border-border"
                      )}
                    >
                      <NextImage src={img} alt={`Thumbnail ${i}`} fill className="object-cover" unoptimized={img.startsWith('blob:')} />
                    </button>
                  ))}
                  {product.images.length < MAX_IMAGES && (
                    <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 text-muted-foreground text-xs gap-1 hover:bg-muted/80 transition-colors cursor-pointer" onClick={() => setIsEditDialogOpen(true)}>
                      <Plus className="h-5 w-5" />
                      <span>Add</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* RIGHT COLUMN: INFO */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {product.supplier_product_id && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                    Imported
                  </Badge>
                )}
                <Badge variant="secondary" className="font-normal text-muted-foreground capitalize">{product.category.replace("-", " ")}</Badge>
                {product.sku && <span className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</span>}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">{product.name}</h1>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  ZMW {product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <div className="flex flex-col text-sm text-muted-foreground ml-2 border-l pl-3 bg-muted/30 p-1 rounded-sm">
                  <span>Cost: {product.orderPrice ? `ZMW ${product.orderPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "N/A"}</span>
                  {product.supplier_price && (
                    <span>Wholesale: ZMW {product.supplier_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  )}
                </div>
              </div>
            </div>

            <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
              <CardContent className="p-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Availability</span>
                  <div className={cn("inline-flex items-center gap-2 font-medium", product.stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                    <div className={cn("h-2.5 w-2.5 rounded-full animate-pulse", product.stock > 0 ? "bg-emerald-500" : "bg-red-500")} />
                    {product.stock > 0 ? `${product.stock} In Stock` : "Out of Stock"}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weight</span>
                  <div className="flex items-center gap-2 font-medium">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    {product.weight ? `${product.weight} kg` : "N/A"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 space-y-6">
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                <p className="whitespace-pre-line">{product.fullDescription || product.description || "No description available."}</p>
              </div>

              {/* Dimensions / Specs Mini-Card */}
              {(product.dimensions || (product.tags && product.tags.length > 0)) && (
                <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
                  <h4 className="font-semibold text-sm flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Specifications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {product.dimensions && (
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">Dimensions</span>
                        <span className="font-mono">{product.dimensions.length}x{product.dimensions.width}x{product.dimensions.height} cm</span>
                      </div>
                    )}
                    {product.tags && product.tags.length > 0 && (
                      <div className="col-span-full">
                        <div className="flex flex-wrap gap-2 mt-1">
                          {product.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs bg-muted hover:bg-muted-foreground/10">{tag}</Badge>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Delivery Calculator integrated nicely */}
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 p-5 mt-4">
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <Calculator className="h-5 w-5" />
                    <h3 className="font-semibold">Optimize Delivery?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Estimate how many units fit in your vehicle using AI.</p>

                  {!product.weight || !product.dimensions ? (
                    <Button variant="secondary" size="sm" onClick={() => setIsEditDialogOpen(true)} className="self-start mt-2">Add Weight & Dimensions</Button>
                  ) : (
                    <div className="grid gap-3 mt-2 bg-white/50 dark:bg-black/20 p-3 rounded-lg backdrop-blur-sm">
                      <div className="flex gap-2">
                        <Select value={vehicleType} onValueChange={(v: 'car' | 'bike') => setVehicleType(v)}>
                          <SelectTrigger className="bg-background h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bike">Delivery Bike</SelectItem>
                            <SelectItem value="car">Car Trunk</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleCalculateCapacity} disabled={isCalculatingCapacity} className="h-9">
                          {isCalculatingCapacity ? <span className="animate-spin mr-2">⏳</span> : "Calculate"}
                        </Button>
                      </div>
                      {capacityResult && (
                        <div className="text-sm">
                          <span className="font-bold text-primary">{capacityResult.maxQuantity} units</span> fit in a {vehicleType}.
                        </div>
                      )}
                      {capacityError && <p className="text-xs text-destructive">{capacityError}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

