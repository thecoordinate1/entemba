
"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import NextImage from "next/image"; // Renamed to avoid conflict with Image from lucide-react
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHeader } from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    getStoreOptionTypes,
    getOptionValues,
    findOrCreateOptionType,
    findOrCreateOptionValue,
    createProductVariant,
    type OptionTypeFromSupabase,
    type OptionValueFromSupabase
} from "@/services/productService";
import type { Product as ProductUIType, ProductVariant as ProductVariantUIType } from "@/lib/types";
import { calculateDeliveryCapacity, type CalculateCapacityOutput } from "@/ai/flows/calculate-delivery-capacity-flow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

const MAX_IMAGES = 5;

interface FormImageSlot {
  id?: string; // ID of existing product_image record, if applicable
  file: File | null;
  previewUrl: string | null; 
  order: number;
  originalUrl?: string; // The URL from Supabase, if it's an existing image
}

interface NewVariantOption {
  typeId?: string;
  typeName: string;
  valueId?: string;
  valueName: string;
}

const initialImageSlots = (): FormImageSlot[] => Array(MAX_IMAGES).fill(null).map((_, i) => ({
  file: null,
  previewUrl: null,
  order: i,
}));

const mapVariantFromSupabaseToUI = (variant: any): ProductVariantUIType => ({
  id: variant.id,
  price: variant.price,
  orderPrice: variant.order_price,
  stock: variant.stock,
  sku: variant.sku,
  isDefault: variant.is_default,
  options: variant.product_variant_options.map((pvo: any) => ({
    type: pvo.option_value.option_type.name,
    value: pvo.option_value.value,
  })),
});


