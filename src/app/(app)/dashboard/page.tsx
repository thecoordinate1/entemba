
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight
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
import Image from "next/image"; // Import next/image

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
        <p className={`text-xs ${changeType === "positive" ? "text-emerald-500" : "text-red-500"} flex items-center`}>
          {changeType === "positive" ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
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

// Using a subset of initialProducts for dashboard display
const topProducts = [
  { id: "prod_2", name: "Wireless Noise-Cancelling Headphones", sales: 1250, image: "https://picsum.photos/id/1078/50/50", dataAiHint: "headphones tech" },
  { id: "prod_5", name: "Artisan Coffee Blend", sales: 980, image: "https://picsum.photos/id/225/50/50", dataAiHint: "coffee food" },
  { id: "prod_1", name: "Ergonomic Office Chair", sales: 750, image: "https://picsum.photos/id/1025/50/50", dataAiHint: "chair office" },
  // { id: "prod_X", name: "Smart Home Hub", sales: 620, image: "https://picsum.photos/id/579/50/50", dataAiHint: "smart home" }, // Example, replace with actual ID if it exists
  // { id: "prod_Y", name: "Handcrafted Leather Wallet", sales: 550, image: "https://picsum.photos/id/175/50/50", dataAiHint: "wallet fashion" },
];


export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$45,231.89"
          icon={DollarSign}
          change="+20.1% from last month"
          changeType="positive"
          description="Total earnings this period"
          ctaLink="/reports/revenue"
          ctaText="View Revenue Report"
        />
        <StatCard
          title="Total Orders"
          value="+2350"
          icon={ShoppingCart}
          change="+180.1% from last month"
          changeType="positive"
          description="New orders received"
          ctaLink="/orders"
          ctaText="Manage Orders"
        />
        <StatCard
          title="Products Sold"
          value="+12,234"
          icon={Package}
          change="+19% from last month"
          changeType="positive"
          description="Total items sold"
          ctaLink="/products"
          ctaText="Manage Products"
        />
        <StatCard
          title="New Customers"
          value="+573"
          icon={Users}
          change="+21 since last hour"
          changeType="positive"
          description="Customers who signed up"
          ctaLink="/customers"
          ctaText="View Customers"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Monthly sales and order trends.</CardDescription>
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
            <CardDescription>Your best-selling items this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {topProducts.map((product) => (
                <li key={product.id} className="flex items-center gap-4">
                  <Image // Use next/image
                    src={product.image} 
                    alt={product.name} 
                    width={48} // Specify width
                    height={48} // Specify height
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

    