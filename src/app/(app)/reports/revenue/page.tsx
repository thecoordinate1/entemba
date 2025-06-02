
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CreditCard,
  ArrowLeft,
  Percent,
  Banknote,
  AlertCircle
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, isValid } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { User as AuthUser } from '@supabase/supabase-js';
import { getStoreById, type StoreFromSupabase } from "@/services/storeService";
import {
  getRevenueSummaryStats,
  getMonthlyRevenueOverview,
  getTopProductsByRevenue,
  type RevenueSummaryStats,
  type MonthlyRevenueData,
  type TopProductByRevenue,
} from "@/services/reportService";

interface RevenueChartDataItem {
  month: string;
  revenue: number;
  transactions: number;
}

const revenueSourceDataStatic = [
    { name: 'Online Store', value: 120500, color: 'hsl(var(--chart-1))' },
    { name: 'Marketplace A', value: 45300, color: 'hsl(var(--chart-2))' },
    { name: 'Manual Orders', value: 15750, color: 'hsl(var(--chart-3))' },
    { name: 'Other', value: 8600, color: 'hsl(var(--chart-4))' },
];

const revenueChartConfig = {
  revenue: { label: "Revenue (K)", color: "hsl(var(--chart-1))" },
  transactions: { label: "Transactions", color: "hsl(var(--chart-2))" },
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  trendType?: "positive" | "negative" | "neutral";
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, trend, trendType, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-5 w-2/5" /> <Skeleton className="h-5 w-5 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/5 mb-1" />
          {description && <Skeleton className="h-3 w-full mb-1" />}
          {trend && <Skeleton className="h-3 w-3/4" />}
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
        {trend && (
          <p className={`text-xs flex items-center ${
              trendType === "positive" ? "text-emerald-500" :
              trendType === "negative" ? "text-red-500" :
              "text-muted-foreground"
          }`}>
            {trendType === "positive" && <TrendingUp className="mr-1 h-4 w-4" />}
            {trendType === "negative" && <TrendingDown className="mr-1 h-4 w-4" />} 
            {trend}
          </p>
        )}
        {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      </CardContent>
    </Card>
  );
};

