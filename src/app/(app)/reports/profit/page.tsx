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
import {
  getProfitSummaryStats,
  getTopProductsByProfit,
  type ProfitSummaryStats,
  type ProductProfitData,
} from "@/services/reportService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays, startOfDay, endOfDay } from 'date-fns';

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
          <p className={`text-xs flex items-center ${trendType === "positive" ? "text-emerald-500" :
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

  const [summaryStats, setSummaryStats] = React.useState<ProfitSummaryStats | null>(null);
  const [topProducts, setTopProducts] = React.useState<ProductProfitData[]>([]);

  const [isLoadingPage, setIsLoadingPage] = React.useState(true);
  const [isLoadingTopProducts, setIsLoadingTopProducts] = React.useState(true);
  const [errorMessages, setErrorMessages] = React.useState<string[]>([]);

  const [timePeriod, setTimePeriod] = React.useState("30");

  React.useEffect(() => {
    const fetchSummaryData = async () => {
      if (!storeIdFromUrl) {
        setErrorMessages(prev => [...prev, "No store selected. Please select a store to view reports."]);
        setIsLoadingPage(false);
        return;
      }
      setIsLoadingPage(true);
      const { data, error } = await getProfitSummaryStats(storeIdFromUrl);
      if (error) {
        setErrorMessages(prev => [...prev, `Summary Stats: ${error.message || 'Failed to fetch.'}`]);
        setSummaryStats(null);
      } else {
        setSummaryStats(data);
      }
      setIsLoadingPage(false);
    };
    fetchSummaryData();
  }, [storeIdFromUrl]);

  React.useEffect(() => {
    const fetchTopProducts = async () => {
      if (!storeIdFromUrl) return;

      setIsLoadingTopProducts(true);
      const days = parseInt(timePeriod, 10);
      const { data, error } = await getTopProductsByProfit(storeIdFromUrl, 5, days);

      if (error) {
        toast({ variant: "destructive", title: "Error fetching top products", description: error.message });
        setTopProducts([]);
      } else {
        setTopProducts(data || []);
      }
      setIsLoadingTopProducts(false);
    };
    fetchTopProducts();
  }, [storeIdFromUrl, timePeriod, toast]);

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
      return `ZMW ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${Number(value).toFixed(1)}%`;
  };

  const cardValue = (dataAvailable: boolean, value: number, isCurrency = true) => {
    return isLoadingPage ? "Loading..." : (dataAvailable ? displayValue(value, isCurrency) : "N/A");
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Profit Report</h1>
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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Gross Profit (YTD)"
          value={cardValue(summaryStats !== null, ytdGrossProfit)}
          icon={DollarSign}
          description="Year-to-date gross profit."
          isLoading={isLoadingPage}
        />
        <StatCard
          title="COGS (YTD)"
          value={cardValue(summaryStats !== null, ytdCogs)}
          icon={Receipt}
          description="Year-to-date cost of goods sold."
          isLoading={isLoadingPage}
        />
        <StatCard
          title="Gross Profit Margin (YTD)"
          value={cardValue(summaryStats !== null, ytdProfitMargin, false)}
          icon={Percent}
          description="YTD gross profit as % of revenue."
          isLoading={isLoadingPage}
        />
        <StatCard
          title="Net Profit (Est. YTD)"
          value={cardValue(summaryStats !== null, netProfitEstYTD)}
          icon={Landmark}
          description="Est. YTD Net Profit (before ops costs)."
          isLoading={isLoadingPage}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products by Profit</CardTitle>
          <CardDescription>
            {timePeriod === "0" ? "Showing top products for all time." : `Showing top products from the last ${timePeriod} days.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTopProducts ? (
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
                  <TableRow key={product.product_id} className="cursor-pointer" onClick={() => router.push(`/products/${product.product_id}${queryParams}`)}>
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
                      <p className="font-medium hover:underline">
                        {product.product_name}
                      </p>
                      <div className="text-xs text-muted-foreground">{product.product_category}</div>
                    </TableCell>
                    <TableCell className="text-right">ZMW {Number(product.total_profit_generated).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{product.units_sold.toLocaleString()}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {Number(product.units_sold) > 0 ? `ZMW ${(Number(product.total_profit_generated) / Number(product.units_sold)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "ZMW 0.00"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/products/${product.product_id}${queryParams}`); }}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No top product profit data available for this period.</p>
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
