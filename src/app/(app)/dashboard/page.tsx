
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
  FileText,
  AlertCircle
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
import { format, parseISO, isValid } from 'date-fns';

import { getStoreOrderStats, getStoreTotalProductsSold, getMonthlySalesOverviewForStore, type MonthlySalesDataFromRPC } from "@/services/orderService";
import { getStoreTopSellingProductsRPC, type TopSellingProductFromRPC } from "@/services/productService";
import { getRecentGlobalCustomersCount } from "@/services/customerService";
import { getStoreById, type StoreFromSupabase } from "@/services/storeService";
import { getProfitSummaryStats, type ProfitSummaryStats } from "@/services/reportService"; // Import profit stats


const chartConfig = {
  sales: {
    label: "Sales (ZMW)",
    color: "hsl(var(--chart-1))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-2))",
  },
};

interface SalesChartDataItem {
  month: string;
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

interface DashboardTopProduct {
  id: string;
  name: string;
  category: string;
  image: string | null;
  dataAiHint: string | null;
  unitsSold: number;
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
    unitsSold: rpcProduct.total_quantity_sold || 0,
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
  const [topProducts, setTopProducts] = React.useState<DashboardTopProduct[]>([]);
  const [profitStats, setProfitStats] = React.useState<ProfitSummaryStats | null>(null); // State for profit stats

