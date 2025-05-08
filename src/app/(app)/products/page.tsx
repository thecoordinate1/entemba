
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
import { MoreHorizontal, PlusCircle, Edit, Trash2, Search, Eye } from "lucide-react"; // Removed Filter
import Image from "next/image";
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


export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  const handleAddProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: formData.get("name") as string,
      image: "https://picsum.photos/id/103/80/80", // Placeholder
      dataAiHint: "product placeholder",
      category: formData.get("category") as string,
      price: parseFloat(formData.get("price") as string),
      stock: parseInt(formData.get("stock") as string),
      status: "Draft",
      createdAt: new Date().toISOString().split("T")[0],
      description: formData.get("description") as string,
      fullDescription: formData.get("fullDescription") as string || formData.get("description") as string,
    };
    // Update global state for demo purposes
    initialProducts.unshift(newProduct);
    setProducts([newProduct, ...products]);
    setIsAddDialogOpen(false);
    toast({ title: "Product Added", description: `${newProduct.name} has been successfully added.` });
  };

  const handleEditProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct) return;
    const formData = new FormData(event.currentTarget);
    const updatedProduct: Product = {
      ...selectedProduct,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      price: parseFloat(formData.get("price") as string),
      stock: parseInt(formData.get("stock") as string),
      status: formData.get("status") as Product["status"],
      description: formData.get("description") as string,
      fullDescription: formData.get("fullDescription") as string || formData.get("description") as string,
    };
    // Update global state for demo purposes
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
    // Update global state for demo purposes
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Fill in the details for your new product.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea id="description" name="description" placeholder="A brief summary for product listings." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullDescription">Full Description</Label>
                <Textarea id="fullDescription" name="fullDescription" placeholder="Detailed product information for the product page." rows={5} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" step="0.01" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" name="stock" type="number" required />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="sku">SKU (Optional)</Label>
                  <Input id="sku" name="sku" />
                </div>
              </div>
              {/* Image upload can be added here */}
              <DialogFooter>
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
                  <Image
                    alt={product.name}
                    className="aspect-square rounded-md object-cover"
                    height="64"
                    src={product.image.replace(/\/\d+\/\d+$/, "/80/80")} // Use smaller image for table
                    width="64"
                    data-ai-hint={product.dataAiHint}
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant={
                    product.status === "Active" ? "default" : 
                    product.status === "Draft" ? "secondary" : "outline"
                  } className={
                    product.status === "Active" ? "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30" : 
                     product.status === "Archived" ? "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-400 border-slate-500/30" :
                    "" // Draft uses default secondary badge
                  }>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">${product.price.toFixed(2)}</TableCell>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the details for {selectedProduct?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <form onSubmit={handleEditProduct} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" name="name" defaultValue={selectedProduct.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Short Description</Label>
                <Textarea id="edit-description" name="description" defaultValue={selectedProduct.description} placeholder="A brief summary for product listings." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-fullDescription">Full Description</Label>
                <Textarea id="edit-fullDescription" name="fullDescription" defaultValue={selectedProduct.fullDescription} placeholder="Detailed product information for the product page." rows={5}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input id="edit-category" name="category" defaultValue={selectedProduct.category} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Price</Label>
                  <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={selectedProduct.price} required />
                </div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input id="edit-stock" name="stock" type="number" defaultValue={selectedProduct.stock} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-sku">SKU</Label>
                  <Input id="edit-sku" name="sku" defaultValue={selectedProduct.sku || ""} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                 <Select name="status" defaultValue={selectedProduct.status}>
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
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Product Alert Dialog */}
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
       {filteredProducts.length === 0 && !searchTerm && (
        <div className="text-center text-muted-foreground py-10">
          No products yet. Click "Add Product" to get started.
        </div>
      )}
    </div>
  );
}

    
