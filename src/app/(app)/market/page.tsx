"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type User as AuthUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Import, Filter, ShoppingBag, TrendingUp, Package, Tag, ArrowUpRight, CheckCircle2, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { getStoresByUserId } from "@/services/storeService";
import { importDropshipProduct, getDropshippableProducts, type ProductFromSupabase } from "@/services/productService";
import { MetricCard } from "@/components/MetricCard";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function MarketPage() {
    const [loading, setLoading] = React.useState(true);
    const [products, setProducts] = React.useState<ProductFromSupabase[]>([]);
    const [stores, setStores] = React.useState<any[]>([]);
    const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [importingId, setImportingId] = React.useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
    const [sortOrder, setSortOrder] = React.useState<string>("featured");

    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    // Fetch Dropshippable Products
    React.useEffect(() => {
        const fetchMarketData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // public currently?

            // 1. Fetch user stores to know where to import to
            const { data: userStores } = await getStoresByUserId(user.id);
            if (userStores && userStores.length > 0) {
                setStores(userStores);
                setSelectedStoreId(userStores[0].id);
            }

            // 2. Fetch dropshippable products via service
            const { data: marketProducts, error } = await getDropshippableProducts(userStores?.[0]?.id);

            if (error) {
                console.error("Error fetching market:", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to load marketplace products." });
            } else {
                setProducts(marketProducts || []);
            }
            setLoading(false);
        };

        fetchMarketData();
    }, [supabase]);

    const handleImport = async (product: any) => {
        if (!selectedStoreId) {
            toast({ title: "No Store Found", description: "You need a store to import products.", variant: "destructive" });
            return;
        }
        setImportingId(product.id);

        // Call service to import
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await importDropshipProduct(user.id, selectedStoreId, product.id);

        setImportingId(null);
        if (error) {
            toast({ title: "Import Failed", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Product Imported", description: `${product.name} has been added to your draft products.` });
            router.push("/products?tab=draft");
        }
    };

    // Calculate mock metrics based on loaded products for now
    const totalMarketProducts = products.length;
    const avgMargin = React.useMemo(() => {
        if (products.length === 0) return 0;
        // Mock margin calculation if not strictly in DB
        return 22; // Hardcoded mock for visual impact based on plan, or average from products
    }, [products]);

    // Categories derived from products
    const categories = React.useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return Array.from(cats);
    }, [products]);

    const filteredProducts = products
        .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a: any, b: any) => {
            if (sortOrder === "price-low") return (a.supplier_price || 0) - (b.supplier_price || 0);
            if (sortOrder === "price-high") return (b.supplier_price || 0) - (a.supplier_price || 0);
            if (sortOrder === "margin") return (b.price - b.supplier_price) - (a.price - a.supplier_price); // Mock logic
            return 0; // featured
        });

    return (
        <div className="container py-8 space-y-8 animate-in fade-in duration-500 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Supplier Marketplace</h1>
                    <p className="text-muted-foreground mt-2">Discover premium products from verified dropshipping suppliers.</p>
                </div>
                <div className="flex items-center gap-2">
                    {stores.length > 1 && (
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                            value={selectedStoreId || ''}
                            onChange={(e) => setSelectedStoreId(e.target.value)}
                        >
                            {stores.map(s => <option key={s.id} value={s.id}>Import to: {s.name}</option>)}
                        </select>
                    )}
                    <Button variant="outline" asChild>
                        <Link href="/supplier">
                            Become a Supplier
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Available Products"
                    value={totalMarketProducts.toString()}
                    icon={Package}
                    description="Ready to import"
                />
                <MetricCard
                    title="Avg. Profit Margin"
                    value={`${avgMargin}%`}
                    icon={TrendingUp}
                    description="Estimated earnings"
                    trend="+2.4%"
                    trendType="positive"
                />
                <MetricCard
                    title="Active Suppliers"
                    value="12"
                    icon={ShieldCheck}
                    description="Verified partners"
                />
                <MetricCard
                    title="Top Category"
                    value="Fashion"
                    icon={Tag}
                    description="High demand"
                />
            </div>

            {/* Search, Filter & Categories */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search products, brands, or categories..."
                            className="pl-9 bg-muted/50 border-transparent focus:bg-background transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger className="w-[180px]">
                                <ArrowUpRight className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="featured">Featured</SelectItem>
                                <SelectItem value="price-low">Price: Low to High</SelectItem>
                                <SelectItem value="price-high">Price: High to Low</SelectItem>
                                <SelectItem value="margin">Highest Margin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Quick Filters */}
                {/* <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory('all')} className="rounded-full">All</Button>
                    {categories.map(c => (
                        <Button
                            key={c}
                            variant={selectedCategory === c ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(c)}
                            className="rounded-full whitespace-nowrap"
                        >
                            {c}
                        </Button>
                    ))}
                </div> */}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-[350px] bg-muted/50 rounded-xl animate-pulse" />)}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border-dashed border-2">
                    <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">No dropship products found</h3>
                    <p className="text-sm text-muted-foreground/80 mt-1">Try adjusting your search terms.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((product: any) => {
                        const supplierPrice = product.supplier_price || product.price;
                        const retailPrice = product.price; // This might be MSRP or recommended
                        // Mock margin calculation if logic isn't explicit in backend yet
                        const potentialMargin = retailPrice > supplierPrice ? retailPrice - supplierPrice : 0;
                        const marginPercent = retailPrice > 0 ? Math.round((potentialMargin / retailPrice) * 100) : 0;

                        return (
                            <Card key={product.id} className="group overflow-hidden border-border/60 hover:shadow-xl transition-all duration-300 hover:border-primary/20">
                                <Link href={`/market/${product.id}`}>
                                    <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                                        <Image
                                            src={product.product_images?.[0]?.image_url || "/placeholder-image.jpg"}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                            {marginPercent > 30 && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                                            <span className={marginPercent > 30 ? "text-emerald-600" : ""}>{marginPercent}% Margin</span>
                                        </div>
                                        <Badge className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground pointer-events-none">
                                            View Details
                                        </Badge>
                                    </div>
                                </Link>
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="w-full">
                                            <Link href={`/market/${product.id}`}>
                                                <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors cursor-pointer" title={product.name}>
                                                    {product.name}
                                                </CardTitle>
                                            </Link>
                                            <CardDescription className="text-xs mt-1 flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                        <span className="font-medium text-foreground">{product.store?.name}</span>
                                                    </span>
                                                </div>
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <ShoppingBag className="w-3 h-3" />
                                                    {/* Mock import count for social proof until backend RPC is ready */}
                                                    <span>Imported by {Math.floor(Math.random() * 50) + 1} stores</span>
                                                </span>
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <div className="flex items-end gap-2 mb-3">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Cost Price</p>
                                            <span className="text-xl font-bold">ZMW {supplierPrice}</span>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Resell At</p>
                                            <span className="text-sm font-medium text-muted-foreground">ZMW {retailPrice}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 text-xs text-muted-foreground pt-3 border-t">
                                        <div className="flex-1 text-center border-r">
                                            <span className="block font-semibold text-foreground">{product.stock}</span>
                                            In Stock
                                        </div>
                                        <div className="flex-1 text-center border-r">
                                            <span className="block font-semibold text-emerald-600">ZMW {potentialMargin}</span>
                                            Profit
                                        </div>
                                        <div className="flex-1 text-center">
                                            <span className="block font-semibold text-foreground">2-3d</span>
                                            Shipping
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button
                                        className="w-full gap-2 shadow-sm font-medium"
                                        onClick={() => handleImport(product)}
                                        disabled={importingId === product.id}
                                    >
                                        {importingId === product.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Import className="w-4 h-4" />
                                        )}
                                        Import Product
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
