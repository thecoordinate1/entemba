
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
import { ArrowLeft, Edit, Star, Tag, Weight, Ruler, ShoppingCart, Image as ImageIcon, Info } from "lucide-react";
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


export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params.id as string;

  const [product, setProduct] = React.useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  React.useEffect(() => {
    const foundProduct = initialProducts.find((p) => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedImageIndex(0); // Reset to first image on product change
    } else {
      console.error("Product not found");
    }
  }, [productId]);

  const handleEditProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;
    const formData = new FormData(event.currentTarget);
    
    const updatedImages: string[] = [];
    const updatedDataAiHints: string[] = [];

    for (let i = 0; i < 5; i++) {
      const imageUrl = formData.get(`image_url_${i}`) as string;
      const imageHint = formData.get(`image_hint_${i}`) as string;
      if (imageUrl && imageUrl.trim() !== "") {
        updatedImages.push(imageUrl.trim());
        updatedDataAiHints.push(imageHint.trim() || `product image ${i + 1}`);
      }
    }
    // Ensure at least one placeholder if all are empty, or handle as error
    if (updatedImages.length === 0) {
        updatedImages.push("https://picsum.photos/id/100/400/300"); // Default placeholder
        updatedDataAiHints.push("placeholder image");
    }


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
      images: updatedImages,
      dataAiHints: updatedDataAiHints,
    };
    
    const productIndex = initialProducts.findIndex(p => p.id === product.id);
    if (productIndex !== -1) {
      initialProducts[productIndex] = updatedProduct;
    }
    setProduct(updatedProduct);
    setSelectedImageIndex(0); // Reset to first image after edit
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
    ""; 

  const currentImage = product.images[selectedImageIndex] || "https://picsum.photos/400/300?grayscale";
  const currentDataAiHint = product.dataAiHints[selectedImageIndex] || "product image";

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
          <DialogContent className="sm:max-w-3xl"> {/* Increased width for more fields */}
            <DialogHeader>
              <DialogTitle>Edit {product.name}</DialogTitle>
              <DialogDescription>
                Update the details for this product. You can add up to 5 images.
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

              <Separator />
              <h4 className="font-medium text-lg">Product Images (up to 5)</h4>
              {[...Array(5)].map((_, index) => (
                <div key={`image-edit-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end border-b pb-4 mb-2">
                  <div className="grid gap-2">
                    <Label htmlFor={`edit-image_url_${index}`}>Image URL {index + 1}</Label>
                    <Input 
                      id={`edit-image_url_${index}`} 
                      name={`image_url_${index}`} 
                      defaultValue={product.images[index] || ""}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`edit-image_hint_${index}`}>AI Hint {index + 1} (for image search)</Label>
                    <Input 
                      id={`edit-image_hint_${index}`} 
                      name={`image_hint_${index}`} 
                      defaultValue={product.dataAiHints[index] || ""}
                      placeholder="e.g., 'red car' or 'landscape mountain'"
                    />
                  </div>
                </div>
              ))}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/5"> {/* Adjusted width for image gallery */}
              <Image
                src={currentImage}
                alt={`${product.name} - image ${selectedImageIndex + 1}`}
                width={600}
                height={450}
                className="rounded-lg object-cover aspect-[4/3] w-full border"
                data-ai-hint={currentDataAiHint}
                priority={selectedImageIndex === 0} // Prioritize loading the first image
              />
              {product.images && product.images.length > 1 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {product.images.map((imgUrl, index) => (
                    imgUrl && ( // Ensure imgUrl is not empty
                       <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={cn(
                          "rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-primary",
                          selectedImageIndex === index ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-muted-foreground"
                        )}
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
            <div className="md:w-3/5 space-y-3"> {/* Adjusted width */}
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
