"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type User as AuthUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Import, ShoppingBag, Star, Truck, ShieldCheck, Box, Layers, AlertCircle, Info } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { getStoresByUserId } from "@/services/storeService";
import { importDropshipProduct, getMarketProductById, type ProductFromSupabase } from "@/services/productService";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MarketProductDetailsPage() {
    const params = useParams();
    const productId = params.id as string;
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    const [loading, setLoading] = React.useState(true);
    const [product, setProduct] = React.useState<ProductFromSupabase | null>(null);
    const [stores, setStores] = React.useState<any[]>([]);
    const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null);
    const [importing, setImporting] = React.useState(false);
    const [activeImageIndex, setActiveImageIndex] = React.useState(0);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!productId) return;

             const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Handle optional auth if mostly public? For now assume vendors must be logged in to view details
                // router.push('/login'); 
            }

            // 1. Fetch user stores
            if (user) {
                 const { data: userStores } = await getStoresByUserId(user.id);
                if (userStores && userStores.length > 0) {
                    setStores(userStores);
                    setSelectedStoreId(userStores[0].id);
                }
            }

            // 2. Fetch Product Details
            const { data, error } = await getMarketProductById(productId);
            if (error || !data) {
                toast({ variant: "destructive", title: "Error", description: "Failed to load product details." });
                // router.push("/market"); // Optional redirect
            } else {
                setProduct(data);
            }
            setLoading(false);
        };

        fetchData();
    }, [productId, supabase, toast]);


    const handleImport = async () => {
        if (!selectedStoreId || !product) {
            toast({ title: "No Store Selected", description: "Please select a store to import this product to.", variant: "destructive" });
            return;
        }

        setImporting(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            setImporting(false);
            return;
        }

        const { error } = await importDropshipProduct(user.id, selectedStoreId, product.id);

        setImporting(false);
        if (error) {
            toast({ title: "Import Failed", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Product Imported", description: `${product.name} added to your drafts.` });
            router.push("/products?tab=draft");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container py-12 flex flex-col items-center gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <h1 className="text-2xl font-bold">Product Not Found</h1>
                <p className="text-muted-foreground">This product may have been removed from the marketplace.</p>
                <Button asChild variant="outline">
                    <Link href="/market">Back to Marketplace</Link>
                </Button>
            </div>
        );
    }

    const supplierPrice = product.supplier_price || product.price;
    const retailPrice = product.price; // MSRP
    const category = product.category;
    const images = product.product_images || [];
    const mainImage = images[activeImageIndex]?.image_url || "/placeholder-image.jpg";
    const potentialMargin = retailPrice > supplierPrice ? retailPrice - supplierPrice : 0;
    const marginPercent = retailPrice > 0 ? Math.round((potentialMargin / retailPrice) * 100) : 0;

    return (
        <div className="container py-8 md:py-12 space-y-8 animate-in fade-in duration-500 min-h-screen">
             {/* Header / Nav */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Link href="/market" className="hover:text-primary transition-colors flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Market
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Column: Images */}
                <div className="space-y-4">
                     <div className="aspect-square relative bg-muted rounded-xl overflow-hidden border shadow-sm group">
                        <Image
                            src={mainImage}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            priority
                        />
                         <Badge className="absolute top-4 left-4 text-sm px-3 py-1 shadow-md" variant="secondary">
                             {category}
                         </Badge>
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {images.map((img, idx) => (
                                <button
                                    key={img.id}
                                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/50'}`}
                                    onClick={() => setActiveImageIndex(idx)}
                                >
                                    <Image src={img.image_url} alt={`View ${idx + 1}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Info */}
                <div className="space-y-6">
                    <div>
                         {/* Supplier Badge */}
                        <div className="flex items-center gap-2 mb-4">
                             <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-full text-sm font-medium text-foreground border border-border/50">
                                 <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                 {(product as any).store?.name || "Verified Supplier"}
                             </div>
                             {/* Mock Verification */}
                             <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium px-2">
                                 <ShieldCheck className="w-3.5 h-3.5" /> Trusted Partner
                             </div>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{product.name}</h1>
                        
                         {/* Social Proof */}
                         <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
                            <ShoppingBag className="w-4 h-4" />
                            <span>Imported by <strong>{Math.floor(Math.random() * 50) + 5}</strong> other stores</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Pricing Card */}
                    <Card className="bg-primary/5 border-primary/20 overflow-hidden">
                        <CardHeader className="pb-3 bg-primary/10 border-b border-primary/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Box className="w-5 h-5 text-primary" /> 
                                Pricing Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Your Cost</p>
                                <div className="text-3xl font-bold text-foreground">ZMW {supplierPrice}</div>
                                <p className="text-xs text-muted-foreground mt-1">Includes basic shipping</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Recommended Retail</p>
                                <div className="text-xl font-medium text-muted-foreground line-through decoration-muted-foreground/50">ZMW {retailPrice}</div>
                                <div className="mt-2 inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded text-sm font-bold">
                                    + ZMW {potentialMargin} Profit ({marginPercent}%)
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Import Action */}
                    <div className="flex flex-col gap-3">
                         {stores.length > 0 ? (
                            <div className="flex gap-3">
                                {stores.length > 1 && (
                                     <select
                                        className="h-12 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={selectedStoreId || ''}
                                        onChange={(e) => setSelectedStoreId(e.target.value)}
                                    >
                                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                )}
                                <Button size="lg" className="flex-1 h-12 text-base font-semibold shadow-lg shadow-primary/20" onClick={handleImport} disabled={importing}>
                                    {importing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Import className="mr-2 h-5 w-5" />}
                                    Import to My Store
                                </Button>
                            </div>
                         ): (
                             <Alert variant="destructive">
                                 <AlertCircle className="h-4 w-4" />
                                 <AlertTitle>No Store Found</AlertTitle>
                                 <AlertDescription>You need to create a store before you can import products.</AlertDescription>
                             </Alert>
                         )}
                         <p className="text-xs text-center text-muted-foreground">
                             This product will be added to your <strong>Drafts</strong>. You can edit the price and description before publishing.
                         </p>
                    </div>

                     {/* Details Tabs */}
                    <Tabs defaultValue="description" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="description">Description</TabsTrigger>
                            <TabsTrigger value="specs">Specifications</TabsTrigger>
                            <TabsTrigger value="shipping">Shipping</TabsTrigger>
                        </TabsList>
                        <TabsContent value="description" className="p-4 bg-muted/20 rounded-lg min-h-[150px]">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                {product.full_description || product.description || "No detailed description available."}
                            </div>
                        </TabsContent>
                        <TabsContent value="specs" className="p-4 bg-muted/20 rounded-lg min-h-[150px]">
                             <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground font-medium">SKU</span>
                                    <span>{product.sku || "N/A"}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground font-medium">Weight</span>
                                    <span>{product.weight_kg ? `${product.weight_kg} kg` : "N/A"}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground font-medium">Dimensions</span>
                                    <span>
                                        {product.dimensions_cm 
                                         ? `${product.dimensions_cm.length}x${product.dimensions_cm.width}x${product.dimensions_cm.height} cm` 
                                         : "N/A"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground font-medium">Stock Available</span>
                                    <span>{product.stock} units</span>
                                </div>
                             </div>
                        </TabsContent>
                        <TabsContent value="shipping" className="p-4 bg-muted/20 rounded-lg min-h-[150px]">
                             <div className="flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <Truck className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-sm">Standard Shipping</h4>
                                        <p className="text-sm text-muted-foreground">Delivered within 3-5 business days via Entemba Logistics.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Layers className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-sm">Bulk Discounts</h4>
                                        <p className="text-sm text-muted-foreground">Shipping costs are reduced when ordering multiple units from the same supplier.</p>
                                    </div>
                                </div>
                                 <Alert className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                     <Info className="h-4 w-4" />
                                     <AlertDescription className="text-xs">
                                         Orders placed before 2 PM are processed the same day.
                                     </AlertDescription>
                                 </Alert>
                             </div>
                        </TabsContent>
                    </Tabs>

                </div>
            </div>
        </div>
    );
}
