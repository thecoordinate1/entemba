
"use client";

import * as React from "react";
import Link from "next/link";
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
import { MoreHorizontal, PlusCircle, Edit, Trash2, Search, Eye, Image as ImageIcon, Info, DollarSign } from "lucide-react";
import NextImage from "next/image"; // Renamed to avoid conflict with Lucide Icon
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
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@/lib/mockData";
import { initialProducts } from "@/lib/mockData";
import { Separator } from "@/components/ui/separator";


export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  const processProductFormData = (formData: FormData, currentProduct?: Product): Omit<Product, "id" | "createdAt"> => {
    const images: string[] = [];
    const dataAiHints: string[] = [];

    for (let i = 0; i < 5; i++) {
      const imageUrl = formData.get(`image_url_${i}`) as string;
      const imageHint = formData.get(`image_hint_${i}`) as string;
      if (imageUrl && imageUrl.trim() !== "") {
        images.push(imageUrl.trim());
        dataAiHints.push(imageHint.trim() || `product image ${i + 1}`);
      }
    }
    if (images.length === 0) {
        images.push("https://picsum.photos/id/103/80/80"); // Default placeholder
        dataAiHints.push("product placeholder");
    }

    const priceStr = formData.get("price") as string;
    const price = parseFloat(priceStr);

    const orderPriceStr = formData.get("orderPrice") as string;
    let orderPrice: number | undefined = undefined;
    if (orderPriceStr && orderPriceStr.trim() !== "" && !isNaN(parseFloat(orderPriceStr))) {
        orderPrice = parseFloat(orderPriceStr);
    }


    return {
      name: formData.get("name") as string,
      images,
      dataAiHints,
      category: formData.get("category") as string,
      price: price,
      orderPrice: orderPrice,
      stock: parseInt(formData.get("stock") as string),
      status: (formData.get("status") as Product["status"]) || (currentProduct?.status || "Draft"),
      description: formData.get("description") as string,
      fullDescription: formData.get("fullDescription") as string || formData.get("description") as string,
      sku: formData.get("sku") as string || undefined,
      // tags, weight, dimensions can be added if needed in form
    };
  };


  const handleAddProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const productData = processProductFormData(formData);
    
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      ...productData,
      createdAt: new Date().toISOString().split("T")[0],
    };

    initialProducts.unshift(newProduct);
    setProducts([newProduct, ...products]);
    setIsAddDialogOpen(false);
    toast({ title: "Product Added", description: `${newProduct.name} has been successfully added.` });
  };

  const handleEditProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct) return;
    const formData = new FormData(event.currentTarget);
    const productData = processProductFormData(formData, selectedProduct);

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
    toast({ title: "Product Updated", description: `${updatedProduct.name} has been successfully updated.` });
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
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
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
        {product && ( 
            <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={product.status}>
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
        )}
         {!product && ( // For Add dialog, default status to Draft
             <div className="grid gap-2">
                <Label htmlFor="status_add">Status</Label>
                <Select name="status" defaultValue="Draft">
                <SelectTrigger id="status_add">
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
                </Select>
            </div>
        )}
      </div>


      <Separator className="my-4"/>
      <h4 className="font-medium text-md col-span-full">Product Images (up to 5)</h4>
      {[...Array(5)].map((_, index) => (
        <div key={`image-form-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end border-b pb-3 mb-1">
          <div className="grid gap-2">
            <Label htmlFor={`image_url_${index}`}>Image URL {index + 1}</Label>
            <Input 
              id={`image_url_${index}`} 
              name={`image_url_${index}`} 
              defaultValue={product?.images?.[index] || ""}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`image_hint_${index}`}>AI Hint {index + 1}</Label>
            <Input 
              id={`image_hint_${index}`} 
              name={`image_hint_${index}`} 
              defaultValue={product?.dataAiHints?.[index] || ""}
              placeholder="e.g., 'red car'"
            />
          </div>
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl"> 
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Fill in the details for your new product. Add up to 5 images.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
              {renderProductFormFields()}
              <DialogFooter>
                 <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
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
                        src={product.images[0].replace(/\/\d+\/\d+$/, "/80/80")} 
                        width="64"
                        data-ai-hint={product.dataAiHints[0] || 'product image'}
                    />
                  ) : (
                    <div className="aspect-square w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant={
                    product.status === "Active" ? "default" : 
                    product.status === "Draft" ? "secondary" : "outline"
                  } className={
                    product.status === "Active" ? "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30" : 
                     product.status === "Archived" ? "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-400 border-slate-500/30" :
                    "" 
                  }>
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
                        <Link href={`/products/${product.id}`}>
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
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl"> 
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the details for {selectedProduct?.name}. Add up to 5 images.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <form onSubmit={handleEditProduct} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
              {renderProductFormFields(selectedProduct)}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
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
        <div className="text-center text-muted-foreground py-10">
          No products yet. Click "Add Product" to get started.
        </div>
      )}
    </div>
  );
}
