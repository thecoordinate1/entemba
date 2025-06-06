
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  Percent,
  ArrowLeft,
  Receipt,
  Landmark,
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
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, isValid } from 'date-fns';

import { createClient } from '@/lib/supabase/client';
import type { User as AuthUser } from '@supabase/supabase-js';
import { getStoreById, type StoreFromSupabase } from "@/services/storeService";
import {
  getProfitSummaryStats,
  getMonthlyProfitOverview,
  getTopProductsByProfit,
  type ProfitSummaryStats,
  type MonthlyProfitData,
  type ProductProfitData,
} from "@/services/reportService";

interface ProfitChartDataItem {
  month: string;
  profit: number; // Representing gross profit here
  cogs: number;
}

// Static data for pie chart, as dynamic category profit is complex
const profitByCategoryDataStatic = [
    { name: 'Furniture', value: 8500, color: 'hsl(var(--chart-1))' },
    { name: 'Electronics', value: 7200, color: 'hsl(var(--chart-2))' },
    { name: 'Groceries', value: 5800, color: 'hsl(var(--chart-3))' },
    { name: 'Apparel', value: 3500, color: 'hsl(var(--chart-4))' },
];

const profitChartConfig = {
  profit: { label: "Gross Profit (ZMW)", color: "hsl(var(--chart-1))" },
  cogs: { label: "COGS (ZMW)", color: "hsl(var(--chart-2))" },
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  trend?: string; // For display only, actual trend calculation not implemented here
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
            {trend}
          </p>
        )}
        {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      </CardContent>
    </Card>
  );
};

