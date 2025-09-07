
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CreditCard,
  ArrowLeft,
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, isValid } from 'date-fns';
import {
  getRevenueSummaryStats,
  getMonthlyRevenueOverview,
  getTopProductsByRevenue,
  type RevenueSummaryStats,
  type MonthlyRevenueData,
  type TopProductByRevenue,
} from "@/services/reportService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RevenueChartDataItem {
  month: string;
  revenue: number;
  transactions: number;
}

const revenueChartConfig = {
  revenue: { label: "Revenue (ZMW)", color: "hsl(var(--chart-1))" },
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
  
  const [summaryStats, setSummaryStats] = React.useState<RevenueSummaryStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = React.useState<RevenueChartDataItem[]>([]);
  const [topProducts, setTopProducts] = React.useState<TopProductByRevenue[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessages, setErrorMessages] = React.useState<string[]>([]);
  
  const [timePeriod, setTimePeriod] = React.useState("30");

  React.useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      setErrorMessages([]);
      
      if (!storeIdFromUrl) {
        setErrorMessages(["No store selected. Please select a store to view reports."]);
        setIsLoading(false);
        setSummaryStats(null); setMonthlyRevenue([]); setTopProducts([]);
        return;
      }
      
      let currentErrorMessages: string[] = [];
      
      const summaryStatsPromise = getRevenueSummaryStats(storeIdFromUrl);
      const monthlyRevenuePromise = getMonthlyRevenueOverview(storeIdFromUrl, 6);
      const topProductsPromise = getTopProductsByRevenue(storeIdFromUrl, 5, parseInt(timePeriod, 10));

      const results = await Promise.allSettled([
        summaryStatsPromise,
        monthlyRevenuePromise,
        topProductsPromise
      ]);

      const [summaryResult, monthlyResult, topProductsResult] = results;

      if (summaryResult.status === 'fulfilled') {
        const { data, error } = summaryResult.value;
        if (error) currentErrorMessages.push(`Summary Stats: ${error.message || 'Failed to fetch.'}`);
        setSummaryStats(data);
      } else {
        currentErrorMessages.push(`Summary Stats: ${(summaryResult.reason as Error).message || 'Failed to fetch.'}`);
        setSummaryStats(null);
      }

      if (monthlyResult.status === 'fulfilled') {
        const { data, error } = monthlyResult.value;
        if (error) currentErrorMessages.push(`Monthly Overview: ${error.message || 'Failed to fetch.'}`);
        if (data) {
          setMonthlyRevenue(data.map(item => {
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
      } else {
        currentErrorMessages.push(`Monthly Overview: ${(monthlyResult.reason as Error).message || 'Failed to fetch.'}`);
        setMonthlyRevenue([]);
      }
      
      if (topProductsResult.status === 'fulfilled') {
        const { data, error } = topProductsResult.value;
        if (error) currentErrorMessages.push(`Top Products: ${error.message || 'Failed to fetch.'}`);
        setTopProducts(data || []);
      } else {
        currentErrorMessages.push(`Top Products: ${(topProductsResult.reason as Error).message || 'Failed to fetch.'}`);
        setTopProducts([]);
      }

      if (currentErrorMessages.length > 0) {
        setErrorMessages(currentErrorMessages);
        currentErrorMessages.forEach(msg => toast({ variant: "destructive", title: "Data Fetch Error", description: msg, duration: 5000 }));
      }
      setIsLoading(false);
    };

    fetchReportData();
  }, [storeIdFromUrl, toast, timePeriod]);

  const queryParams = storeIdFromUrl ? `?storeId=${storeIdFromUrl}` : "";

  const avgOrderValue = (summaryStats?.current_month_transactions && summaryStats?.current_month_revenue && summaryStats.current_month_transactions > 0)
    ? (summaryStats.current_month_revenue / summaryStats.current_month_transactions) 
    : 0;

  if (errorMessages.length > 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Report Data</h2>
        <div className="text-muted-foreground mb-6 max-w-md space-y-1">
            {errorMessages.map((msg, index) => <p key={index}>{msg}</p>)}
        </div>
        <p className="text-xs text-muted-foreground mb-6 max-w-md">This might be due to missing or misconfigured RPC functions on the backend. Please ensure `get_revenue_summary_stats`, `get_monthly_revenue_overview`, and `get_top_products_by_revenue` are created correctly in your Supabase SQL Editor, and permissions are granted.</p>
        <Button variant="outline" onClick={() => router.push(`/dashboard${queryParams}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Revenue Report</h1>
        <div className="flex items-center gap-2">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last 365 days</SelectItem>
                <SelectItem value="0">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue (YTD)"
          value={isLoading ? "Loading..." : (summaryStats?.ytd_revenue !== undefined && summaryStats !== null ? `ZMW ${Number(summaryStats.ytd_revenue).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "N/A")}
          icon={DollarSign}
          description="Year-to-date gross revenue."
          isLoading={isLoading}
        />
        <StatCard
          title="Revenue (This Month)"
          value={isLoading ? "Loading..." : (summaryStats?.current_month_revenue !== undefined && summaryStats !== null ? `ZMW ${Number(summaryStats.current_month_revenue).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "N/A")}
          icon={DollarSign}
          description="Gross revenue for current month."
          isLoading={isLoading}
        />
        <StatCard
          title="Average Order Value"
          value={isLoading ? "Loading..." : (summaryStats && avgOrderValue !== undefined ? `ZMW ${Number(avgOrderValue).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "N/A")}
          icon={ShoppingCart}
          description="Avg. amount per order (current month)."
          isLoading={isLoading}
        />
        <StatCard
          title="Total Transactions (YTD)"
          value={isLoading ? "Loading..." : (summaryStats?.ytd_transactions !== undefined && summaryStats !== null ? summaryStats.ytd_transactions.toLocaleString() : "N/A")}
          icon={CreditCard}
          description="Total successful transactions YTD."
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
          <CardDescription>Track your gross revenue and transaction volume month over month.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
          ) : monthlyRevenue && monthlyRevenue.length > 0 ? (
            <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
                    content={<ChartTooltipContent indicator="dashed" 
                      formatter={(value, name) => name === "revenue" ? `ZMW ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : Number(value).toLocaleString() } 
                    />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar yAxisId="left" dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                  <Bar yAxisId="right" dataKey="transactions" fill="var(--color-transactions)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
              <p className="text-sm text-muted-foreground h-[300px] flex items-center justify-center">No monthly revenue data available for this period.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Revenue</CardTitle>
          <CardDescription>
            {timePeriod === "0" ? "Showing top products for all time." : `Showing top products from the last ${timePeriod} days.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
          ) : topProducts && topProducts.length > 0 ? (
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
                    <TableCell className="text-right">ZMW {Number(product.total_revenue_generated).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{product.units_sold.toLocaleString()}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {Number(product.units_sold) > 0 ? `ZMW ${(Number(product.total_revenue_generated) / Number(product.units_sold)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "ZMW 0.00"}
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
             <p className="text-sm text-muted-foreground text-center py-4">No top product data available for this period.</p>
          )}
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
            <Button variant="outline" asChild>
              <Link href={`/reports/revenue/products${queryParams}`}>View All Products Revenue</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
