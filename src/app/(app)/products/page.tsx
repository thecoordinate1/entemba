
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { MoreHorizontal, PlusCircle, Edit, Trash2, Search, Eye, Image as ImageIconLucide, Info, DollarSign, UploadCloud, Tag, Weight, Ruler } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, Store } from "@/lib/mockData";
import { initialProducts, initialStores } from "@/lib/mockData";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const [selectedStoreName, setSelectedStoreName] = React.useState<string | null>(null);

  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  const [formImageSlots, setFormImageSlots] = React.useState<ImageSlot[]>(initialImageSlots());

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
  }, [storeId]);

  const resetImageSlots = () => {
    formImageSlots.forEach(slot => {
      if (slot.previewUrl && slot.file) URL.revokeObjectURL(slot.previewUrl);
    });
    setFormImageSlots(initialImageSlots());
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
        newSlots[index] = { ...oldSlot, file: file, previewUrl: URL.createObjectURL(file), dataUri: null };
      } else {
        newSlots[index] = { ...oldSlot, file: null, previewUrl: oldSlot.dataUri ? oldSlot.dataUri : null };
      }
      return newSlots;
    });
  };
  
  const handleImageHintChange = (index: number, hint: string) => {
    setFormImageSlots(prevSlots => {
      const newSlots = [...prevSlots];
      newSlots[index] = { ...newSlots[index], hint: hint };
      return newSlots;
    });
  };

  const prepareImageSlotsForEdit = (product: Product) => {
    const slotsToEdit = initialImageSlots().map((slot, i) => {
      if (product.images && product.images[i]) {
        return {
          file: null, 
          previewUrl: product.images[i], 
          dataUri: product.images[i], 
          hint: product.dataAiHints[i] || "",
        };
      }
      return slot;
    });
    setFormImageSlots(slotsToEdit);
  };
  
  const processProductForm = async (formData: FormData, currentProduct?: Product): Promise<Omit<Product, "id" | "createdAt">> => {
    const imageUris: string[] = [];
    const imageDataAiHints: string[] = [];

    for (const slot of formImageSlots) {
      if (slot.file) {
        try {
          const dataUri = await fileToDataUri(slot.file);
          imageUris.push(dataUri);
          imageDataAiHints.push(slot.hint || `product image ${imageUris.length}`);
        } catch (error) {
          console.error("Error converting file to data URI:", error);
          toast({ variant: "destructive", title: "Image Processing Error", description: "Could not process one of the images."});
          throw error; // Propagate error to stop form submission
        }
      } else if (slot.dataUri) { 
        imageUris.push(slot.dataUri);
        imageDataAiHints.push(slot.hint || `product image ${imageUris.length}`);
      }
    }
    
    if (imageUris.length === 0) {
        imageUris.push("https://placehold.co/400x300.png"); 
        imageDataAiHints.push("product placeholder");
    }

    const priceStr = formData.get("price") as string;
    const price = parseFloat(priceStr);

    const orderPriceStr = formData.get("orderPrice") as string;
    let orderPrice: number | undefined = undefined;
    if (orderPriceStr && orderPriceStr.trim() !== "" && !isNaN(parseFloat(orderPriceStr))) {
        orderPrice = parseFloat(orderPriceStr);
    }
    
    const tagsStr = formData.get("tags") as string;
    const tags = tagsStr ? tagsStr.split(",").map(tag => tag.trim()).filter(tag => tag) : undefined;

    const weightStr = formData.get("weight") as string;
    const weight = weightStr ? parseFloat(weightStr) : undefined;
    
    const dimLengthStr = formData.get("dimLength") as string;
    const dimWidthStr = formData.get("dimWidth") as string;
    const dimHeightStr = formData.get("dimHeight") as string;
    let dimensions: Product["dimensions"] = undefined;
    if (dimLengthStr && dimWidthStr && dimHeightStr) {
        dimensions = {
            length: parseFloat(dimLengthStr),
            width: parseFloat(dimWidthStr),
            height: parseFloat(dimHeightStr),
        };
    }


    return {
      name: formData.get("name") as string,
      images: imageUris,
      dataAiHints: imageDataAiHints,
      category: formData.get("category") as string,
      price: price,
      orderPrice: orderPrice,
      stock: parseInt(formData.get("stock") as string),
      status: (formData.get("status") as Product["status"]) || (currentProduct?.status || "Draft"),
      description: formData.get("description") as string,
      fullDescription: formData.get("fullDescription") as string || formData.get("description") as string,
      sku: formData.get("sku") as string || undefined,
      tags: tags,
      weight: weight,
      dimensions: dimensions,
    };
  };


  const handleAddProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const productData = await processProductForm(formData);
      
      const newProduct: Product = {
        id: `prod_${Date.now()}`,
        // storeId: storeId || initialStores[0]?.id || "default_store", // Associate with selected store
        ...productData,
        createdAt: new Date().toISOString().split("T")[0],
      };

      initialProducts.unshift(newProduct);
      setProducts([newProduct, ...products]);
      setIsAddDialogOpen(false);
      resetImageSlots();
      (event.target as HTMLFormElement).reset(); // Reset form fields
      toast({ title: "Product Added", description: `${newProduct.name} has been successfully added to ${selectedStoreName || 'the current store'}.` });
    } catch (error) {
      // Error already toasted in processProductForm
    }
  };

  const handleEditProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct) return;
    const formData = new FormData(event.currentTarget);
    try {
      const productData = await processProductForm(formData, selectedProduct);

      const updatedProduct: Product = {
        ...selectedProduct,
        ...productData,
      };
      
      const productIndex = initialProducts.findIndex(p => p.id === selectedProduct.id);
      if (productIndex !== -1) {
        initialProducts[productIndex] = updatedProduct;
      }
      setProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      resetImageSlots();
      toast({ title: "Product Updated", description: `${updatedProduct.name} has been successfully updated for ${selectedStoreName || 'the current store'}.` });
    } catch (error) {
      // Error handling
    }
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct) return;
    const productIndex = initialProducts.findIndex(p => p.id === selectedProduct.id);
    if (productIndex !== -1) {
      initialProducts.splice(productIndex, 1);
    }
    setProducts(products.filter(p => p.id !== selectedProduct.id));
    setIsDeleteDialogOpen(false);
    toast({ title: "Product Deleted", description: `${selectedProduct.name} has been successfully deleted.`, variant: "destructive" });
    setSelectedProduct(null);
  };
  
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    prepareImageSlotsForEdit(product);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const filteredProducts = products.filter(product =>
    // In a real app, products would be filtered by storeId from the backend
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderProductFormFields = (product?: Product) => (
    <>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={product?.name || ""} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Short Description</Label>
        <Textarea id="description" name="description" defaultValue={product?.description || ""} placeholder="A brief summary for product listings." />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="fullDescription">Full Description</Label>
        <Textarea id="fullDescription" name="fullDescription" defaultValue={product?.fullDescription || ""} placeholder="Detailed product information for the product page." rows={3} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" defaultValue={product?.category || ""} required />
        </div>
         <div className="grid gap-2">
          <Label htmlFor="price">Regular Price</Label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price || ""} required className="pl-8" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="orderPrice">Order Price (Optional)</Label>
          <div className="relative">
             <DollarSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="orderPrice" name="orderPrice" type="number" step="0.01" defaultValue={product?.orderPrice !== undefined ? product.orderPrice : ""} placeholder="Defaults to regular price" className="pl-8" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" name="stock" type="number" defaultValue={product?.stock ?? ""} required />
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="sku">SKU (Optional)</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku || ""} />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={product?.status || "Draft"}>
            <SelectTrigger id="status">
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
      
      <Separator className="my-2"/>
      <h4 className="font-medium text-sm col-span-full">Additional Details</h4>
      <div className="grid gap-2">
        <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
        <Input id="tags" name="tags" defaultValue={product?.tags?.join(", ") || ""} placeholder="e.g., featured, summer, sale" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
            <Label htmlFor="weight">Weight (kg, Optional)</Label>
            <div className="relative">
                <Weight className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="weight" name="weight" type="number" step="0.01" defaultValue={product?.weight || ""} placeholder="e.g., 0.5" className="pl-8" />
            </div>
        </div>
      </div>
      <div>
        <Label>Dimensions (cm, Optional)</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
            <Input name="dimLength" type="number" step="0.1" placeholder="Length" defaultValue={product?.dimensions?.length || ""} />
            <Input name="dimWidth" type="number" step="0.1" placeholder="Width" defaultValue={product?.dimensions?.width || ""} />
            <Input name="dimHeight" type="number" step="0.1" placeholder="Height" defaultValue={product?.dimensions?.height || ""}/>
        </div>
      </div>


      <Separator className="my-4"/>
      <h4 className="font-medium text-md col-span-full">Product Images (up to {MAX_IMAGES})</h4>
      {formImageSlots.map((slot, index) => (
        <div key={`image-form-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-center border-b pb-3 mb-1">
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
          <div className="grid gap-2">
            <Label htmlFor={`image_hint_${index}`}>AI Hint {index + 1}</Label>
            <Input 
              id={`image_hint_${index}`} 
              name={`image_hint_${index}`} 
              value={slot.hint}
              onChange={(e) => handleImageHintChange(index, e.target.value)}
              placeholder="e.g., 'red car'"
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


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => { setIsAddDialogOpen(isOpen); if (!isOpen) resetImageSlots(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setSelectedProduct(null); resetImageSlots(); setIsAddDialogOpen(true); }}>
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
                 <Button type="button" variant="outline" onClick={() => {setIsAddDialogOpen(false); resetImageSlots();}}>Cancel</Button>
                <Button type="submit">Add Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {selectedStoreName && <p className="text-sm text-muted-foreground">Showing products for store: <span className="font-semibold">{selectedStoreName}</span>. New products will be added to this store.</p>}


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
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="hidden sm:table-cell">
                  {product.images && product.images.length > 0 ? (
                    <NextImage
                        alt={product.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={product.images[0].startsWith('data:') ? product.images[0] : product.images[0].replace(/\/\d+\/\d+$/, "/80/80")} 
                        width="64"
                        data-ai-hint={product.dataAiHints[0] || 'product image'}
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
                <TableCell className="hidden md:table-cell">${product.price.toFixed(2)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {product.orderPrice !== undefined ? `$${product.orderPrice.toFixed(2)}` : "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {product.stock === 0 && product.status === "Active" ? (
                    <span className="text-destructive">Out of Stock</span>
                  ) : (
                    product.stock
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">{new Date(product.createdAt).toLocaleDateString()}</TableCell>
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
                        <Link href={`/products/${product.id}?${searchParams.toString()}`}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(product)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
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
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if(!isOpen) resetImageSlots(); }}>
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
                {renderProductFormFields(selectedProduct)}
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => {setIsEditDialogOpen(false); resetImageSlots();}}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product "{selectedProduct?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedProduct(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {filteredProducts.length === 0 && searchTerm && (
        <div className="text-center text-muted-foreground py-10">
          No products found matching "{searchTerm}".
        </div>
      )}
       {filteredProducts.length === 0 && !searchTerm && products.length === 0 && (
        <div className="text-center text-muted-foreground py-10 col-span-full">
          No products yet. Click "Add Product" to get started.
        </div>
      )}
    </div>
  );
}

