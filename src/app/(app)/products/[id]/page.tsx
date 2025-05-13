
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { initialProducts, type Product } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Star, Tag, Weight, Ruler, ShoppingCart, DollarSign, UploadCloud } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const MAX_IMAGES = 5;

interface ImageSlot {
  file: File | null;
  previewUrl: string | null;
  dataUri: string | null; 
  hint: string;
}

const initialImageSlots = (): ImageSlot[] => Array(MAX_IMAGES).fill(null).map(() => ({
  file: null,
  previewUrl: null,
  dataUri: null,
  hint: "",
}));

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params.id as string;

  const [product, setProduct] = React.useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  
  const [editFormImageSlots, setEditFormImageSlots] = React.useState<ImageSlot[]>(initialImageSlots());

  React.useEffect(() => {
    const foundProduct = initialProducts.find((p) => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedImageIndex(0);
      // Prepare image slots when product is loaded for the edit dialog
      const slots = initialImageSlots().map((slot, i) => {
        if (foundProduct.images && foundProduct.images[i]) {
          return {
            file: null,
            previewUrl: foundProduct.images[i], // dataURI or http URL
            dataUri: foundProduct.images[i],
            hint: foundProduct.dataAiHints[i] || "",
          };
        }
        return slot;
      });
      setEditFormImageSlots(slots);
    } else {
      console.error("Product not found");
    }
  }, [productId]);

  const resetEditImageSlots = () => {
    editFormImageSlots.forEach(slot => {
      if (slot.previewUrl && slot.file) URL.revokeObjectURL(slot.previewUrl);
    });
    // Re-initialize from current product or completely reset if needed
    if (product) {
        const slots = initialImageSlots().map((slot, i) => {
            if (product.images && product.images[i]) {
              return {
                file: null, previewUrl: product.images[i], dataUri: product.images[i], hint: product.dataAiHints[i] || "",
              };
            }
            return slot;
          });
        setEditFormImageSlots(slots);
    } else {
        setEditFormImageSlots(initialImageSlots());
    }
  };

  const handleEditImageFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setEditFormImageSlots(prevSlots => {
      const newSlots = [...prevSlots];
      const oldSlot = newSlots[index];
      if (oldSlot.previewUrl && oldSlot.file) URL.revokeObjectURL(oldSlot.previewUrl);

      if (file) {
        newSlots[index] = { ...oldSlot, file, previewUrl: URL.createObjectURL(file), dataUri: null };
      } else {
        newSlots[index] = { ...oldSlot, file: null, previewUrl: oldSlot.dataUri ? oldSlot.dataUri : null };
      }
      return newSlots;
    });
  };

  const handleEditImageHintChange = (index: number, hint: string) => {
    setEditFormImageSlots(prevSlots => {
      const newSlots = [...prevSlots];
      newSlots[index] = { ...newSlots[index], hint };
      return newSlots;
    });
  };


  const handleEditProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;
    const formData = new FormData(event.currentTarget);
    
    const updatedImageUris: string[] = [];
    const updatedDataAiHints: string[] = [];

    for (const slot of editFormImageSlots) {
      if (slot.file) {
        try {
          const dataUri = await fileToDataUri(slot.file);
          updatedImageUris.push(dataUri);
          updatedDataAiHints.push(slot.hint || `product image ${updatedImageUris.length}`);
        } catch (error) {
          console.error("Error converting file to data URI:", error);
          toast({ variant: "destructive", title: "Image Error", description: "Failed to process an image."});
          return; 
        }
      } else if (slot.dataUri) { // Existing image (dataUri or http URL)
        updatedImageUris.push(slot.dataUri);
        updatedDataAiHints.push(slot.hint || `product image ${updatedImageUris.length}`);
      }
    }
     if (updatedImageUris.length === 0) { // Ensure at least one placeholder if all removed
        updatedImageUris.push("https://picsum.photos/id/100/400/300"); 
        updatedDataAiHints.push("placeholder image");
    }


    const priceStr = formData.get("price") as string;
    const price = parseFloat(priceStr);

    const orderPriceStr = formData.get("orderPrice") as string;
    let orderPrice: number | undefined = undefined;
    if (orderPriceStr && orderPriceStr.trim() !== "" && !isNaN(parseFloat(orderPriceStr))) {
        orderPrice = parseFloat(orderPriceStr);
    }

    const updatedProductData: Product = {
      ...product,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      price: price,
      orderPrice: orderPrice,
      stock: parseInt(formData.get("stock") as string),
      status: formData.get("status") as Product["status"],
      description: formData.get("description") as string,
      fullDescription: formData.get("fullDescription") as string,
      sku: formData.get("sku") as string || undefined,
      images: updatedImageUris,
      dataAiHints: updatedDataAiHints,
    };
    
    const productIndex = initialProducts.findIndex(p => p.id === product.id);
    if (productIndex !== -1) {
      initialProducts[productIndex] = updatedProductData;
    }
    setProduct(updatedProductData);
    setSelectedImageIndex(0); // Reset to first image on successful update
    setIsEditDialogOpen(false);
    // Image slots will be reset via onOpenChange or if user re-opens.
    toast({ title: "Product Updated", description: `${updatedProductData.name} has been successfully updated.` });
  };


  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading product details or product not found...</p>
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

  const currentImage = product.images[selectedImageIndex] || "https://picsum.photos/id/101/600/450?grayscale";
  const currentDataAiHint = product.dataAiHints[selectedImageIndex] || "product image";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) resetEditImageSlots();}}>
          <DialogTrigger asChild>
            <Button onClick={() => { /* ensure editFormImageSlots is up to date if product changed */
                 if (product) {
                    const slots = initialImageSlots().map((slot, i) => {
                        if (product.images && product.images[i]) {
                          return { file: null, previewUrl: product.images[i], dataUri: product.images[i], hint: product.dataAiHints[i] || "" };
                        }
                        return slot;
                      });
                    setEditFormImageSlots(slots);
                 }
                setIsEditDialogOpen(true);
            }}>
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
                    <Label htmlFor="edit-name">Name</Label>
                    <Input id="edit-name" name="name" defaultValue={product.name} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Short Description</Label>
                    <Textarea id="edit-description" name="description" defaultValue={product.description} placeholder="A brief summary for product listings." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-fullDescription">Full Description</Label>
                    <Textarea id="edit-fullDescription" name="fullDescription" defaultValue={product.fullDescription} placeholder="Detailed product information for the product page." rows={5}/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Input id="edit-category" name="category" defaultValue={product.category} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-price">Regular Price</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={product.price} required className="pl-8" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-orderPrice">Order Price (Optional)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="edit-orderPrice" name="orderPrice" type="number" step="0.01" defaultValue={product.orderPrice !== undefined ? product.orderPrice : ""} placeholder="Defaults to regular price" className="pl-8" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-stock">Stock</Label>
                      <Input id="edit-stock" name="stock" type="number" defaultValue={product.stock} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-sku">SKU</Label>
                      <Input id="edit-sku" name="sku" defaultValue={product.sku || ""} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <Select name="status" defaultValue={product.status}>
                        <SelectTrigger id="edit-status">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <Separator className="my-4"/>
                  <h4 className="font-medium text-md col-span-full">Product Images (up to {MAX_IMAGES})</h4>
                  {editFormImageSlots.map((slot, index) => (
                    <div key={`image-edit-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-center border-b pb-3 mb-1">
                      <div className="grid gap-2">
                        <Label htmlFor={`edit-image_file_${index}`}>Image {index + 1}</Label>
                        <Input 
                          id={`edit-image_file_${index}`} 
                          name={`edit-image_file_${index}`} 
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEditImageFileChange(index, e)}
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`edit-image_hint_${index}`}>AI Hint {index + 1}</Label>
                        <Input 
                          id={`edit-image_hint_${index}`} 
                          name={`edit-image_hint_${index}`} 
                          value={slot.hint}
                          onChange={(e) => handleEditImageHintChange(index, e.target.value)}
                          placeholder="e.g., 'red car'"
                        />
                      </div>
                      {slot.previewUrl && (
                        <div className="mt-2 md:mt-0 md:self-end">
                          <Image
                            src={slot.previewUrl} // This could be object URL or existing data/http URL
                            alt={`Preview ${index + 1}`}
                            width={64}
                            height={64}
                            className="rounded-md object-cover h-16 w-16 border"
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
                <Button type="button" variant="outline" onClick={() => {setIsEditDialogOpen(false); resetEditImageSlots();}}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/5">
              <Image
                src={currentImage}
                alt={`${product.name} - image ${selectedImageIndex + 1}`}
                width={600}
                height={450}
                className="rounded-lg object-cover aspect-[4/3] w-full border"
                data-ai-hint={currentDataAiHint}
                priority={selectedImageIndex === 0} 
              />
              {product.images && product.images.length > 1 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {product.images.map((imgUrl, index) => (
                    imgUrl && ( 
                       <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={cn(
                          "rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-primary transition-all",
                          selectedImageIndex === index ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-muted-foreground/50"
                        )}
                        aria-label={`View image ${index + 1} for ${product.name}`}
                      >
                        <Image
                          src={imgUrl}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          width={100}
                          height={75}
                          className="object-cover aspect-[4/3] w-full h-full"
                          data-ai-hint={product.dataAiHints[index] || `thumbnail ${index + 1}`}
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
                <div className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</div>
                {product.orderPrice !== undefined && product.orderPrice !== product.price && (
                  <div className="text-xl font-semibold text-muted-foreground">
                    Order Price: <span className="text-accent">${product.orderPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                <span className={cn("text-sm", product.stock > 0 ? "text-foreground" : "text-destructive font-semibold")}>
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
                </span>
              </div>
             
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < 4 ? "text-yellow-400 fill-current" : "text-muted-foreground"}`} />
                ))}
                <span className="text-sm text-muted-foreground ml-1">(123 Reviews)</span>
              </div>
              {product.sku && (
                <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
              )}
               <div className="pt-2">
                <Button size="lg" className="w-full sm:w-auto">Add to Cart (Placeholder)</Button>
              </div>
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
                        <TableCell className="py-2 px-0">{product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm</TableCell>
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

      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Customer reviews will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
