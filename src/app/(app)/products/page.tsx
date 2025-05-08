
"use client";

import * as React from "react";
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
import { MoreHorizontal, PlusCircle, Edit, Trash2, Search, Filter } from "lucide-react";
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

interface Product {
  id: string;
  name: string;
  image: string;
  dataAiHint: string;
  category: string;
  price: number;
  stock: number;
  status: "Active" | "Draft" | "Archived";
  createdAt: string;
}

const initialProducts: Product[] = [
  {
    id: "prod_1",
    name: "Ergonomic Office Chair",
    image: "https://picsum.photos/id/1025/80/80",
    dataAiHint: "chair office",
    category: "Furniture",
    price: 299.99,
    stock: 150,
    status: "Active",
    createdAt: "2023-01-15",
  },
  {
    id: "prod_2",
    name: "Wireless Noise-Cancelling Headphones",
    image: "https://picsum.photos/id/1078/80/80",
    dataAiHint: "headphones tech",
    category: "Electronics",
    price: 199.50,
    stock: 85,
    status: "Active",
    createdAt: "2023-02-20",
  },
  {
    id: "prod_3",
    name: "Organic Cotton T-Shirt",
    image: "https://picsum.photos/id/431/80/80",
    dataAiHint: "shirt fashion",
    category: "Apparel",
    price: 25.00,
    stock: 300,
    status: "Draft",
    createdAt: "2023-03-10",
  },
  {
    id: "prod_4",
    name: "Stainless Steel Water Bottle",
    image: "https://picsum.photos/id/1072/80/80",
    dataAiHint: "bottle lifestyle",
    category: "Home Goods",
    price: 18.75,
    stock: 0,
    status: "Archived",
    createdAt: "2023-04-05",
  },
  {
    id: "prod_5",
    name: "Artisan Coffee Blend",
    image: "https://picsum.photos/id/225/80/80",
    dataAiHint: "coffee food",
    category: "Groceries",
    price: 15.99,
    stock: 200,
    status: "Active",
    createdAt: "2023-05-01",
  },
];

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
    };
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
    };
    setProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
    setIsEditDialogOpen(false);
    setSelectedProduct(null);
    toast({ title: "Product Updated", description: `${updatedProduct.name} has been successfully updated.` });
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct) return;
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
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Fill in the details for your new product.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Input id="category" name="category" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Price</Label>
                <Input id="price" name="price" type="number" step="0.01" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">Stock</Label>
                <Input id="stock" name="stock" type="number" className="col-span-3" required />
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
                    src={product.image}
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
                    product.status === "Draft" ? "" : ""
                  }>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">${product.price.toFixed(2)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {product.stock === 0 ? (
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the details for {selectedProduct?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <form onSubmit={handleEditProduct} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input id="edit-name" name="name" defaultValue={selectedProduct.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">Category</Label>
                <Input id="edit-category" name="category" defaultValue={selectedProduct.category} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">Price</Label>
                <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={selectedProduct.price} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-stock" className="text-right">Stock</Label>
                <Input id="edit-stock" name="stock" type="number" defaultValue={selectedProduct.stock} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">Status</Label>
                <select id="edit-status" name="status" defaultValue={selectedProduct.status} className="col-span-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
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