// Helper to map backend product to UI product type
const mapProductFromSupabaseToUI = (product: ProductFromSupabase): ProductUIType => {
  return {
    id: product.id,
    name: product.name,
    images: product.product_images.sort((a,b) => a.order - b.order).map(img => img.image_url),
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
    variants: product.product_variants.map(mapVariantFromSupabaseToUI)
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

  const [product, setProduct] = React.useState<ProductUIType | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = React.useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isAddVariantDialogOpen, setIsAddVariantDialogOpen] = React.useState(false);

  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  
  const [formImageSlots, setFormImageSlots] = React.useState<FormImageSlot[]>(initialImageSlots());
  
  // Form state for edit dialog
  const [formProductName, setFormProductName] = React.useState<string>("");
  const [formDescription, setFormDescription] = React.useState<string>("");
  const [formFullDescription, setFormFullDescription] = React.useState<string>("");
  const [formCategory, setFormCategory] = React.useState<string>("");
  const [formPrice, setFormPrice] = React.useState<number | string>("");
  const [formOrderPrice, setFormOrderPrice] = React.useState<number | string | undefined>(undefined);
  const [formStock, setFormStock] = React.useState<number | string>("");
  const [formSku, setFormSku] = React.useState<string | undefined>(undefined);
  const [formStatus, setFormStatus] = React.useState<ProductUIType["status"]>("Draft");
  const [formTags, setFormTags] = React.useState<string[]>([]);
  const [formWeightKg, setFormWeightKg] = React.useState<number | string | undefined>(undefined); 
  const [formDimLength, setFormDimLength] = React.useState<number | string | undefined>(undefined);
  const [formDimWidth, setFormDimWidth] = React.useState<number | string | undefined>(undefined);
  const [formDimHeight, setFormDimHeight] = React.useState<number | string | undefined>(undefined);

  // New state for capacity calculator
  const [vehicleType, setVehicleType] = React.useState<'car' | 'bike'>('bike');
  const [capacityResult, setCapacityResult] = React.useState<CalculateCapacityOutput | null>(null);
  const [isCalculatingCapacity, setIsCalculatingCapacity] = React.useState(false);
  const [capacityError, setCapacityError] = React.useState<string | null>(null);

  // --- Variant Management State ---
  const [storeOptionTypes, setStoreOptionTypes] = React.useState<OptionTypeFromSupabase[]>([]);
  const [newVariantOptions, setNewVariantOptions] = React.useState<NewVariantOption[]>([]);
  const [newVariantPrice, setNewVariantPrice] = React.useState<string>("");
  const [newVariantOrderPrice, setNewVariantOrderPrice] = React.useState<string>("");
  const [newVariantStock, setNewVariantStock] = React.useState<string>("");
  const [newVariantSku, setNewVariantSku] = React.useState<string>("");
  const [newVariantIsDefault, setNewVariantIsDefault] = React.useState<boolean>(false);
  const [isSubmittingVariant, setIsSubmittingVariant] = React.useState<boolean>(false);


  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [supabase]);

  const fetchProduct = React.useCallback(async () => {
    if (!productId) return;
    setIsLoadingProduct(true);
    try {
      const { data, error } = await getProductById(productId);
      if (error) throw error;
      if (data) {
        const uiProduct = mapProductFromSupabaseToUI(data);
        setProduct(uiProduct);
        // ... (rest of the state updates)
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
      setIsLoadingProduct(true);
      getProductById(productId)
        .then(({ data, error }) => {
          if (error) {
            toast({ variant: "destructive", title: "Error Fetching Product", description: error.message });
            setProduct(null);
          } else if (data) {
            const uiProduct = mapProductFromSupabaseToUI(data);
            setProduct(uiProduct);
            setSelectedImageIndex(0);
            // Initialize form fields and image slots for edit dialog when product loads
            setFormProductName(uiProduct.name);
            setFormDescription(uiProduct.description || "");
            setFormFullDescription(uiProduct.fullDescription);
            setFormCategory(uiProduct.category);
            setFormPrice(uiProduct.price);
            setFormOrderPrice(uiProduct.orderPrice ?? "");
            setFormStock(uiProduct.stock);
            setFormSku(uiProduct.sku ?? "");
            setFormStatus(uiProduct.status);
            setFormTags(uiProduct.tags || []);
            setFormWeightKg(uiProduct.weight ?? "");
            setFormDimLength(uiProduct.dimensions?.length ?? "");
            setFormDimWidth(uiProduct.dimensions?.width ?? "");
            setFormDimHeight(uiProduct.dimensions?.height ?? "");
            
            const slotsFromProduct: FormImageSlot[] = initialImageSlots();
            uiProduct.images.forEach((imgUrl, index) => {
                if (index < MAX_IMAGES) {
                    const originalImageInfo = data.product_images.find(pi => pi.image_url === imgUrl && pi.order === index);
                    slotsFromProduct[index] = {
                        id: originalImageInfo?.id, 
                        file: null,
                        previewUrl: imgUrl,
                        originalUrl: imgUrl, 
                        order: index,
                    };
                }
            });
            setFormImageSlots(slotsFromProduct);

          } else {
            toast({ variant: "destructive", title: "Product Not Found" });
            setProduct(null);
          }
        })
        .finally(() => setIsLoadingProduct(false));
    } else {
      setIsLoadingProduct(false);
      setProduct(null);
    }
  }, [productId, toast]);
  
  React.useEffect(() => {
    if (isAddVariantDialogOpen && storeIdFromUrl) {
      getStoreOptionTypes(storeIdFromUrl).then(({ data }) => {
        setStoreOptionTypes(data || []);
      });
    }
  }, [isAddVariantDialogOpen, storeIdFromUrl]);

  const handleImageFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFormImageSlots(prevSlots => {
      const newSlots = [...prevSlots];
      const oldSlot = newSlots[index];

      if (oldSlot.previewUrl && oldSlot.file) { // Revoke if it's an object URL from a previous file selection
        URL.revokeObjectURL(oldSlot.previewUrl);
      }

      if (file) {
        newSlots[index] = { ...oldSlot, file: file, previewUrl: URL.createObjectURL(file), order: index };
      } else { 
        // If file is removed, revert to original URL if it exists, otherwise null
        newSlots[index] = { ...oldSlot, file: null, previewUrl: oldSlot.originalUrl || null, order: index };
      }
      return newSlots;
    });
  };
  
  const openEditDialog = () => {
    if (!product) return;
    setIsEditDialogOpen(true);
  };
  
  const resetAndCloseEditDialog = () => {
    setIsEditDialogOpen(false);
  };


  const preparePayloadForUpdate = (): ProductPayload | null => {
    if (!formProductName || !formCategory || formPrice === "" || formStock === "") {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name, Category, Price, and Stock are required." });
      return null;
    }
    const priceNum = parseFloat(String(formPrice));
    const stockNum = parseInt(String(formStock));

    if (isNaN(priceNum) || isNaN(stockNum)) {
        toast({ variant: "destructive", title: "Invalid Input", description: "Price and Stock must be valid numbers." });
        return null;
    }
    
    let orderPriceNum: number | undefined | null = undefined;
    if (formOrderPrice !== undefined && String(formOrderPrice).trim() !== "") {
        orderPriceNum = parseFloat(String(formOrderPrice));
        if (isNaN(orderPriceNum)) orderPriceNum = null;
    }

    let dimensions: ProductPayload['dimensions_cm'] = null;
    if (formDimLength !== undefined && String(formDimLength).trim() !== "" && 
        formDimWidth !== undefined && String(formDimWidth).trim() !== "" && 
        formDimHeight !== undefined && String(formDimHeight).trim() !== "") {
      const length = parseFloat(String(formDimLength));
      const width = parseFloat(String(formDimWidth));
      const height = parseFloat(String(formDimHeight));
      if (!isNaN(length) && !isNaN(width) && !isNaN(height)) {
        dimensions = { length, width, height };
      }
    }
    
    const weightNum = formWeightKg !== undefined && String(formWeightKg).trim() !== "" ? parseFloat(String(formWeightKg)) : null;

    return {
      name: formProductName,
      description: formDescription || null,
      full_description: formFullDescription || formDescription || "No full description provided.",
      category: formCategory,
      price: priceNum,
      order_price: orderPriceNum,
      stock: stockNum,
      sku: formSku || null,
      status: formStatus,
      tags: formTags.length > 0 ? formTags : null,
      weight_kg: (weightNum !== null && !isNaN(weightNum)) ? weightNum : null,
      dimensions_cm: dimensions,
    };
  };

  const handleEditProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product || !authUser || !storeIdFromUrl) {
      toast({ variant: "destructive", title: "Error", description: "Product data, user, or store ID missing." });
      return;
    }
    setIsSubmitting(true);

    const productPayload = preparePayloadForUpdate();
    if (!productPayload) {
      setIsSubmitting(false);
      return;
    }
    
    const imagesToSetForService = formImageSlots
        .filter(slot => slot.previewUrl || slot.file) 
        .map((slot, index) => ({
            id: slot.id, 
            file: slot.file || undefined,
            existingUrl: slot.file ? undefined : slot.previewUrl || undefined, 
            order: index, 
        }));

    try {
      const { data: updatedProductFromBackend, error } = await updateProduct(
        product.id, 
        authUser.id,
        storeIdFromUrl,
        productPayload,
        imagesToSetForService
      );

      if (error || !updatedProductFromBackend) {
        toast({ variant: "destructive", title: "Error Updating Product", description: error?.message || "Could not update product." });
      } else {
        const updatedProductUI = mapProductFromSupabaseToUI(updatedProductFromBackend);
        setProduct(updatedProductUI); // Update local state with new product data
        setSelectedImageIndex(0); // Reset selected image
        toast({ title: "Product Updated", description: `${updatedProductUI.name} has been successfully updated.` });
        resetAndCloseEditDialog();
      }
    } catch (e) {
        console.error("Error in handleEditProduct:", e);
        toast({ variant: "destructive", title: "Operation Failed", description: "An unexpected error occurred during update."});
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

  const resetAddVariantForm = () => {
    setNewVariantOptions([]);
    setNewVariantPrice(product?.price.toString() ?? "");
    setNewVariantOrderPrice(product?.orderPrice?.toString() ?? "");
    setNewVariantStock("");
    setNewVariantSku("");
    setNewVariantIsDefault(false);
  };

  const handleAddVariantOption = () => {
    setNewVariantOptions(prev => [...prev, { typeName: '', valueName: '' }]);
  };

  const handleVariantOptionChange = (index: number, field: 'typeName' | 'valueName', value: string) => {
    setNewVariantOptions(prev => {
      const newOptions = [...prev];
      newOptions[index] = { ...newOptions[index], [field]: value };
      return newOptions;
    });
  };

  const handleRemoveVariantOption = (index: number) => {
    setNewVariantOptions(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleCreateVariant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!storeIdFromUrl || !product || newVariantOptions.length === 0) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please add at least one option for the variant." });
      return;
    }
    setIsSubmittingVariant(true);
    try {
      const optionValueIds: string[] = [];
      for (const option of newVariantOptions) {
        if (!option.typeName.trim() || !option.valueName.trim()) {
          throw new Error("Option type and value names cannot be empty.");
        }
        const optionType = await findOrCreateOptionType(storeIdFromUrl, option.typeName.trim());
        const optionValue = await findOrCreateOptionValue(optionType.id, option.valueName.trim());
        optionValueIds.push(optionValue.id);
      }
      
      const priceNum = parseFloat(newVariantPrice);
      const stockNum = parseInt(newVariantStock, 10);
      if (isNaN(priceNum) || isNaN(stockNum)) {
        throw new Error("Price and Stock must be valid numbers.");
      }
      
      const payload = {
        product_id: product.id,
        price: priceNum,
        order_price: newVariantOrderPrice ? parseFloat(newVariantOrderPrice) : null,
        stock: stockNum,
        sku: newVariantSku || null,
        is_default: newVariantIsDefault,
        optionValueIds: optionValueIds,
      };

      const { data: newVariant, error } = await createProductVariant(payload);
      if (error) throw error;

      toast({ title: "Variant Created", description: "The new product variant has been added." });
      resetAddVariantForm();
      setIsAddVariantDialogOpen(false);
      fetchProduct(); // Refetch product to show new variant
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error Creating Variant", description: err.message });
    } finally {
      setIsSubmittingVariant(false);
    }
  };


  if (isLoadingProduct) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-40" /> {/* Back button placeholder */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/5"> <Skeleton className="aspect-[4/3] w-full rounded-lg" /> </div>
              <div className="md:w-3/5 space-y-3">
                <Skeleton className="h-8 w-3/4" /> <Skeleton className="h-6 w-1/4 ml-auto" />
                <Skeleton className="h-5 w-full" /> <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </div>
          </CardHeader>
          <CardContent> <Skeleton className="h-20 w-full" /> </CardContent>
        </Card>
      </div>
    );
  }


  if (!product) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="outline" onClick={() => router.push(`/products?${searchParams.toString()}`)} className="flex items-center gap-2 self-start">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
        <div className="flex items-center justify-center h-full py-10 text-muted-foreground">
          Product not found or you do not have access.
        </div>
      </div>
    );
  }

  const statusBadgeVariant = 
    product.status === "Active" ? "default" : 
    product.status === "Draft" ? "secondary" : "outline";
  
  const statusBadgeClass =
    product.status === "Active" ? "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30" :
    product.status === "Archived" ? "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-400 border-slate-500/30" :
    ""; 

  const currentImage = product.images[selectedImageIndex] || "https://placehold.co/600x450.png";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(`/products?${searchParams.toString()}`)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) resetAndCloseEditDialog(); else setIsEditDialogOpen(true);}}>
          <DialogTrigger asChild>
            <Button onClick={openEditDialog} disabled={!authUser || !storeIdFromUrl}>
              <Edit className="mr-2 h-4 w-4" /> Edit Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit {product.name}</DialogTitle>
              <DialogDescription>
                Update the details for this product. You can add up to {MAX_IMAGES} images.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditProduct}>
              <ScrollArea className="h-[70vh] pr-6">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="formProductName">Name</Label>
                    <Input id="formProductName" value={formProductName} onChange={(e) => setFormProductName(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="formDescription">Short Description</Label>
                    <Textarea id="formDescription" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="A brief summary for product listings." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="formFullDescription">Full Description</Label>
                    <Textarea id="formFullDescription" value={formFullDescription} onChange={(e) => setFormFullDescription(e.target.value)} placeholder="Detailed product information for the product page." rows={3} required/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="formCategory">Category</Label>
                      <Input id="formCategory" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="formPrice">Regular Price</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ZMW</span>
                        <Input id="formPrice" type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} required className="pl-12" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="formOrderPrice">Order Price (Optional)</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ZMW</span>
                        <Input id="formOrderPrice" type="number" step="0.01" value={formOrderPrice ?? ""} onChange={(e) => setFormOrderPrice(e.target.value)} placeholder="Defaults to regular price" className="pl-12" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="formStock">Stock</Label>
                      <Input id="formStock" type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="formSku">SKU (Optional)</Label>
                      <Input id="formSku" value={formSku ?? ""} onChange={(e) => setFormSku(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="formStatus">Status</Label>
                        <Select name="status" value={formStatus} onValueChange={(value: ProductUIType["status"]) => setFormStatus(value)}>
                        <SelectTrigger id="formStatus"> <SelectValue placeholder="Select status" /> </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <Separator className="my-2"/>
                  <h4 className="font-medium text-sm col-span-full">Additional Details</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="formTags">Tags (Optional, comma-separated)</Label>
                    <Input id="formTags" value={formTags.join(", ")} onChange={(e) => setFormTags(e.target.value.split(",").map(t => t.trim()).filter(t => t))} placeholder="e.g., featured, summer, sale" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="formWeightKg">Weight (kg, Optional)</Label>
                        <div className="relative">
                            <Weight className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input id="formWeightKg" type="number" step="0.01" value={formWeightKg ?? ""} onChange={(e) => setFormWeightKg(e.target.value)} placeholder="e.g., 0.5" className="pl-8" />
                        </div>
                    </div>
                  </div>
                  <div>
                    <Label>Dimensions (cm, Optional)</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                        <Input name="dimLength" type="number" step="0.1" placeholder="Length" value={formDimLength ?? ""} onChange={(e) => setFormDimLength(e.target.value)} />
                        <Input name="dimWidth" type="number" step="0.1" placeholder="Width" value={formDimWidth ?? ""} onChange={(e) => setFormDimWidth(e.target.value)} />
                        <Input name="dimHeight" type="number" step="0.1" placeholder="Height" value={formDimHeight ?? ""} onChange={(e) => setFormDimHeight(e.target.value)} />
                    </div>
                  </div>

                  <Separator className="my-4"/>
                  <h4 className="font-medium text-md col-span-full">Product Images (up to {MAX_IMAGES})</h4>
                  {formImageSlots.map((slot, index) => (
                    <div key={`image-edit-${index}`} className="grid grid-cols-1 md:grid-cols-[2fr_auto] gap-4 items-center border-b pb-3 mb-1">
                      <div className="grid gap-2">
                        <Label htmlFor={`edit-image_file_${index}`}>Image {index + 1}</Label>
                        <Input 
                          id={`edit-image_file_${index}`} 
                          name={`edit-image_file_${index}`} 
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(index, e)}
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                      </div>
                      {slot.previewUrl && (
                        <div className="mt-2 md:mt-0 md:self-end">
                          <NextImage
                            src={slot.previewUrl} 
                            alt={`Preview ${index + 1}`}
                            width={64}
                            height={64}
                            className="rounded-md object-cover h-16 w-16 border"
                            unoptimized={slot.previewUrl.startsWith('blob:')}
                          />
                        </div>
                      )}
                       {!slot.previewUrl && (
                         <div className="mt-2 md:mt-0 md:self-end flex items-center justify-center h-16 w-16 rounded-md border bg-muted">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetAndCloseEditDialog} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !authUser || !storeIdFromUrl}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Product Details</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
            <Card>
                <CardHeader>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-2/5">
                    {product.images.length > 0 ? (
                        <NextImage
                        src={currentImage}
                        alt={`${product.name} - image ${selectedImageIndex + 1}`}
                        width={600}
                        height={450}
                        className="rounded-lg object-cover aspect-[4/3] w-full border"
                        priority={selectedImageIndex === 0} 
                        unoptimized={currentImage?.startsWith('blob:')}
                        />
                    ) : (
                        <div className="rounded-lg object-cover aspect-[4/3] w-full border bg-muted flex items-center justify-center">
                        <ImageIconLucide className="h-16 w-16 text-muted-foreground"/>
                        </div>
                    )}
                    {product.images && product.images.length > 1 && (
                        <div className="mt-4 grid grid-cols-5 gap-2">
                        {product.images.map((imgUrl, index) => (
                            imgUrl && ( 
                            <button
                                key={`thumb-${index}-${product.id}`}
                                onClick={() => setSelectedImageIndex(index)}
                                className={cn(
                                "rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-primary transition-all",
                                selectedImageIndex === index ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-muted-foreground/50"
                                )}
                                aria-label={`View image ${index + 1} for ${product.name}`}
                            >
                                <NextImage
                                src={imgUrl}
                                alt={`${product.name} thumbnail ${index + 1}`}
                                width={100}
                                height={75}
                                className="object-cover aspect-[4/3] w-full h-full"
                                unoptimized={imgUrl?.startsWith('blob:')}
                                />
                            </button>
                            )
                        ))}
                        </div>
                    )}
                    </div>
                    <div className="md:w-3/5 space-y-3">
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-3xl">{product.name}</CardTitle>
                        <Badge variant={statusBadgeVariant} className={cn(statusBadgeClass, "text-sm px-3 py-1")}>
                            {product.status}
                        </Badge>
                    </div>
                    <CardDescription className="text-base">{product.description}</CardDescription>
                    
                    <div>
                        <div className="text-3xl font-bold text-primary">ZMW {product.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        {product.orderPrice !== undefined && product.orderPrice !== product.price && (
                        <div className="text-xl font-semibold text-muted-foreground">
                            Order Price: <span className="text-accent">ZMW {product.orderPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                        <span className={cn("text-sm", product.stock > 0 ? "text-foreground" : "text-destructive font-semibold")}>
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
                        </span>
                    </div>
                    
                    {product.sku && (
                        <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                    )}
                    </div>
                </div>
                </CardHeader>
                <CardContent>
                <Separator className="my-6" />
                
                <h3 className="text-xl font-semibold mb-3">Product Details</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{product.fullDescription}</p>

                {(product.tags && product.tags.length > 0 || product.weight || product.dimensions) && <Separator className="my-6" />}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {product.tags && product.tags.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center"><Tag className="mr-2 h-5 w-5 text-primary"/> Tags</h4>
                        <div className="flex flex-wrap gap-2">
                        {product.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                        ))}
                        </div>
                    </div>
                    )}

                    {(product.weight || product.dimensions) && (
                    <div>
                        <h4 className="font-semibold mb-2">Specifications</h4>
                        <Table className="mt-1">
                        <TableBody>
                            {product.weight && (
                            <TableRow>
                                <TableCell className="font-medium w-1/3 py-2 px-0"><Weight className="inline mr-2 h-4 w-4 text-muted-foreground"/> Weight</TableCell>
                                <TableCell className="py-2 px-0">{product.weight} kg</TableCell>
                            </TableRow>
                            )}
                            {product.dimensions && (
                            <TableRow>
                                <TableCell className="font-medium w-1/3 py-2 px-0"><Ruler className="inline mr-2 h-4 w-4 text-muted-foreground"/> Dimensions</TableCell>
                                <TableCell className="py-2 px-0">{product.dimensions.length}L x {product.dimensions.width}W x {product.dimensions.height}H cm</TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                    )}
                </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground border-t pt-4 mt-6">
                Product ID: {product.id} &nbsp;&middot;&nbsp; Created on: {new Date(product.createdAt).toLocaleDateString()}
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="variants">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Product Variants</CardTitle>
                        <CardDescription>Manage different versions of this product, like sizes or colors.</CardDescription>
                    </div>
                    <Dialog open={isAddVariantDialogOpen} onOpenChange={(isOpen) => { setIsAddVariantDialogOpen(isOpen); if(!isOpen) resetAddVariantForm(); }}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Add Variant</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Add New Variant</DialogTitle>
                                <DialogDescription>Define options and details for a new product variant.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateVariant}>
                                <ScrollArea className="h-[60vh] pr-4">
                                    <div className="grid gap-6 py-4">
                                        <div>
                                            <Label className="mb-2 block">Variant Options</Label>
                                            <div className="space-y-4">
                                                {newVariantOptions.map((opt, index) => (
                                                    <div key={index} className="flex gap-2 items-center">
                                                        <Input 
                                                            placeholder="Option Type (e.g. Color)" 
                                                            value={opt.typeName}
                                                            onChange={e => handleVariantOptionChange(index, 'typeName', e.target.value)}
                                                        />
                                                        <Input 
                                                            placeholder="Option Value (e.g. Red)" 
                                                            value={opt.valueName}
                                                            onChange={e => handleVariantOptionChange(index, 'valueName', e.target.value)}
                                                        />
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveVariantOption(index)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleAddVariantOption}>
                                                <Plus className="mr-2 h-4 w-4" /> Add Option
                                            </Button>
                                        </div>
                                        <Separator />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="variant-price">Price</Label>
                                                <Input id="variant-price" placeholder="Variant price" value={newVariantPrice} onChange={e => setNewVariantPrice(e.target.value)} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="variant-order-price">Order Price (Optional)</Label>
                                                <Input id="variant-order-price" placeholder="Cost price" value={newVariantOrderPrice} onChange={e => setNewVariantOrderPrice(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="variant-stock">Stock</Label>
                                                <Input id="variant-stock" type="number" placeholder="Quantity" value={newVariantStock} onChange={e => setNewVariantStock(e.target.value)} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="variant-sku">SKU (Optional)</Label>
                                                <Input id="variant-sku" placeholder="SKU for this variant" value={newVariantSku} onChange={e => setNewVariantSku(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Checkbox id="is-default" checked={newVariantIsDefault} onCheckedChange={checked => setNewVariantIsDefault(checked as boolean)} />
                                            <Label htmlFor="is-default">Set as default variant</Label>
                                        </div>
                                    </div>
                                </ScrollArea>
                                <DialogFooter className="pt-4 mt-4 border-t">
                                    <Button type="button" variant="outline" onClick={() => setIsAddVariantDialogOpen(false)} disabled={isSubmittingVariant}>Cancel</Button>
                                    <Button type="submit" disabled={isSubmittingVariant}>{isSubmittingVariant ? "Creating..." : "Create Variant"}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {product.variants.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Variant</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {product.variants.map(variant => (
                                    <TableRow key={variant.id}>
                                        <TableCell className="font-medium">
                                            {variant.options.map(o => o.value).join(' / ')}
                                            {variant.isDefault && <Badge variant="outline" className="ml-2">Default</Badge>}
                                        </TableCell>
                                        <TableCell>ZMW {variant.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                                        <TableCell>{variant.stock}</TableCell>
                                        <TableCell>{variant.sku || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <p>This product has no variants.</p>
                            <p className="text-sm">The base product details will be used for pricing and stock.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calculator className="h-6 w-6 text-primary"/> Delivery Capacity Estimator</CardTitle>
          <CardDescription>Use AI to estimate how many units of this product can fit in a standard vehicle. This requires weight and dimensions to be set for the product.</CardDescription>
        </CardHeader>
        <CardContent>
          {(!product.weight || !product.dimensions) ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Please add weight and dimensions to this product to enable the capacity calculator.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="grid gap-1.5 w-full sm:w-auto">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={(v: 'car' | 'bike') => setVehicleType(v)}>
                    <SelectTrigger id="vehicleType" className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bike">Delivery Bike</SelectItem>
                      <SelectItem value="car">Car Trunk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCalculateCapacity} disabled={isCalculatingCapacity} className="w-full sm:w-auto sm:self-end">
                  {isCalculatingCapacity ? 'Calculating...' : 'Calculate Capacity'}
                </Button>
              </div>
              {isCalculatingCapacity && (
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              )}
              {capacityError && (
                 <p className="text-sm text-destructive text-center py-4">{capacityError}</p>
              )}
              {capacityResult && !isCalculatingCapacity && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                  <p className="text-lg">
                    Estimated max quantity for a <span className="font-semibold capitalize">{vehicleType}</span>: 
                    <span className="text-2xl font-bold text-primary ml-2">{capacityResult.maxQuantity}</span> units
                  </p>
                  <p className="text-sm text-muted-foreground"><span className="font-semibold">Reasoning:</span> {capacityResult.reasoning}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

