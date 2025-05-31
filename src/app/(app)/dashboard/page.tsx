
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  LineChart,
  FileText 
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { User as AuthUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';

import { getStoreOrderStats, getStoreTotalProductsSold, getMonthlySalesOverviewForStore, type MonthlySalesDataFromRPC } from "@/services/orderService";
import { getStoreTopSellingProductsRPC, type TopSellingProductFromRPC } from "@/services/productService"; // Updated import
import { getRecentGlobalCustomersCount } from "@/services/customerService";
import { getStoreById, type StoreFromSupabase } from "@/services/storeService";
import type { Product as ProductUIType } from "@/lib/mockData";


const chartConfig = {
  sales: {
    label: "Sales (K)", 
    color: "hsl(var(--chart-1))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-2))",
  },
};

interface SalesChartDataItem {
  month: string; // e.g., "January"
  sales: number;
  orders: number;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  description: string;
  ctaLink?: string;
  ctaText?: string;
  isLoading?: boolean;
}

// Simplified product type for dashboard display of top selling products
interface DashboardTopProduct {
  id: string;
  name: string;
  category: string;
  image: string | null;
  dataAiHint: string | null;
}


const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, change, changeType, description, ctaLink, ctaText, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2 mb-1" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {change && (
          <p className={cn(
            "text-xs flex items-center",
            changeType === "positive" && "text-emerald-500",
            changeType === "negative" && "text-red-500",
            !changeType && "text-muted-foreground" 
          )}>
            {changeType === "positive" && <TrendingUp className="mr-1 h-4 w-4" />}
            {changeType === "negative" && <TrendingDown className="mr-1 h-4 w-4" />}
            {change}
          </p>
        )}
        <p className="text-xs text-muted-foreground pt-1">{description}</p>
        {ctaLink && ctaText && (
          <Button variant="link" asChild className="px-0 pt-2 text-sm text-primary">
            <Link href={ctaLink} className="flex items-center">
              {ctaText} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const mapRpcTopProductToDashboardUI = (rpcProduct: TopSellingProductFromRPC): DashboardTopProduct => {
  return {
    id: rpcProduct.product_id,
    name: rpcProduct.product_name,
    category: rpcProduct.product_category,
    image: rpcProduct.primary_image_url,
    dataAiHint: rpcProduct.primary_image_data_ai_hint,
  };
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const { toast } = useToast();
  const supabase = createClient();

  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [selectedStore, setSelectedStore] = React.useState<StoreFromSupabase | null>(null);
  
  const [totalRevenue, setTotalRevenue] = React.useState<number | null>(null);
  const [activeOrdersCount, setActiveOrdersCount] = React.useState<number | null>(null);
  const [productsSoldCount, setProductsSoldCount] = React.useState<number | null>(null);
  const [newCustomersCount, setNewCustomersCount] = React.useState<number | null>(null);
  const [topProducts, setTopProducts] = React.useState<DashboardTopProduct[]>([]); // Use DashboardTopProduct
  
  const [salesChartData, setSalesChartData] = React.useState<SalesChartDataItem[]>([]);
  const [isLoadingSalesChart, setIsLoadingSalesChart] = React.useState(true);

  const [isLoadingStats, setIsLoadingStats] = React.useState(true);
  const [isLoadingStoreName, setIsLoadingStoreName] = React.useState(true);
  const [isLoadingTopProducts, setIsLoadingTopProducts] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user);
    });
  }, [supabase]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      if (!storeId || !authUser) {
        setIsLoadingStats(false);
        setIsLoadingStoreName(false);
        setIsLoadingTopProducts(false);
        setIsLoadingSalesChart(false);
        setTotalRevenue(null);
        setActiveOrdersCount(null);
        setProductsSoldCount(null);
        setTopProducts([]);
        setSelectedStore(null);
        setSalesChartData([]);
        return;
      }

      setIsLoadingStats(true);
      setIsLoadingStoreName(true);
      setIsLoadingTopProducts(true);
      setIsLoadingSalesChart(true);

      // Fetch Store Name
      getStoreById(storeId, authUser.id).then(({data, error}) => {
        if (error) toast({ variant: "destructive", title: "Error fetching store name", description: error.message });
        setSelectedStore(data);
        setIsLoadingStoreName(false);
      });

      // Fetch Order Stats
      getStoreOrderStats(storeId).then(({ data, error }) => {
        if (error) toast({ variant: "destructive", title: "Error fetching order stats", description: error.message });
        if (data) {
          setTotalRevenue(data.totalRevenue);
          setActiveOrdersCount(data.activeOrdersCount);
        }
      });

      // Fetch Products Sold
      getStoreTotalProductsSold(storeId).then(({ data, error }) => {
        if (error) toast({ variant: "destructive", title: "Error fetching products sold", description: error.message });
        if (data) setProductsSoldCount(data.totalSold);
      });
      
      // Fetch Top Selling Products using RPC
      getStoreTopSellingProductsRPC(storeId, 3, 30).then(({ data, error }) => { // Fetch top 3 for last 30 days
        if (error) toast({ variant: "destructive", title: "Error fetching top products", description: error.message });
        if (data) setTopProducts(data.map(mapRpcTopProductToDashboardUI));
        setIsLoadingTopProducts(false);
      });
      
      // Fetch Sales Chart Data from RPC
      getMonthlySalesOverviewForStore(storeId, 6).then(({ data: rpcData, error: rpcError }) => {
        if (rpcError) {
          toast({ variant: "destructive", title: "Error fetching sales overview", description: rpcError.message });
          setSalesChartData([]);
        } else if (rpcData) {
          const formattedChartData = rpcData.map(item => ({
            month: format(parseISO(item.period_start_date), 'MMMM'), 
            sales: item.total_sales,
            orders: item.order_count,
          })).reverse(); 
          setSalesChartData(formattedChartData);
        }
        setIsLoadingSalesChart(false);
      });
      
      Promise.allSettled([
          getStoreOrderStats(storeId),
          getStoreTotalProductsSold(storeId)
      ]).finally(() => setIsLoadingStats(false));

    };

    getRecentGlobalCustomersCount(30).then(({ data, error }) => {
        if (error) toast({ variant: "destructive", title: "Error fetching new customers", description: error.message });
        if (data) setNewCustomersCount(data.count);
    });

    fetchDashboardData();
  }, [storeId, authUser, toast]);

  const storeContextMessage = selectedStore ? ` for ${selectedStore.name}` : storeId ? " for selected store" : "";
  const queryParams = storeId ? `?storeId=${storeId}` : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={totalRevenue !== null ? `K${totalRevenue.toFixed(2)}` : "N/A"}
          icon={DollarSign}
          description={`Total earnings this period${storeContextMessage}.`}
          ctaLink={`/reports/revenue${queryParams}`}
          ctaText="View Revenue Report"
          isLoading={isLoadingStats}
        />
         <StatCard 
          title="Profit (Est.)"
          value={totalRevenue !== null ? `K${(totalRevenue * 0.25).toFixed(2)}` : "N/A"} 
          icon={LineChart} 
          description={`Estimated profit${storeContextMessage}.`}
          ctaLink={`/reports/profit${queryParams}`}
          ctaText="View Profit Details"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Active Orders"
          value={activeOrdersCount !== null ? activeOrdersCount.toString() : "N/A"}
          icon={Activity} 
          description={`Orders needing attention${storeContextMessage}.`}
          ctaLink={`/orders${queryParams}`}
          ctaText="Manage Orders"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Products Sold"
          value={productsSoldCount !== null ? productsSoldCount.toString() : "N/A"}
          icon={Package}
          description={`Total items sold${storeContextMessage}.`}
          ctaLink={`/products${queryParams}`}
          ctaText="Manage Products"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="New Customers"
          value={newCustomersCount !== null ? newCustomersCount.toString() : "N/A"}
          icon={Users}
          description={`Global new sign-ups (last 30d).`}
          ctaLink={`/customers${queryParams}`}
          ctaText="View Customers"
          isLoading={newCustomersCount === null}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              {isLoadingSalesChart 
                ? `Loading sales trends${storeContextMessage}...` 
                : `Monthly sales and order trends (last 6 months)${storeContextMessage}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoadingSalesChart ? (
              <div className="h-[300px] w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : salesChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tickFormatter={(value) => `K${value/1000}k`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dashed" formatter={(value, name) => name === "sales" ? `K${Number(value).toLocaleString()}` : value } />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                    <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground h-[300px] flex items-center justify-center">No sales data available for this period{storeContextMessage}.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Highest Selling Products</CardTitle>
            <CardDescription>Top products by sales (last 30 days){storeContextMessage}.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTopProducts && (
              <ul className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <li key={`skel-prod-${i}`} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </li>
                ))}
              </ul>
            )}
            {!isLoadingTopProducts && topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No top selling products found for this store or period.</p>
            )}
            {!isLoadingTopProducts && topProducts.length > 0 && (
              <ul className="space-y-4">
                {topProducts.map((product) => (
                  <li key={product.id} className="flex items-center gap-4">
                    <Image
                      src={product.image || "https://placehold.co/48x48.png"} 
                      alt={product.name} 
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-md object-cover border"
                      data-ai-hint={product.dataAiHint || "product image"} 
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/products/${product.id}${queryParams}`}>View</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

