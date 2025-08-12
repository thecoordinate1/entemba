
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
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

import { createClient } from '@/lib/supabase/client';
import type { User as AuthUser } from '@supabase/supabase-js';
import { getStoreById, type StoreFromSupabase } from "@/services/storeService";
import {
  getProfitSummaryStats,
  getTopProductsByProfit,
  type ProfitSummaryStats,
  type ProductProfitData,
} from "@/services/reportService";

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
  const [topProducts, setTopProducts] = React.useState<ProductProfitData[]>([]);
  
  const [isLoadingPage, setIsLoadingPage] = React.useState(true);
  const [errorMessages, setErrorMessages] = React.useState<string[]>([]);
  
  const [daysPeriod] = React.useState<number | null>(90); // Default to last 90 days for top products

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [supabase]);

  React.useEffect(() => {
    const fetchReportData = async () => {
      setIsLoadingPage(true);
      setErrorMessages([]);
      setSummaryStats(null); 
      setTopProducts([]);
      setSelectedStore(null);

      let currentErrorMessages: string[] = [];

      if (!storeIdFromUrl) {
        currentErrorMessages.push("No store selected. Please select a store to view reports.");
        setIsLoadingPage(false);
        setErrorMessages(currentErrorMessages);
        return;
      }
      if (!authUser) {
        currentErrorMessages.push("Authentication issue. Please ensure you are logged in.");
        setIsLoadingPage(false);
        setErrorMessages(currentErrorMessages);
        return;
      }
      
      const storePromise = getStoreById(storeIdFromUrl, authUser.id);
      const summaryStatsPromise = getProfitSummaryStats(storeIdFromUrl);
      const topProductsPromise = getTopProductsByProfit(storeIdFromUrl, 5, daysPeriod);

      const results = await Promise.allSettled([
        storePromise,
        summaryStatsPromise,
        topProductsPromise,
      ]);

      const [storeResult, summaryResult, topProductsResult] = results;

      if (storeResult.status === 'fulfilled') {
        const { data, error } = storeResult.value;
        if (error) currentErrorMessages.push(`Store Details: ${error.message || 'Failed to fetch.'}`);
        setSelectedStore(data);
      } else {
        currentErrorMessages.push(`Store Details: ${(storeResult.reason as Error).message || 'Failed to fetch.'}`);
      }

      if (summaryResult.status === 'fulfilled') {
        const { data, error } = summaryResult.value;
        if (error) {
            currentErrorMessages.push(`Summary Stats: ${error.message || 'Failed to fetch.'}`);
            setSummaryStats(null);
        } else {
            setSummaryStats(data); 
        }
      } else {
        currentErrorMessages.push(`Summary Stats: ${(summaryResult.reason as Error).message || 'Failed to fetch.'}`);
        setSummaryStats(null);
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
      setIsLoadingPage(false);
    };

    fetchReportData();
  }, [storeIdFromUrl, authUser, toast, daysPeriod]);

  const storeContextMessage = selectedStore ? ` for ${selectedStore.name}` : storeIdFromUrl ? " for selected store" : "";
  const queryParams = storeIdFromUrl ? `?storeId=${storeIdFromUrl}` : "";

  const ytdGrossProfit = summaryStats?.ytd_gross_profit ?? 0;
  const ytdCogs = summaryStats?.ytd_cogs ?? 0;
  const ytdRevenueForMargin = summaryStats?.ytd_revenue_for_margin_calc ?? 0;
  
  const ytdProfitMargin = ytdRevenueForMargin > 0 ? (ytdGrossProfit / ytdRevenueForMargin) * 100 : 0;
  const netProfitEstYTD = ytdGrossProfit;

  if (errorMessages.length > 0 && !isLoadingPage) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Profit Report</h2>
        <div className="text-muted-foreground mb-6 max-w-md space-y-1">
            {errorMessages.map((msg, index) => <p key={index}>{msg}</p>)}
        </div>
        <p className="text-xs text-muted-foreground mb-6 max-w-md">This might be due to missing or misconfigured RPC functions. Please ensure they are created correctly in your Supabase SQL Editor and permissions are granted.</p>
        <Button variant="outline" onClick={() => router.push(`/dashboard${queryParams}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const displayValue = (value: number, isCurrency = true) => {
    if (isCurrency) {
      return `ZMW ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    return `${Number(value).toFixed(1)}%`;
  };
  
  const cardValue = (dataAvailable: boolean, value: number, isCurrency = true) => {
    return isLoadingPage ? "Loading..." : (dataAvailable ? displayValue(value, isCurrency) : "N/A");
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profit Report{isLoadingPage && !selectedStore ? <Skeleton className="h-8 w-40 inline-block ml-2" /> : storeContextMessage}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gross Profit (YTD)"
          value={cardValue(summaryStats !== null, ytdGrossProfit)}
          icon={DollarSign}
          description={`Total revenue minus COGS${storeContextMessage}.`}
          isLoading={isLoadingPage}
        />
        <StatCard
          title="COGS (YTD)"
          value={cardValue(summaryStats !== null, ytdCogs)}
          icon={Receipt}
          description={`Direct costs of producing goods${storeContextMessage}.`}
          isLoading={isLoadingPage}
        />
        <StatCard
          title="Gross Profit Margin (YTD)"
          value={cardValue(summaryStats !== null, ytdProfitMargin, false)}
          icon={Percent}
          description={`Gross profit as % of revenue${storeContextMessage}.`}
          isLoading={isLoadingPage}
        />
         <StatCard
          title="Net Profit (Est. YTD)"
          value={cardValue(summaryStats !== null, netProfitEstYTD)}
          icon={Landmark} 
          description={`YTD Gross Profit (Est. Net Profit)${storeContextMessage}. True Net Profit calculation requires other operational expenses.`}
          isLoading={isLoadingPage}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products by Profit</CardTitle>
          <CardDescription>Detailed breakdown of profit by products (last {daysPeriod} days){storeContextMessage}.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPage ? (
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