  const [salesChartData, setSalesChartData] = React.useState<SalesChartDataItem[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessages, setErrorMessages] = React.useState<string[]>([]);


  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user);
    });
  }, [supabase]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      if (!storeId || !authUser) {
        setIsLoading(false);
        setTotalRevenue(null); setActiveOrdersCount(null); setProductsSoldCount(null); setNewCustomersCount(null);
        setTopProducts([]); setSelectedStore(null); setSalesChartData([]); setProfitStats(null);
        if (!storeId && authUser) setErrorMessages(["Please select a store to view dashboard analytics."]);
        else if (!authUser) setErrorMessages(["Please sign in to view dashboard analytics."]);
        return;
      }

      setIsLoading(true);
      setErrorMessages([]);

      let currentErrorMessages: string[] = [];

      const storePromise = getStoreById(storeId, authUser.id);
      const orderStatsPromise = getStoreOrderStats(storeId);
      const productsSoldPromise = getStoreTotalProductsSold(storeId);
      const topProductsPromise = getStoreTopSellingProductsRPC(storeId, 3, 30);
      const salesChartPromise = getMonthlySalesOverviewForStore(storeId, 6);
      const newCustomersPromise = getRecentGlobalCustomersCount(30);
      const profitStatsPromise = getProfitSummaryStats(storeId); // Fetch profit stats

      const results = await Promise.allSettled([
        storePromise,
        orderStatsPromise,
        productsSoldPromise,
        topProductsPromise,
        salesChartPromise,
        newCustomersPromise,
        profitStatsPromise // Add promise to results
      ]);

      const [
        storeResult,
        orderStatsResult,
        productsSoldResult,
        topProductsResult,
        salesChartResult,
        newCustomersResult,
        profitStatsResult // Get result for profit stats
      ] = results;

      // Process Store
      if (storeResult.status === 'fulfilled') {
        const { data, error } = storeResult.value;
        if (error) currentErrorMessages.push(`Store: ${error.message}`);
        setSelectedStore(data);
      } else {
        currentErrorMessages.push(`Store: ${(storeResult.reason as Error).message}`);
        setSelectedStore(null);
      }

      // Process Order Stats
      if (orderStatsResult.status === 'fulfilled') {
        const { data, error } = orderStatsResult.value;
        if (error) currentErrorMessages.push(`Order Stats: ${error.message}`);
        if (data) { setTotalRevenue(data.totalRevenue); setActiveOrdersCount(data.activeOrdersCount); }
      } else {
        currentErrorMessages.push(`Order Stats: ${(orderStatsResult.reason as Error).message}`);
        setTotalRevenue(null); setActiveOrdersCount(null);
      }

      // Process Products Sold
      if (productsSoldResult.status === 'fulfilled') {
        const { data, error } = productsSoldResult.value;
        if (error) currentErrorMessages.push(`Products Sold: ${error.message}`);
        if (data !== null) setProductsSoldCount(data);
      } else {
        currentErrorMessages.push(`Products Sold: ${(productsSoldResult.reason as Error).message}`);
        setProductsSoldCount(null);
      }

      // Process Top Products
      if (topProductsResult.status === 'fulfilled') {
        const { data, error } = topProductsResult.value;
        if (error) currentErrorMessages.push(`Top Products: ${error.message}`);
        if (data) setTopProducts(data.map(mapRpcTopProductToDashboardUI));
        else setTopProducts([]);
      } else {
        currentErrorMessages.push(`Top Products: ${(topProductsResult.reason as Error).message}`);
        setTopProducts([]);
      }

      // Process Sales Chart Data
      if (salesChartResult.status === 'fulfilled') {
        const { data: rpcData, error: rpcError } = salesChartResult.value;
        if (rpcError) currentErrorMessages.push(`Sales Overview: ${rpcError.message}`);
        if (rpcData) {
          const formattedChartData = rpcData.map(item => ({
            month: isValid(parseISO(item.period_start_date)) ? format(parseISO(item.period_start_date), 'MMMM') : 'Unknown',
            sales: item.total_sales || 0,
            orders: item.order_count || 0,
          })).reverse();
          setSalesChartData(formattedChartData);
        } else {
          setSalesChartData([]);
        }
      } else {
        currentErrorMessages.push(`Sales Overview: ${(salesChartResult.reason as Error).message}`);
        setSalesChartData([]);
      }

      // Process New Customers
      if (newCustomersResult.status === 'fulfilled') {
        const { data, error } = newCustomersResult.value;
        if (error) currentErrorMessages.push(`New Customers: ${error.message}`);
        if (data) setNewCustomersCount(data.count);
      } else {
        currentErrorMessages.push(`New Customers: ${(newCustomersResult.reason as Error).message}`);
        setNewCustomersCount(null);
      }

      // Process Profit Stats
      if (profitStatsResult.status === 'fulfilled') {
        const { data, error } = profitStatsResult.value;
        if (error) currentErrorMessages.push(`Profit Stats: ${error.message}`);
        setProfitStats(data); // Can be null if RPC returns {data:null} or error
      } else {
        currentErrorMessages.push(`Profit Stats: ${(profitStatsResult.reason as Error).message}`);
        setProfitStats(null);
      }

      if(currentErrorMessages.length > 0) {
        setErrorMessages(currentErrorMessages);
        currentErrorMessages.forEach(msg => toast({variant: "destructive", title: "Data Fetch Error", description: msg, duration: 5000}));
      }
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [storeId, authUser, toast]);

  const storeContextMessage = selectedStore ? ` for ${selectedStore.name}` : storeId ? " for selected store" : "";
  const queryParams = storeId ? `?storeId=${storeId}` : "";

  if (errorMessages.length > 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard Data</h2>
        <div className="text-muted-foreground mb-6 max-w-md space-y-1">
            {errorMessages.map((msg, index) => <p key={index}>{msg}</p>)}
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={isLoading ? "Loading..." : (totalRevenue !== null ? `ZMW ${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "N/A")}
          icon={DollarSign}
          description={`Total earnings this period${storeContextMessage}.`}
          ctaLink={`/reports/revenue${queryParams}`}
          ctaText="View Revenue Report"
          isLoading={isLoading}
        />
         <StatCard
          title="Gross Profit (YTD)"
          value={isLoading ? "Loading..." : (profitStats?.ytd_gross_profit !== undefined ? `ZMW ${profitStats.ytd_gross_profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "N/A")}
          icon={LineChart}
          description={`Year-to-date gross profit${storeContextMessage}.`}
          ctaLink={`/reports/profit${queryParams}`}
          ctaText="View Profit Details"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Orders"
          value={isLoading ? "Loading..." : (activeOrdersCount !== null ? activeOrdersCount.toLocaleString() : "N/A")}
          icon={Activity}
          description={`Orders needing attention${storeContextMessage}.`}
          ctaLink={`/orders${queryParams}`}
          ctaText="Manage Orders"
          isLoading={isLoading}
        />
        <StatCard
          title="Products Sold"
          value={isLoading ? "Loading..." : (productsSoldCount !== null ? productsSoldCount.toLocaleString() : "N/A")}
          icon={Package}
          description={`Total items sold${storeContextMessage}.`}
          ctaLink={`/products${queryParams}`}
          ctaText="Manage Products"
          isLoading={isLoading}
        />
        <StatCard
          title="New Customers"
          value={isLoading ? "Loading..." : (newCustomersCount !== null ? newCustomersCount.toLocaleString() : "N/A")}
          icon={Users}
          description={`Global new sign-ups (last 30d).`}
          ctaLink={`/customers${queryParams}`}
          ctaText="View Customers"
          isLoading={isLoading && newCustomersCount === null}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              {isLoading
                ? `Loading sales trends${storeContextMessage}...`
                : `Monthly sales and order trends (last 6 months)${storeContextMessage}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <div className="h-[300px] w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : salesChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                      yAxisId="left"
                      stroke="hsl(var(--chart-1))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tickFormatter={(value) => `ZMW ${Number(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--chart-2))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tickFormatter={(value) => `${value}`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dashed" formatter={(value, name) => name === "sales" ? `ZMW ${Number(value).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` : Number(value).toLocaleString() } />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar yAxisId="left" dataKey="sales" fill="var(--color-sales)" radius={4} />
                    <Bar yAxisId="right" dataKey="orders" fill="var(--color-orders)" radius={4} />
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
            {isLoading && (
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
            {!isLoading && topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No top selling products found for this store or period.</p>
            )}
            {!isLoading && topProducts.length > 0 && (
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
                      <p className="text-xs text-muted-foreground">Sold: {product.unitsSold.toLocaleString()}</p>
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
