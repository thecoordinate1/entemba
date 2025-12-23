"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  ArrowRight,
  Activity,
  LineChart,
  AlertCircle,
  Store,
  Calendar,
  CreditCard,
  ChevronRight,
  MoreHorizontal,
  Clock,
  MapPin,
  Zap
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { User as AuthUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { NoticeCenter } from "@/components/NoticeCenter";
import { getStoreOrderStats, getStoreTotalProductsSold, getMonthlySalesOverviewForStore, getOrdersByStoreId, type MonthlySalesDataFromRPC, type OrderFromSupabase } from "@/services/orderService";
import { getStoreTopSellingProductsRPC, getProductsByStoreId, type TopSellingProductFromRPC } from "@/services/productService";
import { getNewCustomersForStoreCount } from "@/services/customerService";
import { getStoreById, getStoresByUserId, type StoreFromSupabase } from "@/services/storeService";
import { getProfitSummaryStats, type ProfitSummaryStats } from "@/services/reportService";

// --- Types & Config ---

const chartConfig = {
  sales: {
    label: "Sales (ZMW)",
    color: "hsl(var(--primary))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--secondary))",
  },
};

interface SalesChartDataItem {
  month: string;
  sales: number;
  orders: number;
}

interface DashboardTopProduct {
  id: string;
  name: string;
  category: string;
  image: string | null;
  unitsSold: number;
}

// --- polished helper components ---

const DateDisplay = () => {
  const [date, setDate] = React.useState<string | null>(null);
  React.useEffect(() => {
    setDate(format(new Date(), "EEEE, d MMM"));
  }, []);
  if (!date) return <Skeleton className="h-4 w-24" />;
  return <span className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {date}</span>;
}

import { MetricCard } from "@/components/MetricCard";

// --- Mobile Quick Actions ---

const MobileQuickActions = ({ storeId, productsCount, ordersCount, actionsCount }: { storeId: string | null, productsCount: number, ordersCount: number, actionsCount: number }) => {
  if (!storeId) return null;
  const qp = `?storeId=${storeId}`;

  const actions = [
    {
      label: "Add Product",
      href: `/products/new${qp}`,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      gradient: "from-primary/10 to-transparent",
      count: productsCount
    },
    {
      label: "Orders",
      href: `/orders${qp}`,
      icon: ShoppingCart,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800",
      gradient: "from-orange-500/10 to-transparent",
      count: ordersCount
    },
    {
      label: "Share Store",
      href: `/share${qp}`,
      icon: Store,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800",
      gradient: "from-blue-500/10 to-transparent"
    },
    {
      label: "Analytics",
      href: `/reports/revenue${qp}`,
      icon: LineChart,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800",
      gradient: "from-emerald-500/10 to-transparent"
    },
    {
      label: "Actions",
      href: "#action-center",
      icon: Zap,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800",
      gradient: "from-purple-500/10 to-transparent",
      count: actionsCount
    }
  ];

  return (
    <div className="md:hidden">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-2">

        {actions.map((action) => {
          const isAnchor = action.href.startsWith('#');

          const content = (
            <>
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm transition-all duration-300 group-active:scale-95 group-active:shadow-inner relative",
                "bg-gradient-to-br",
                action.bg,
                action.color
              )}>
                <action.icon className="h-6 w-6" />
                {action.count !== undefined && action.count > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-background shadow-sm">
                    {action.count > 99 ? '99+' : action.count}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground group-active:text-foreground">
                {action.label}
              </span>
            </>
          );

          const commonClasses = "flex flex-col items-center gap-2 group p-2 rounded-xl active:bg-muted/50 transition-colors w-full";

          if (isAnchor) {
            return (
              <button
                key={action.label}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const targetId = action.href.substring(1);
                  const element = document.getElementById(targetId);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={commonClasses}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={action.label}
              href={action.href}
              className={commonClasses}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// --- Recent Order Item ---
const RecentOrderItem = ({ order }: { order: OrderFromSupabase }) => {
  const timeAgo = order.created_at ? formatDistanceToNow(parseISO(order.created_at), { addSuffix: true }) : 'recently';

  // Truncate logic for safety
  const displayStatus = order.status.length > 12 ? order.status.substring(0, 10) + '...' : order.status;

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 min-w-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={cn("h-10 w-10 shrink-0 rounded-full flex items-center justify-center border",
          order.status === 'Pending' ? "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/50" :
            order.status === 'Confirmed' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50" :
              "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:border-gray-700"
        )}>
          <ShoppingCart className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-none truncate">{order.customer_name || 'Guest'}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal border-muted-foreground/30 text-muted-foreground shrink-0">
              {displayStatus}
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0 whitespace-nowrap">
              <Clock className="w-3 h-3" /> {timeAgo}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold whitespace-nowrap">ZMW {order.total_amount?.toLocaleString()}</p>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full ml-auto mt-1" asChild>
          <Link href={`/orders/${order.id}`}>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

// --- Page Component ---

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeId = searchParams.get("storeId");
  const { toast } = useToast();
  const supabase = createClient();

  // State
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [hasStores, setHasStores] = React.useState<boolean | null>(null);
  const [selectedStore, setSelectedStore] = React.useState<StoreFromSupabase | null>(null);

  // Data State
  const [totalRevenue, setTotalRevenue] = React.useState<number | null>(null);
  const [escrowAmount, setEscrowAmount] = React.useState<number | null>(null);
  const [activeOrdersCount, setActiveOrdersCount] = React.useState<number | null>(null);
  const [productsSoldCount, setProductsSoldCount] = React.useState<number | null>(null);
  const [newCustomersCount, setNewCustomersCount] = React.useState<number | null>(null);
  const [topProducts, setTopProducts] = React.useState<DashboardTopProduct[]>([]);
  const [profitStats, setProfitStats] = React.useState<ProfitSummaryStats | null>(null);
  const [salesChartData, setSalesChartData] = React.useState<SalesChartDataItem[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<OrderFromSupabase[]>([]);
  const [productsCount, setProductsCount] = React.useState<number>(0);

  const [isLoading, setIsLoading] = React.useState(true);
  const [greeting, setGreeting] = React.useState("");

  // Initial Auth Check
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user);
    });
  }, [supabase]);

  // Greeting Logic
  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Store Check Logic
  React.useEffect(() => {
    const checkUserStores = async () => {
      if (authUser) {
        const { data, error } = await getStoresByUserId(authUser.id);
        if (error) {
          console.error("Error checking stores:", error);
          setHasStores(false);
        } else {
          setHasStores(data ? data.length > 0 : false);
        }
      } else {
        setHasStores(null);
      }
    };
    checkUserStores();
  }, [authUser]);

  // Main Data Fetch
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      if (!authUser || hasStores === null) {
        if (!authUser) setIsLoading(false);
        return;
      }

      if (!storeId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const [
          storeRes,
          orderStatsRes,
          productsSoldRes,
          productsCountRes, // Added for total product count
          topProductsRes,
          salesChartRes,
          newCustomersRes,
          profitStatsRes,
          recentOrdersRes
        ] = await Promise.allSettled([
          getStoreById(storeId, authUser.id),
          getStoreOrderStats(storeId),
          getStoreTotalProductsSold(storeId),
          getProductsByStoreId(storeId, 1, 1), // Fetch total count of products
          getStoreTopSellingProductsRPC(storeId, 5, 30), // Fetch 5 items
          getMonthlySalesOverviewForStore(storeId, 6),
          getNewCustomersForStoreCount(storeId, 30),
          getProfitSummaryStats(storeId),
          getOrdersByStoreId(storeId, 1, 4) // Fetch 4 recent orders
        ]);

        // Handle Store
        if (storeRes.status === 'fulfilled' && !storeRes.value.error && storeRes.value.data) {
          setSelectedStore(storeRes.value.data);
        } else {
          setSelectedStore(null); // Handle error visually if needed
        }

        // Handle Stats
        if (orderStatsRes.status === 'fulfilled' && !orderStatsRes.value.error) {
          setTotalRevenue(orderStatsRes.value.data?.totalRevenue ?? null);
          setEscrowAmount(orderStatsRes.value.data?.inEscrow ?? null);
          setActiveOrdersCount(orderStatsRes.value.data?.activeOrdersCount ?? null);
        }

        if (productsSoldRes.status === 'fulfilled' && !productsSoldRes.value.error) {
          setProductsSoldCount(productsSoldRes.value.data);
        }

        // Handle total products count
        if (productsCountRes.status === 'fulfilled' && !productsCountRes.value.error) {
          setProductsCount(productsCountRes.value.count ?? 0);
        }

        if (topProductsRes.status === 'fulfilled' && !topProductsRes.value.error) {
          const mapped = (topProductsRes.value.data || []).map(p => ({
            id: p.product_id,
            name: p.product_name,
            category: p.product_category,
            image: p.primary_image_url,
            unitsSold: p.total_quantity_sold || 0,
          }));
          setTopProducts(mapped);
        }

        if (salesChartRes.status === 'fulfilled' && !salesChartRes.value.error) {
          const mapped = (salesChartRes.value.data || []).map(item => ({
            month: isValid(parseISO(item.period_start_date)) ? format(parseISO(item.period_start_date), 'MMM') : '???',
            sales: item.total_sales || 0,
            orders: item.order_count || 0
          })).reverse();
          setSalesChartData(mapped);
        }

        if (newCustomersRes.status === 'fulfilled' && !newCustomersRes.value.error) {
          setNewCustomersCount(newCustomersRes.value.data?.count ?? null);
        }

        if (profitStatsRes.status === 'fulfilled' && !profitStatsRes.value.error) {
          setProfitStats(profitStatsRes.value.data);
        }

        if (recentOrdersRes.status === 'fulfilled' && !recentOrdersRes.value.error && recentOrdersRes.value.data) {
          setRecentOrders(recentOrdersRes.value.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [storeId, authUser, hasStores]);

  // --- Render Helpers ---

  const storeContextMessage = selectedStore ? ` for ${selectedStore.name}` : "";
  const queryParams = storeId ? `?storeId=${storeId}` : "";

  // 1. Loading Skeleton
  if (isLoading || hasStores === null) {
    return (
      <div className="space-y-6 pt-4 px-4 pb-20 md:p-8 max-w-7xl mx-auto animate-pulse overflow-x-hidden">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full rounded-2xl md:w-64" /> {/* Header */}
          <div className="flex gap-3 md:hidden overflow-hidden">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-16 rounded-2xl shrink-0" />)}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-3 h-[400px]">
          <Skeleton className="md:col-span-2 rounded-2xl" />
          <Skeleton className="md:col-span-1 rounded-2xl" />
        </div>
      </div>
    );
  }

  // 2. Empty State (No Store)
  if (!storeId && !hasStores) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500 overflow-x-hidden">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5 animate-pulse-primary">
          <Store className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Welcome!</h2>
        <p className="text-muted-foreground mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">
          Start your journey by creating your first store. It only takes a minute.
        </p>
        <Button size="lg" className="rounded-full px-8 h-12 w-full sm:w-auto text-base font-medium shadow-lg hover:shadow-primary/25 transition-all" onClick={() => router.push('/stores')}>
          Create Store <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    );
  }

  // 3. Select Store Prompt
  if (!storeId && hasStores) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 overflow-x-hidden">
        <div className="bg-muted p-4 rounded-full mb-4">
          <Store className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Select a Store</h2>
        <p className="text-muted-foreground mt-2 mb-6 max-w-xs mx-auto">Please select a store from the menu to see its data.</p>
      </div>
    )
  }

  // 4. Main Dashboard
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20 overflow-x-hidden w-full max-w-[100vw]">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {greeting}, <span className="text-primary">{authUser?.user_metadata?.display_name?.split(' ')[0] || "Vendor"}</span>
            </h2>
          </div>
          <div className="text-sm md:text-base text-muted-foreground flex items-center gap-2">
            <span className="truncate max-w-[200px] font-medium">{selectedStore?.name}</span>
            <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50" />
            <DateDisplay />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/products/new${queryParams}`}>
              <Package className="w-4 h-4" /> Add Product
            </Link>
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20" asChild>
            <Link href={`/orders${queryParams}`}>
              <ShoppingCart className="w-4 h-4" /> Orders
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile Quick Actions (Visible only on mobile) */}
      <MobileQuickActions
        storeId={storeId}
        productsCount={productsCount}
        ordersCount={activeOrdersCount || 0}
        actionsCount={0} // Computed inside NoticeCenter, passing 0 for now to hide badge or needing lift state up
      />

      <div id="action-center" className="scroll-mt-24">
        <NoticeCenter store={selectedStore} userId={authUser?.id || ""} />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Orders"
          value={activeOrdersCount !== null ? activeOrdersCount.toLocaleString() : "0"}
          icon={ShoppingCart}
          description="Pending & Confirmed orders"
          ctaLink={`/orders${queryParams}`}
          ctaText="Manage Orders"
          className="bg-primary/5 border-primary/20"
        />
        <MetricCard
          title="Total Revenue"
          value={totalRevenue !== null ? `ZMW ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "N/A"}
          secondaryValue={escrowAmount ? `ZMW ${escrowAmount.toLocaleString()}` : undefined}
          secondaryLabel="pending payout"
          icon={DollarSign}
          description="Gross earnings before fees"
          ctaLink={`/reports/revenue${queryParams}`}
          ctaText="View Revenue"
        />
        <MetricCard
          title="Gross Profit"
          value={profitStats?.ytd_gross_profit ? `ZMW ${profitStats.ytd_gross_profit.toLocaleString()}` : "ZMW 0.00"}
          icon={LineChart}
          description="Year-To-Date Profit"
          ctaLink={`/reports/profit${queryParams}`}
          ctaText="View Profit Report"
        />
        <MetricCard
          title="Total Products Sold"
          value={productsSoldCount !== null ? productsSoldCount.toLocaleString() : "0"}
          icon={Package}
          description="Items sold all-time"
          ctaLink={`/products${queryParams}`}
          ctaText="View Products"
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7 relative">

        {/* Sales Chart */}
        <Card className="md:col-span-4 lg:col-span-4 shadow-sm border-border/60 flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Revenue Trend</CardTitle>
                <CardDescription>Performance over last 6 months</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-4 min-h-[250px] md:min-h-[300px] px-2 md:px-6">
            {salesChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      fontSize={11}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={11}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) => `K${value}`}
                      width={40}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#salesGradient)"
                    />
                    <ChartTooltip
                      cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          className="bg-background/95 backdrop-blur border shadow-lg text-xs"
                        />
                      }
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                <div className="p-4 bg-muted/30 rounded-full mb-3">
                  <LineChart className="h-6 w-6 opacity-30" />
                </div>
                No data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity / Top Products split */}
        <div className="md:col-span-3 lg:col-span-3 space-y-6">

          {/* Recent Orders Feed */}
          <Card className="shadow-sm border-border/60 flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                  <Link href={`/orders${queryParams}`}>View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              {recentOrders.length > 0 ? (
                <div className="space-y-1">
                  {recentOrders.map(order => (
                    <RecentOrderItem key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <p>No recent orders found.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products (Simplified) */}
          <Card className="shadow-sm border-border/60 flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Top Products</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                  <Link href={`/products${queryParams}`}>View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.slice(0, 3).map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Image
                          src={product.image || "https://placehold.co/100x100/png?text=Pro"}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg object-cover border bg-muted"
                        />
                        <div className="absolute -top-1 -left-1 bg-background rounded-full border shadow-sm w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{product.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold">{product.unitsSold}</span> <span className="text-[9px] text-muted-foreground">sold</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground text-xs">
                  No sales data yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
