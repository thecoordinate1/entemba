"use client";

import * as React from "react";
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
import { MobileProductCard } from "@/components/MobileProductCard";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Plus, Search, Filter, Loader2, Package, Tag, AlertCircle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import {
  createProduct,
  getProductsByStoreId,
  updateProduct,
  deleteProduct,
  getStoreInventoryStats,
  type ProductPayload,
  type ProductFromSupabase,
} from "@/services/productService";
import { MetricCard } from "@/components/MetricCard";
import { getCurrentVendorProfile } from "@/services/userService";
import { ProductForm, type ProductFormValues } from "./components/product-form";

const ITEMS_PER_PAGE = 10;

// --- Types ---
interface ProductUI {
  id: string;
  name: string;
  image: string | null;
  category: string;
  price: number;
  stock: number;
  status: 'Active' | 'Draft' | 'Archived';
  sku?: string;
  raw: ProductFromSupabase; // Keep raw data for editing
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams.get("storeId");
  const { toast } = useToast();
  const supabase = createClient();

  const [authUser, setAuthUser] = React.useState<User | null>(null);
  const [isSupplier, setIsSupplier] = React.useState(false);
  const [products, setProducts] = React.useState<ProductUI[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  const [totalProducts, setTotalProducts] = React.useState(0);

  // Stats State
  const [productsCount, setProductsCount] = React.useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = React.useState<number | null>(null);
  const [activeProductsCount, setActiveProductsCount] = React.useState<number | null>(null);
  const [totalInventoryValue, setTotalInventoryValue] = React.useState<number | null>(null);

  // Form State
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductFromSupabase | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // --- Data Fetching ---

  React.useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setAuthUser(user);
      if (user) {
        const { profile } = await getCurrentVendorProfile(user.id);
        if (profile?.is_supplier) setIsSupplier(true);
      }
    });
  }, [supabase]);

  const fetchProducts = React.useCallback(async () => {
    if (!storeIdFromUrl) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, count, error } = await getProductsByStoreId(storeIdFromUrl, currentPage, ITEMS_PER_PAGE);
      if (error) throw error;

      if (data) {
        setProducts(data.map(p => {
          const defaultVariant = p.product_variants?.find(v => v.is_default);
          // Fallback logic if variants aren't fully populated yet
          const price = defaultVariant?.price ?? p.price;
          const stock = p.product_variants?.length ? p.product_variants.reduce((acc: number, v: any) => acc + v.stock, 0) : p.stock;

          return {
            id: p.id,
            name: p.name,
            image: p.product_images?.[0]?.image_url || null,
            category: p.category,
            price: price,
            stock: stock,
            status: p.status,
            sku: defaultVariant?.sku || p.sku || undefined,
            raw: p
          };
        }));
        setTotalProducts(count || 0);
      }

      // Fetch Stats
      const { data: statsData } = await getStoreInventoryStats(storeIdFromUrl);
      if (statsData) {
        setProductsCount(statsData.totalProducts);
        setActiveProductsCount(statsData.activeProducts);
        setLowStockCount(statsData.lowStockProducts);
        setTotalInventoryValue(statsData.totalMarketValue);
      }

    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [storeIdFromUrl, currentPage, toast]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  // --- Handlers ---

  const handleCreate = () => {
    setEditingProduct(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (product: ProductUI) => {
    setEditingProduct(product.raw);
    setIsSheetOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    if (!authUser || !storeIdFromUrl) return;

    try {
      const { error } = await deleteProduct(productId, authUser.id, storeIdFromUrl);
      if (error) throw error;
      toast({ title: "Product Deleted" });
      fetchProducts();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleFormSubmit = async (values: ProductFormValues, images: { file: File | null; id?: string; preview: string; order: number }[]) => {
    if (!authUser || !storeIdFromUrl) return;
    setIsSubmitting(true);

    // Transform Form Values to Payload
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
    };

    // Prepare Images
    // For Update: We need to map existing images and new files
    // For Create: Just files

    try {
      if (editingProduct) {
        // Update
        const imagesToUpdate = images.map((img, idx) => ({
          id: img.id,
          file: img.file || undefined,
          existingUrl: img.file ? undefined : img.preview,
          order: idx
        }));

        const { error } = await updateProduct(editingProduct.id, authUser.id, storeIdFromUrl, payload, imagesToUpdate);
        if (error) throw error;
        toast({ title: "Product Updated" });

      } else {
        // Create
        const filesOnly = images.filter(i => i.file).map(i => ({ file: i.file!, order: i.order }));
        const { error } = await createProduct(authUser.id, storeIdFromUrl, payload, filesOnly);
        if (error) throw error;
        toast({ title: "Product Created" });
      }

      setIsSheetOpen(false);
      fetchProducts();

    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };




  const filterType = searchParams.get("filter"); // 'dropship'

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'dropship') {
      return matchesSearch && p.raw.is_dropshippable;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20 p-2 sm:p-6 bg-muted/5 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">Manage your store's inventory and listings.</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Products"
          value={productsCount !== null ? productsCount.toString() : "-"}
          icon={Package}
        />
        <MetricCard
          title="Active Listings"
          value={activeProductsCount !== null ? activeProductsCount.toString() : "-"}
          icon={Package} // Using Package for now, consider Globe or Tag
          description="Visible to customers"
        />
        <MetricCard
          title="Low Stock"
          value={lowStockCount !== null ? lowStockCount.toString() : "-"}
          icon={AlertCircle}
          trend={lowStockCount && lowStockCount > 0 ? "Needs Attention" : undefined}
          trendType="negative"
        />
        <MetricCard
          title="Inventory Value"
          value={totalInventoryValue !== null ? `ZMW ${totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "-"}
          icon={Package} // Using Package or DollarSign? DollarSign makes sense for value.
          description="Est. retail value"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 mb-4">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0"><Filter className="h-4 w-4" /></Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-muted/30">
          <Package className="h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="font-semibold text-lg">No products found</h3>
          <p className="text-muted-foreground text-sm mb-4">Get started by adding your first item.</p>
          <Button variant="outline" onClick={handleCreate}>Add Product</Button>
        </div>
      ) : (
        <>
          {/* Mobile List View (Cards) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredProducts.map(product => (
              <MobileProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={false} // You might want to track this per item or globally
              />
            ))}
          </div>

          {/* Desktop List View (Table) */}
          <div className="hidden md:block border rounded-xl bg-background shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/products/${product.id}?storeId=${storeIdFromUrl}`)}>
                    <TableCell>
                      <div className="h-10 w-10 rounded bg-muted overflow-hidden">
                        {product.image && <img src={product.image} className="w-full h-full object-cover" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>ZMW {product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/products/${product.id}?storeId=${storeIdFromUrl}`); }}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(product); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Add/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-xl md:max-w-2xl w-full p-0 overflow-y-auto bg-muted/10">
          <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-6 py-4">
            <SheetHeader>
              <SheetTitle>{editingProduct ? "Edit Product" : "Add New Product"}</SheetTitle>
              <SheetDescription>Fill in the details below.</SheetDescription>
            </SheetHeader>
          </div>
          <div className="px-6 py-6">
            <ProductForm
              initialData={editingProduct}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => setIsSheetOpen(false)}
              isSupplier={isSupplier}
            />
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