export default function RevenueReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams.get("storeId");
  
  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [selectedStore, setSelectedStore] = React.useState<StoreFromSupabase | null>(null);

  const [summaryStats, setSummaryStats] = React.useState<RevenueSummaryStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = React.useState<RevenueChartDataItem[]>([]);
  const [topProducts, setTopProducts] = React.useState<TopProductByRevenue[]>([]);

  const [isLoadingStore, setIsLoadingStore] = React.useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(true);
  const [isLoadingMonthly, setIsLoadingMonthly] = React.useState(true);
  const [isLoadingTopProducts, setIsLoadingTopProducts] = React.useState(true);
  
  const [errorMessages, setErrorMessages] = React.useState<string[]>([]);

  const [defaultCurrency, setDefaultCurrency] = React.useState("ZMW");
  const [taxRate, setTaxRate] = React.useState("10"); 
  const [pricesIncludeTax, setPricesIncludeTax] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [supabase]);

  React.useEffect(() => {
    const fetchStoreAndReportData = async () => {
      let currentErrorMessages: string[] = [];
      setIsLoadingStore(true); 
      setIsLoadingSummary(true); 
      setIsLoadingMonthly(true); 
      setIsLoadingTopProducts(true);
      setErrorMessages([]);

      if (!storeIdFromUrl) {
        currentErrorMessages.push("No store selected. Please select a store to view reports.");
        setIsLoadingStore(false); setIsLoadingSummary(false); setIsLoadingMonthly(false); setIsLoadingTopProducts(false);
        setErrorMessages(currentErrorMessages);
        return;
      }
      if (!authUser) {
        currentErrorMessages.push("Authentication issue. Please ensure you are logged in.");
        setIsLoadingStore(false); setIsLoadingSummary(false); setIsLoadingMonthly(false); setIsLoadingTopProducts(false);
        setErrorMessages(currentErrorMessages);
        return;
      }
      
      try {
        const storeResult = await getStoreById(storeIdFromUrl, authUser.id);
        if (storeResult.error) {
            currentErrorMessages.push(`Store: ${storeResult.error.message}`);
        }
        setSelectedStore(storeResult.data);
      } catch (e: any) {
        currentErrorMessages.push(`Store (Unexpected): ${e.message}`);
      } finally {
        setIsLoadingStore(false);
      }

      try {
        const summaryResult = await getRevenueSummaryStats(storeIdFromUrl);
        if (summaryResult.error) {
            currentErrorMessages.push(`Summary Stats: ${summaryResult.error.message}`);
        }
        setSummaryStats(summaryResult.data);
      } catch (e: any) {
         currentErrorMessages.push(`Summary Stats (Unexpected): ${e.message}`);
      } finally {
        setIsLoadingSummary(false);
      }

      try {
        const monthlyResult = await getMonthlyRevenueOverview(storeIdFromUrl, 6);
        if (monthlyResult.error) {
            currentErrorMessages.push(`Monthly Overview: ${monthlyResult.error.message}`);
            setMonthlyRevenue([]);
        } else if (monthlyResult.data) {
          setMonthlyRevenue(monthlyResult.data.map(item => {
            const parsedDate = parseISO(item.period_start_date);
            return {
              month: isValid(parsedDate) ? format(parsedDate, 'MMMM') : 'Unknown',
              revenue: item.total_revenue || 0,
              transactions: item.transaction_count || 0,
            };
          }).reverse());
        } else {
            setMonthlyRevenue([]);
        }
      } catch (e: any) {
        currentErrorMessages.push(`Monthly Overview (Unexpected): ${e.message}`);
        setMonthlyRevenue([]);
      } finally {
        setIsLoadingMonthly(false);
      }

      try {
        const topProductsResult = await getTopProductsByRevenue(storeIdFromUrl, 5, 30);
        if (topProductsResult.error) {
            currentErrorMessages.push(`Top Products: ${topProductsResult.error.message}`);
            setTopProducts([]);
        } else {
            setTopProducts(topProductsResult.data || []);
        }
      } catch (e: any) {
        currentErrorMessages.push(`Top Products (Unexpected): ${e.message}`);
        setTopProducts([]);
      } finally {
        setIsLoadingTopProducts(false);
      }

      if (currentErrorMessages.length > 0) {
        setErrorMessages(currentErrorMessages);
      }
    };

    fetchStoreAndReportData();
  }, [storeIdFromUrl, authUser, toast]);

  const storeContextMessage = selectedStore ? ` for ${selectedStore.name}` : storeIdFromUrl ? " for selected store" : "";
  const queryParams = storeIdFromUrl ? `?storeId=${storeIdFromUrl}` : "";

  const handleSaveRevenueSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // console.log({ defaultCurrency, taxRate, pricesIncludeTax });
    toast({
      title: "Settings Saved (Placeholder)",
      description: "Revenue settings save functionality is not yet fully implemented.",
    });
  };

  const avgOrderValue = (summaryStats?.current_month_transactions && summaryStats?.current_month_revenue && summaryStats.current_month_transactions > 0)
    ? (summaryStats.current_month_revenue / summaryStats.current_month_transactions) 
    : 0;

  if (errorMessages.length > 0 && !isLoadingStore && !isLoadingSummary && !isLoadingMonthly && !isLoadingTopProducts) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Report Data</h2>
        <div className="text-muted-foreground mb-6 max-w-md space-y-1">
            {errorMessages.map((msg, index) => <p key={index}>{msg}</p>)}
        </div>
        <p className="text-xs text-muted-foreground mb-6 max-w-md">This might be due to missing or misconfigured RPC functions on the backend. Please ensure `get_revenue_summary_stats`, `get_monthly_revenue_overview`, and `get_top_products_by_revenue` are created correctly in your Supabase SQL Editor and permissions are granted.</p>
        <Button variant="outline" onClick={() => router.push(`/dashboard${queryParams}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Revenue Report{isLoadingStore ? <Skeleton className="h-8 w-40 inline-block ml-2" /> : storeContextMessage}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue (YTD)"
          value={summaryStats?.ytd_revenue !== undefined ? `K${Number(summaryStats.ytd_revenue).toFixed(2)}` : "N/A"}
          icon={DollarSign}
          description={`Year-to-date gross revenue${storeContextMessage}.`}
          isLoading={isLoadingSummary}
        />
        <StatCard
          title="Revenue (This Month)"
          value={summaryStats?.current_month_revenue !== undefined ? `K${Number(summaryStats.current_month_revenue).toFixed(2)}` : "N/A"}
          icon={DollarSign}
          description={`Gross revenue for current month${storeContextMessage}.`}
          isLoading={isLoadingSummary}
        />
        <StatCard
          title="Average Order Value"
          value={avgOrderValue !== undefined ? `K${Number(avgOrderValue).toFixed(2)}` : "N/A"}
          icon={ShoppingCart}
          description={`Avg. amount per order (current month)${storeContextMessage}.`}
          isLoading={isLoadingSummary}
        />
        <StatCard
          title="Total Transactions (YTD)"
          value={summaryStats?.ytd_transactions !== undefined ? summaryStats.ytd_transactions.toString() : "N/A"}
          icon={CreditCard}
          description={`Total successful transactions YTD${storeContextMessage}.`}
          isLoading={isLoadingSummary}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Track your gross revenue and transaction volume month over month{storeContextMessage}.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoadingMonthly ? (
                <Skeleton className="h-[300px] w-full" />
            ) : monthlyRevenue.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
                      tickFormatter={(value) => `K${Number(value / 1000).toFixed(0)}k`}
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
                      content={<ChartTooltipContent indicator="dashed" 
                        formatter={(value, name) => name === "revenue" ? `K${Number(value).toLocaleString()}` : value } 
                      />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar yAxisId="left" dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                    <Bar yAxisId="right" dataKey="transactions" fill="var(--color-transactions)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
                <p className="text-sm text-muted-foreground h-[300px] flex items-center justify-center">No monthly revenue data available for this period{storeContextMessage}.</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Revenue by Source (Static)</CardTitle>
                <CardDescription>Distribution of revenue across different channels{storeContextMessage}. (This chart uses static data for now as order source is not tracked).</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[300px]">
                 <ChartContainer config={{}} className="h-full w-full max-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel formatter={(value, name, props) => (
                                <div className="flex flex-col">
                                    <span className="font-medium">{props.payload?.name}</span>
                                    <span>K{Number(value).toLocaleString()} ({(props.payload?.percent * 100).toFixed(1)}%)</span>
                                </div>
                            )} />}
                        />
                        <Pie
                            data={revenueSourceDataStatic}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                let x = cx + (radius + 15) * Math.cos(-midAngle * RADIAN);
                                let y = cy + (radius + 15) * Math.sin(-midAngle * RADIAN);
                                if (name === 'Marketplace A' && (percent * 100) < 30) { 
                                   x = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
                                   y = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
                                }

                                return (
                                <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                                </text>
                                );
                            }}
                        >
                            {revenueSourceDataStatic.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products by Revenue</CardTitle>
          <CardDescription>Detailed breakdown of revenue by products (last 30 days){storeContextMessage}.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTopProducts ? (
            <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
          ) : topProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Units Sold</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Avg. Price/Unit</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        src={product.primary_image_url || "https://placehold.co/40x40.png"}
                        alt={product.product_name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover border"
                        data-ai-hint={product.primary_image_data_ai_hint || "product"}
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/products/${product.product_id}${queryParams}`} className="font-medium hover:underline">
                        {product.product_name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{product.product_category}</div>
                    </TableCell>
                    <TableCell className="text-right">K{Number(product.total_revenue_generated).toFixed(2)}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{product.units_sold}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {product.units_sold > 0 ? `K${(Number(product.total_revenue_generated) / product.units_sold).toFixed(2)}` : "K0.00"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/products/${product.product_id}${queryParams}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <p className="text-sm text-muted-foreground text-center py-4">No top product data available for this period{storeContextMessage}.</p>
          )}
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
            <Button variant="outline" asChild>
              <Link href={`/reports/revenue/products${queryParams}`}>View All Products Revenue</Link>
            </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Revenue Settings</CardTitle>
            <CardDescription>Configure currency, tax, and payment gateway options{storeContextMessage}. (These settings are UI placeholders)</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSaveRevenueSettings} className="space-y-6">
              <div className="grid gap-3">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <div className="relative">
                    <Banknote className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                        <SelectTrigger id="defaultCurrency" className="pl-8">
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ZMW">ZMW - Zambian Kwacha</SelectItem>
                            <SelectItem value="USD">USD - United States Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>

              <Separator />
              <h4 className="text-md font-medium">Tax Settings</h4>
              <div className="grid gap-3">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                 <div className="relative">
                    <Percent className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="taxRate"
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        placeholder="e.g., 10"
                        className="pl-8"
                    />
                 </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                    id="pricesIncludeTax"
                    checked={pricesIncludeTax}
                    onCheckedChange={setPricesIncludeTax}
                />
                <Label htmlFor="pricesIncludeTax" className="text-sm font-normal">Product prices already include tax</Label>
              </div>

              <Separator />
              <h4 className="text-md font-medium">Payment Gateways (Placeholder)</h4>
              <p className="text-sm text-muted-foreground">
                Connect payment gateways. (This section is a UI placeholder for future integration).
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled>Connect MoMo</Button>
                <Button type="button" variant="outline" disabled>Connect Airtel Money</Button>
                <Button type="button" variant="outline" disabled>Connect Zamtel Money</Button>
              </div>

              <CardFooter className="px-0 pt-6">
                <Button type="submit">Save Revenue Settings</Button>
              </CardFooter>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
