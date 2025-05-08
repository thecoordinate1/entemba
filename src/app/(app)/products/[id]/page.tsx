
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { initialProducts, type Product } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Star, Tag, Weight, Ruler, ShoppingCart } from "lucide-react";
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


export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params.id as string;

  // In a real app, you'd fetch this data. Here we simulate it.
  // Also, manage product state locally for edits on this page.
  const [product, setProduct] = React.useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const foundProduct = initialProducts.find((p) => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      // Handle product not found, e.g., redirect or show error
      // For now, log and potentially redirect or show a message
      console.error("Product not found");
      // router.push('/products'); // Example redirect
    }
  }, [productId, router]);

  const handleEditProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;
    const formData = new FormData(event.currentTarget);
    const updatedProduct: Product = {
      ...product,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      price: parseFloat(formData.get("price") as string),
      stock: parseInt(formData.get("stock") as string),
      status: formData.get("status") as Product["status"],
      description: formData.get("description") as string,
      fullDescription: formData.get("fullDescription") as string,
      sku: formData.get("sku") as string || undefined,
    };
    // Update product in our "global" state (initialProducts array) for demo purposes
    const productIndex = initialProducts.findIndex(p => p.id === product.id);
    if (productIndex !== -1) {
      initialProducts[productIndex] = updatedProduct;
    }
    setProduct(updatedProduct); // Update local state
    setIsEditDialogOpen(false);
    toast({ title: "Product Updated", description: `${updatedProduct.name} has been successfully updated.` });
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
    ""; // Draft uses default secondary badge

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Edit className="mr-2 h-4 w-4" /> Edit Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit {product.name}</DialogTitle>
              <DialogDescription>
                Update the details for this product.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditProduct} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input id="edit-category" name="category" defaultValue={product.category} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Price</Label>
                  <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={product.price} required />
                </div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input id="edit-stock" name="stock" type="number" defaultValue={product.stock} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-sku">SKU</Label>
                  <Input id="edit-sku" name="sku" defaultValue={product.sku || ""} />
                </div>
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
              {/* Consider adding fields for weight, dimensions, tags if editable */}
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <Image
                src={product.image}
                alt={product.name}
                width={400}
                height={300}
                className="rounded-lg object-cover aspect-[4/3]"
                data-ai-hint={product.dataAiHint}
              />
            </div>
            <div className="md:w-2/3 space-y-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-3xl">{product.name}</CardTitle>
                 <Badge variant={statusBadgeVariant} className={statusBadgeClass}>
                    {product.status}
                  </Badge>
              </div>
              <CardDescription className="text-lg">{product.description}</CardDescription>
              <div className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</div>
              
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                <span className={product.stock > 0 ? "" : "text-destructive"}>
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
                </span>
              </div>
             
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                ))}
                <span className="text-sm text-muted-foreground ml-1">(123 Reviews)</span>
              </div>
              {product.sku && (
                <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
              )}
               <div className="pt-2">
                <Button size="lg">Add to Cart (Placeholder)</Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="my-6" />
          
          <h3 className="text-xl font-semibold mb-3">Product Details</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{product.fullDescription}</p>

          {(product.tags || product.weight || product.dimensions) && <Separator className="my-6" />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.tags && product.tags.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center"><Tag className="mr-2 h-5 w-5 text-primary"/> Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {(product.weight || product.dimensions) && (
               <div>
                <h4 className="font-semibold mb-2">Specifications</h4>
                <Table>
                  <TableBody>
                    {product.weight && (
                      <TableRow>
                        <TableCell className="font-medium flex items-center"><Weight className="mr-2 h-4 w-4 text-muted-foreground"/> Weight</TableCell>
                        <TableCell>{product.weight} kg</TableCell>
                      </TableRow>
                    )}
                    {product.dimensions && (
                       <TableRow>
                        <TableCell className="font-medium flex items-center"><Ruler className="mr-2 h-4 w-4 text-muted-foreground"/> Dimensions</TableCell>
                        <TableCell>{product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Product created on: {new Date(product.createdAt).toLocaleDateString()}
        </CardFooter>
      </Card>

      {/* Placeholder for Related Products or Reviews section */}
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

    