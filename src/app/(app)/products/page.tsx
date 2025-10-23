
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Search, Eye, Image as ImageIconLucide, DollarSign, UploadCloud, Tag, Weight, Ruler, Package, ChevronLeft, ChevronRight } from "lucide-react";
import NextImage from "next/image"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product as ProductUIType } from "@/lib/mockData";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { 
    createProduct, 
    getProductsByStoreId,
    updateProduct,
    deleteProduct,
    type ProductPayload, 
    type ProductFromSupabase,
} from "@/services/productService";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_IMAGES = 5;
const ITEMS_PER_PAGE = 10;

interface FormImageSlot {
  id?: string; 
  file: File | null;
  previewUrl: string | null; 
  originalUrl?: string; 
}

const initialImageSlots = (): FormImageSlot[] => Array(MAX_IMAGES).fill(null).map((_, i) => ({
  file: null,
  previewUrl: null,
  order: i,
}));

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
  };
};


export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeIdFromUrl = searchParams.get("storeId");
  const [selectedStoreName, setSelectedStoreName] = React.useState<string | null>(null); 

  const [products, setProducts] = React.useState<ProductUIType[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState<boolean>(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = React.useState<ProductUIType | null>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const { toast } = useToast();
  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const [formImageSlots, setFormImageSlots] = React.useState<FormImageSlot[]>(initialImageSlots());
  
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

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalProducts, setTotalProducts] = React.useState(0);


  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  React.useEffect(() => {
    const fetchProducts = async () => {
        if (storeIdFromUrl && authUser) {
            setIsLoadingProducts(true);
            try {
                const storePromise = supabase.from('stores').select('name').eq('id', storeIdFromUrl).single();
                const productsPromise = getProductsByStoreId(storeIdFromUrl, currentPage, ITEMS_PER_PAGE);

                const [storeResult, productsResult] = await Promise.all([storePromise, productsPromise]);

                if (storeResult.data) {
                    setSelectedStoreName(storeResult.data.name);
                }

                if (productsResult.error) {
                    toast({ variant: "destructive", title: "Error fetching products", description: productsResult.error.message });
                    setProducts([]);
                    setTotalProducts(0);
                } else if (productsResult.data) {
                    setProducts(productsResult.data.map(mapProductFromSupabaseToUI));
                    setTotalProducts(productsResult.count || 0);
                }
            } catch (error: any) {
                toast({ variant: "destructive", title: "An error occurred", description: error.message });
            } finally {
                setIsLoadingProducts(false);
            }
        } else {
            setSelectedStoreName(storeIdFromUrl ? "Loading..." : "No Store Selected");
            setProducts([]);
            setTotalProducts(0);
            setIsLoadingProducts(!storeIdFromUrl); // Only stop loading if a store ID is missing
        }
    };
    fetchProducts();
  }, [storeIdFromUrl, authUser?.id, currentPage, toast, supabase]);

  const resetImageSlots = () => {
    formImageSlots.forEach(slot => {
      if (slot.previewUrl && slot.file) URL.revokeObjectURL(slot.previewUrl);
    });
    setFormImageSlots(initialImageSlots());
  };

  const resetFormFields = () => {
    setFormProductName("");
    setFormDescription("");
    setFormFullDescription("");
    setFormCategory("");
    setFormPrice("");
    setFormOrderPrice(undefined);
    setFormStock("");
    setFormSku(undefined);
    setFormStatus("Draft");
    setFormTags([]);
    setFormWeightKg(undefined);
    setFormDimLength(undefined);
    setFormDimWidth(undefined);
    setFormDimHeight(undefined);
    resetImageSlots();
  };
  

  const handleImageFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFormImageSlots(prevSlots => {
      const newSlots = [...prevSlots];
      const oldSlot = newSlots[index];

      if (oldSlot.previewUrl && oldSlot.file) {
        URL.revokeObjectURL(oldSlot.previewUrl);
      }

      if (file) {
        newSlots[index] = { ...oldSlot, file: file, previewUrl: URL.createObjectURL(file), order: index };
      } else { 
        newSlots[index] = { ...oldSlot, file: null, previewUrl: oldSlot.originalUrl || null, order: index };
      }
      return newSlots;
    });
  };

  const preparePayload = (): ProductPayload | null => {
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
        if (isNaN(orderPriceNum)) orderPriceNum = null; // Explicitly set to null if NaN
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

  const handleAddProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser || !storeIdFromUrl) {
      toast({ variant: "destructive", title: "Error", description: "User or store not identified." });
      return;
    }
    setIsSubmitting(true);

    const productPayload = preparePayload();
    if (!productPayload) {
      setIsSubmitting(false);
      return;
    }

    const imageFiles = formImageSlots
      .filter(slot => slot.file)
      .map(slot => ({ file: slot.file!, order: slot.order }));

    try {
      const { data: newProductFromBackend, error } = await createProduct(authUser.id, storeIdFromUrl, productPayload, imageFiles);
      if (error || !newProductFromBackend) {
        toast({ variant: "destructive", title: "Error Adding Product", description: error?.message || "Could not add product." });
      } else {
        // const newProductUI = mapProductFromSupabaseToUI(newProductFromBackend);
        // setProducts(prev => [newProductUI, ...prev]); // This might need adjustment with pagination
        toast({ title: "Product Added", description: `${newProductFromBackend.name} has been successfully added.` });
        setIsAddDialogOpen(false);
        resetFormFields();
        // Refetch current page to include new product if it falls on this page
        setCurrentPage(1); // Or refetch current page
        setTotalProducts(prev => prev + 1); // Optimistic update
        // Trigger refetch
         getProductsByStoreId(storeIdFromUrl, 1, ITEMS_PER_PAGE).then(({ data, count }) => {
            if (data) setProducts(data.map(mapProductFromSupabaseToUI));
            if (count !== null) setTotalProducts(count);
        });

      }
    } catch (e) {
      console.error("Error in handleAddProduct:", e);
      toast({ variant: "destructive", title: "Operation Failed", description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openEditDialog = (product: ProductUIType) => {
    setSelectedProduct(product);
    if (!authUser || !storeIdFromUrl) return;
        
    setFormProductName(product.name);
    setFormDescription(product.description || "");
    setFormFullDescription(product.fullDescription || ""); 
    setFormCategory(product.category);
    setFormPrice(product.price);
    setFormOrderPrice(product.orderPrice ?? undefined); 
    setFormStock(product.stock);
    setFormSku(product.sku ?? undefined);
    setFormStatus(product.status as ProductUIType["status"]);
    setFormTags(product.tags || []);
    setFormWeightKg(product.weight ?? undefined); 
    setFormDimLength(product.dimensions?.length ?? undefined);
    setFormDimWidth(product.dimensions?.width ?? undefined);
    setFormDimHeight(product.dimensions?.height ?? undefined);

    const slotsFromProduct: FormImageSlot[] = initialImageSlots();
    product.images.forEach((imgUrl, index) => {
        if (index < MAX_IMAGES) {
            // Find original image ID from DB product_images if it's a complex object, not just URL string
            // This simplistic way assumes product.dataAiHints might hold some identifier, or just use index.
            const originalImageInfo = selectedProduct?.id ? 
              (products.find(p => p.id === selectedProduct.id) as any)?.product_images?.find((pi:any) => pi.image_url === imgUrl && pi.order === index)
              : null;

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
    setIsEditDialogOpen(true);
  };


  const handleEditProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct || !authUser || !storeIdFromUrl) { 
      toast({ variant: "destructive", title: "Error", description: "No product selected, user, or store not identified." });
      return;
    }
    setIsSubmitting(true);

    const productPayload = preparePayload();
    if (!productPayload) {
      setIsSubmitting(false);
      return;
    }
    
    const imagesToSetForService = formImageSlots
        .filter(slot => slot.previewUrl || slot.file) 
        .map((slot, index) => ({
            id: slot.id, 
            file: slot.file || undefined,
            existingUrl: slot.file ? undefined : slot.originalUrl || undefined, 
            order: index, 
        }));

    try {
      const { data: updatedProductFromBackend, error } = await updateProduct(
        selectedProduct.id, 
        authUser.id,
        storeIdFromUrl,
        productPayload,
        imagesToSetForService
      );

      if (error || !updatedProductFromBackend) {
        toast({ variant: "destructive", title: "Error Updating Product", description: error?.message || "Could not update product." });
      } else {
        // const updatedProductUI = mapProductFromSupabaseToUI(updatedProductFromBackend);
        // setProducts(prev => prev.map(p => p.id === updatedProductUI.id ? updatedProductUI : p));
        toast({ title: "Product Updated", description: `${updatedProductFromBackend.name} has been successfully updated.` });
        setIsEditDialogOpen(false);
        resetFormFields();
        setSelectedProduct(null);
         // Trigger refetch of current page
        getProductsByStoreId(storeIdFromUrl, currentPage, ITEMS_PER_PAGE).then(({ data, count }) => {
            if (data) setProducts(data.map(mapProductFromSupabaseToUI));
            if (count !== null) setTotalProducts(count);
        });
      }
    } catch (e) {
        console.error("Error in handleEditProduct:", e);
        toast({ variant: "destructive", title: "Operation Failed", description: "An unexpected error occurred during update."});
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (product: ProductUIType) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct || !authUser || !storeIdFromUrl) {
        toast({ variant: "destructive", title: "Error", description: "No product selected or user/store not identified." });
        return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await deleteProduct(selectedProduct.id, authUser.id, storeIdFromUrl);
      if (error) {
        toast({ variant: "destructive", title: "Error Deleting Product", description: error.message });
      } else {
        // setProducts(prev => prev.filter(p => p.id !== selectedProduct!.id));
        toast({ title: "Product Deleted", description: `${selectedProduct.name} has been successfully deleted.`, variant: "default" }); // Use default for success
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
         // Refetch current page data, potentially moving to previous page if current becomes empty
        setTotalProducts(prev => prev -1);
        const newTotalPages = Math.ceil((totalProducts - 1) / ITEMS_PER_PAGE);
        const newCurrentPage = Math.min(currentPage, newTotalPages > 0 ? newTotalPages : 1);
        if (currentPage !== newCurrentPage) {
            setCurrentPage(newCurrentPage);
        } else {
             getProductsByStoreId(storeIdFromUrl, newCurrentPage, ITEMS_PER_PAGE).then(({ data, count }) => {
                if (data) setProducts(data.map(mapProductFromSupabaseToUI));
                if (count !== null) setTotalProducts(count);
            });
        }
      }
    } catch (e) {
        console.error("Error in handleDeleteProduct:", e);
        toast({ variant: "destructive", title: "Operation Failed", description: "An unexpected error occurred during deletion."});
    } finally {
        setIsSubmitting(false);
    }
  };
  

  const filteredProducts = products.filter(product =>
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderProductFormFields = () => (
    <>
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
        <div key={`image-form-${index}`} className="grid grid-cols-1 md:grid-cols-[2fr_auto] gap-4 items-center border-b pb-3 mb-1">
          <div className="grid gap-2">
            <Label htmlFor={`image_file_${index}`}>Image {index + 1}</Label>
            <Input 
              id={`image_file_${index}`} 
              name={`image_file_${index}`} 
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
    </>
  );

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Package className="h-7 w-7"/>Products</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!storeIdFromUrl || !authUser}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => { setIsAddDialogOpen(isOpen); if (!isOpen) resetFormFields(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setSelectedProduct(null); resetFormFields(); setIsAddDialogOpen(true); }} disabled={!storeIdFromUrl || !authUser}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl"> 
              <DialogHeader>
                <DialogTitle>Add New Product {selectedStoreName ? `for ${selectedStoreName}` : ''}</DialogTitle>
                <DialogDescription>
                  Fill in the details for your new product. Add up to {MAX_IMAGES} images.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct}>
                <ScrollArea className="h-[70vh] pr-6">
                  <div className="grid gap-4 py-4">
                   {renderProductFormFields()}
                  </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t">
                   <Button type="button" variant="outline" onClick={() => {setIsAddDialogOpen(false); resetFormFields();}} disabled={isSubmitting}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || !authUser || !storeIdFromUrl}>{isSubmitting ? "Adding..." : "Add Product"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {!authUser && <p className="text-center text-muted-foreground py-4">Please sign in to manage products.</p>}
      {authUser && !storeIdFromUrl && <p className="text-center text-muted-foreground py-4">Please select a store to view products.</p>}
      {authUser && storeIdFromUrl && selectedStoreName && <p className="text-sm text-muted-foreground">Showing products for store: <span className="font-semibold">{selectedStoreName}</span>. New products will be added to this store.</p>}

      {isLoadingProducts && authUser && storeIdFromUrl && (
        <div className="space-y-2">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <Skeleton key={`skel-prod-row-${i}`} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!isLoadingProducts && authUser && storeIdFromUrl && (
        <Card>
        <CardContent className="pt-6">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead className="hidden md:table-cell">Order Price</TableHead>
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead className="hidden md:table-cell">Created at</TableHead>
                <TableHead> <span className="sr-only">Actions</span> </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.map((product) => (
                <TableRow key={product.id} className="cursor-pointer" onClick={() => router.push(`/products/${product.id}?${searchParams.toString()}`)}>
                    <TableCell className="hidden sm:table-cell">
                    {product.images && product.images.length > 0 ? (
                        <NextImage
                            alt={product.name}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={product.images[0]} 
                            width="64"
                            unoptimized={product.images[0]?.startsWith('blob:')}
                        />
                    ) : (
                        <div className="aspect-square w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                            <ImageIconLucide className="h-8 w-8 text-muted-foreground" />
                        </div>
                    )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                    <Badge variant={
                        product.status === "Active" ? "default" : 
                        product.status === "Draft" ? "secondary" : "outline"
                    } className={cn(
                        product.status === "Active" ? "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30" : 
                        product.status === "Archived" ? "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-400 border-slate-500/30" :
                        "" 
                    )}>
                        {product.status}
                    </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">ZMW {product.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                    <TableCell className="hidden md:table-cell">
                    {product.orderPrice !== undefined ? `ZMW ${product.orderPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                    {product.stock === 0 && product.status === "Active" ? (
                        <span className="text-destructive">Out of Stock</span>
                    ) : (
                        product.stock
                    )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
                            <Link href={`/products/${product.id}?${searchParams.toString()}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(product)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openDeleteDialog(product)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
         {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({totalProducts} products)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
          {totalProducts === 0 && !isLoadingProducts && (
             <CardFooter className="flex items-center justify-center border-t pt-4">
                <p className="text-sm text-muted-foreground">No products found.</p>
             </CardFooter>
          )}
        </Card>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if(!isOpen) { resetFormFields(); setSelectedProduct(null); } }}>
        <DialogContent className="sm:max-w-3xl"> 
          <DialogHeader>
            <DialogTitle>Edit Product {selectedProduct?.name} {selectedStoreName ? `for ${selectedStoreName}` : ''}</DialogTitle>
            <DialogDescription>
              Update the details for {selectedProduct?.name}. Add up to {MAX_IMAGES} images.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && ( 
            <form onSubmit={handleEditProduct}>
              <ScrollArea className="h-[70vh] pr-6">
                <div className="grid gap-4 py-4">
                {renderProductFormFields()}
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => {setIsEditDialogOpen(false); resetFormFields(); setSelectedProduct(null);}} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !authUser || !storeIdFromUrl}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          )}
           {!selectedProduct && isLoadingProducts && ( 
             <div className="py-10 text-center text-muted-foreground">Loading product details for editing...</div>
           )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product "{selectedProduct?.name}". All associated images will also be removed from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedProduct(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!isLoadingProducts && authUser && storeIdFromUrl && filteredProducts.length === 0 && products.length > 0 && (
        <div className="text-center text-muted-foreground py-10">
          No products found matching "{searchTerm}".
        </div>
      )}
    </div>
  );
}
