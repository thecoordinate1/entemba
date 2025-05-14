
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
  LineChart 
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
import { initialProducts, initialStores, type Store } from "@/lib/mockData"; 

const chartData = [
  { month: "January", sales: 186, orders: 80 },
  { month: "February", sales: 305, orders: 200 },
  { month: "March", sales: 237, orders: 120 },
  { month: "April", sales: 73, orders: 190 },
  { month: "May", sales: 209, orders: 130 },
  { month: "June", sales: 214, orders: 140 },
];

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-2))",
  },
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  changeType?: "positive" | "negative";
  description: string;
  ctaLink?: string;
  ctaText?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, change, changeType, description, ctaLink, ctaText }) => (
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

const topProductsToDisplay = initialProducts.slice(0, 3).map(p => ({
  id: p.id,
  name: p.name,
  sales: p.id === "prod_2" ? 1250 : p.id === "prod_5" ? 980 : 750, 
  image: p.images[0] || "https://picsum.photos/50/50?grayscale",
  dataAiHint: p.dataAiHints[0] || "product",
}));


export default function DashboardPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const [selectedStoreName, setSelectedStoreName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (storeId) {
      const store = initialStores.find((s: Store) => s.id === storeId);
      setSelectedStoreName(store ? store.name : "Unknown Store");
    } else if (initialStores.length > 0) {
      setSelectedStoreName(initialStores[0].name); // Default to first store if no ID in URL
    } else {
      setSelectedStoreName("No Store Selected");
    }
  }, [storeId]);

  const storeContextMessage = selectedStoreName ? ` for ${selectedStoreName}` : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$45,231.89"
          icon={DollarSign}
          change="+$5,231 from last month"
          changeType="positive"
          description={`Total earnings this period${storeContextMessage}`}
          ctaLink="/reports/revenue"
          ctaText="View Revenue Report"
        />
         <StatCard
          title="Profit"
          value="$12,875.00"
          icon={LineChart} 
          change="+$1,200 from last month"
          changeType="positive"
          description={`Total profit after all expenses${storeContextMessage}`}
          ctaLink="/reports/profit"
          ctaText="View Profit Details"
        />
        <StatCard
          title="Active Orders"
          value="185"
          icon={Activity} 
          change="65 completed in last 30d"
          description={`35 new orders today${storeContextMessage}`}
          ctaLink="/orders"
          ctaText="Manage Orders"
        />
        <StatCard
          title="Products Sold"
          value="12,234"
          icon={Package}
          change="+1,200 this month"
          changeType="positive"
          description={`Total items sold across all orders${storeContextMessage}`}
          ctaLink="/products"
          ctaText="Manage Products"
        />
        <StatCard
          title="New Customers"
          value="573"
          icon={Users}
          change="+82 this week"
          changeType="positive"
          description={`Customers who signed up recently${storeContextMessage}`}
          ctaLink="/customers"
          ctaText="View Customers"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Monthly sales and order trends{storeContextMessage}.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
                    tickFormatter={(value) => `$${value}`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                  <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Your best-selling items this month{storeContextMessage}.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {topProductsToDisplay.map((product) => (
                <li key={product.id} className="flex items-center gap-4">
                  <Image
                    src={product.image} 
                    alt={product.name} 
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-md object-cover"
                    data-ai-hint={product.dataAiHint} 
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/products/${product.id}`}>View</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