export default function ProfitReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams.get("storeId");
  
  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [selectedStore, setSelectedStore] = React.useState<StoreFromSupabase | null>(null);

  const [summaryStats, setSummaryStats] = React.useState<ProfitSummaryStats | null>(null);
  const [monthlyProfitChartData, setMonthlyProfitChartData] = React.useState<ProfitChartDataItem[]>([]);
  const [topProducts, setTopProducts] = React.useState<ProductProfitData[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessages, setErrorMessages] = React.useState<string[]>([]);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [supabase]);

  React.useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      setErrorMessages([]);
      let currentErrorMessages: string[] = [];

      if (!storeIdFromUrl) {
        currentErrorMessages.push("No store selected. Please select a store to view reports.");
        setIsLoading(false);
        setSummaryStats(null); setMonthlyProfitChartData([]); setTopProducts([]); setSelectedStore(null);
        setErrorMessages(currentErrorMessages);
        return;
      }
      if (!authUser) {
        currentErrorMessages.push("Authentication issue. Please ensure you are logged in.");
        setIsLoading(false);
        setSummaryStats(null); setMonthlyProfitChartData([]); setTopProducts([]); setSelectedStore(null);
        setErrorMessages(currentErrorMessages);
        return;
      }
      
      const storePromise = getStoreById(storeIdFromUrl, authUser.id);
      const summaryStatsPromise = getProfitSummaryStats(storeIdFromUrl);
      const monthlyProfitPromise = getMonthlyProfitOverview(storeIdFromUrl, 6); // Last 6 months
      const topProductsPromise = getTopProductsByProfit(storeIdFromUrl, 5, 30); // Top 5, last 30 days

      const results = await Promise.allSettled([
        storePromise,
        summaryStatsPromise,
        monthlyProfitPromise,
        topProductsPromise
      ]);

      const [storeResult, summaryResult, monthlyResult, topProductsResult] = results;

      if (storeResult.status === 'fulfilled') {
        const { data, error } = storeResult.value;
        if (error) currentErrorMessages.push(`Store Details: ${error.message || 'Failed to fetch.'}`);
        setSelectedStore(data);
      } else {
        currentErrorMessages.push(`Store Details: ${(storeResult.reason as Error).message || 'Failed to fetch.'}`);
        setSelectedStore(null);
      }

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
        if (error) currentErrorMessages.push(`Monthly Profit Overview: ${error.message || 'Failed to fetch.'}`);
        if (data) {
          setMonthlyProfitChartData(data.map(item => {
            const parsedDate = parseISO(item.period_start_date);
            return {
              month: isValid(parsedDate) ? format(parsedDate, 'MMMM') : 'Unknown',
              profit: item.total_gross_profit || 0,
              cogs: item.total_cogs || 0,
            };
          }).reverse());
        } else {
          setMonthlyProfitChartData([]);
        }
      } else {
        currentErrorMessages.push(`Monthly Profit Overview: ${(monthlyResult.reason as Error).message || 'Failed to fetch.'}`);
        setMonthlyProfitChartData([]);
      }
      
      if (topProductsResult.status === 'fulfilled') {
        const { data, error } = topProductsResult.value;
        if (error) currentErrorMessages.push(`Top Products by Profit: ${error.message || 'Failed to fetch.'}`);
        setTopProducts(data || []);
      } else {
        currentErrorMessages.push(`Top Products by Profit: ${(topProductsResult.reason as Error).message || 'Failed to fetch.'}`);
        setTopProducts([]);
      }

      if (currentErrorMessages.length > 0) {
        setErrorMessages(currentErrorMessages);
        currentErrorMessages.forEach(msg => toast({ variant: "destructive", title: "Data Fetch Error", description: msg, duration: 7000 }));
      }
      setIsLoading(false);
    };

    fetchReportData();
  }, [storeIdFromUrl, authUser, toast]);

  const storeContextMessage = selectedStore ? ` for ${selectedStore.name}` : storeIdFromUrl ? " for selected store" : "";
  const queryParams = storeIdFromUrl ? `?storeId=${storeIdFromUrl}` : "";

  const grossProfitYTD = summaryStats?.ytd_gross_profit ?? 0;
  const cogsYTD = summaryStats?.ytd_cogs ?? 0;
  const revenueYTDForMargin = summaryStats?.ytd_revenue_for_margin_calc ?? 0;
  const profitMarginYTD = revenueYTDForMargin > 0 ? (grossProfitYTD / revenueYTDForMargin) * 100 : 0;

  // For "Net Profit" card, we will display Gross Profit for now, as true Net Profit is complex.
  // Or, we can make a simple estimation or show a placeholder.
  // Let's show Gross Profit and label it clearly.
  const netProfitDisplayValue = isLoading ? "Loading..." : `ZMW ${Number(grossProfitYTD).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  const netProfitDescription = `YTD Gross Profit (Revenue - COGS)${storeContextMessage}. True Net Profit requires more expense data.`;


  if (errorMessages.length > 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Profit Report</h2>
        <div className="text-muted-foreground mb-6 max-w-md space-y-1">
            {errorMessages.map((msg, index) => <p key={index}>{msg}</p>)}
        </div>
        <p className="text-xs text-muted-foreground mb-6 max-w-md">This might be due to missing or misconfigured RPC functions (e.g., `get_profit_summary_stats`, `get_monthly_profit_overview`, `get_top_products_by_profit`). Please ensure they are created correctly in your Supabase SQL Editor and permissions are granted.</p>
        <Button variant="outline" onClick={() => router.push(`/dashboard${queryParams}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profit Report{isLoading && !selectedStore ? <Skeleton className="h-8 w-40 inline-block ml-2" /> : storeContextMessage}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gross Profit (YTD)"
          value={isLoading ? "Loading..." : `ZMW ${Number(grossProfitYTD).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          icon={DollarSign}
          description={`Total revenue minus COGS${storeContextMessage}.`}
          isLoading={isLoading}
        />
        <StatCard
          title="COGS (YTD)"
          value={isLoading ? "Loading..." : `ZMW ${Number(cogsYTD).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          icon={Receipt}
          description={`Direct costs of producing goods${storeContextMessage}.`}
          isLoading={isLoading}
        />
        <StatCard
          title="Gross Profit Margin (YTD)"
          value={isLoading ? "Loading..." : `${profitMarginYTD.toFixed(1)}%`}
          icon={Percent}
          description={`Gross profit as % of revenue${storeContextMessage}.`}
          isLoading={isLoading}
        />
         <StatCard
          title="Net Profit (Est. YTD)"
          value={netProfitDisplayValue}
          icon={Landmark} 
          description={netProfitDescription}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly Gross Profit Trend</CardTitle>
            <CardDescription>Track your gross profit and COGS month over month{storeContextMessage}.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
           {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
           ) : monthlyProfitChartData.length > 0 ? (
            <ChartContainer config={profitChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyProfitChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
                    tickFormatter={(value) => `ZMW ${Number(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" formatter={(value, name) => `ZMW ${Number(value).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`} />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="profit" fill="var(--color-profit)" radius={4} name="Gross Profit" />
                  {/* <Bar dataKey="cogs" fill="var(--color-cogs)" radius={4} name="COGS" /> // If you want to stack/compare */}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
           ) : (
             <p className="text-sm text-muted-foreground h-[300px] flex items-center justify-center">No monthly profit data available{storeContextMessage}.</p>
           )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Profit by Category (Static)</CardTitle>
                <CardDescription>Distribution of profit across product categories{storeContextMessage}. (This chart uses static placeholder data).</CardDescription>
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
                                    <span>ZMW {Number(value).toLocaleString()} ({(props.payload?.percent * 100).toFixed(1)}%)</span>
                                </div>
                            )} />}
                        />
                        <Pie
                            data={profitByCategoryDataStatic}
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
                                return (
                                <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                                </text>
                                );
                            }}
                        >
                            {profitByCategoryDataStatic.map((entry, index) => (
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
          <CardTitle>Top Products by Profit</CardTitle>
          <CardDescription>Detailed breakdown of profit by products (last 30 days){storeContextMessage}.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                  <TableHead className="text-right">Gross Profit</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Units Sold</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Profit/Unit</TableHead>
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
                    <TableCell className="text-right">ZMW {Number(product.total_profit_generated).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{product.units_sold.toLocaleString()}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {product.units_sold > 0 ? `ZMW ${(Number(product.total_profit_generated) / product.units_sold).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "ZMW 0.00"}
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
             <p className="text-sm text-muted-foreground text-center py-4">No top product profit data available{storeContextMessage}.</p>
           )}
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
            <Button variant="outline" asChild>
                <Link href={`/reports/profit/products${queryParams}`}>View All Products Profit</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
