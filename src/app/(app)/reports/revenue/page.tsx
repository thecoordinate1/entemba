
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  ArrowLeft,
  Percent,
  Banknote
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import * as React from "react";

const monthlyRevenueData = [
  { month: "January", revenue: 30250 },
  { month: "February", revenue: 35100 },
  { month: "March", revenue: 40750 },
  { month: "April", revenue: 25600 },
  { month: "May", revenue: 45231 },
  { month: "June", revenue: 51300 },
];

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
};

const topProductsData = [
  { id: "prod_1", name: "Ergonomic Office Chair", revenue: 12050.50, unitsSold: 43, image: "https://placehold.co/40x40.png", dataAiHint: "chair office" },
  { id: "prod_2", name: "Wireless Noise-Cancelling Headphones", revenue: 9850.00, unitsSold: 49, image: "https://placehold.co/40x40.png", dataAiHint: "headphones tech" },
  { id: "prod_5", name: "Artisan Coffee Blend", revenue: 7500.75, unitsSold: 469, image: "https://placehold.co/40x40.png", dataAiHint: "coffee food" },
  { id: "prod_3", name: "Organic Cotton T-Shirt", revenue: 5200.25, unitsSold: 231, image: "https://placehold.co/40x40.png", dataAiHint: "shirt fashion" },
  { id: "prod_mock_1", name: "Premium Laptop Stand", revenue: 4800.00, unitsSold: 120, image: "https://placehold.co/40x40.png", dataAiHint: "laptop stand" },
];

const revenueSourceData = [
    { name: 'Online Store', value: 120500, color: 'hsl(var(--chart-1))' },
    { name: 'Marketplace A', value: 45300, color: 'hsl(var(--chart-2))' },
    { name: 'Manual Orders', value: 15750, color: 'hsl(var(--chart-3))' },
    { name: 'Other', value: 8600, color: 'hsl(var(--chart-4))' },
];


interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  trendType?: "positive" | "negative" | "neutral";
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, trend, trendType }) => (
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
          {trendType === "negative" && <TrendingUp className="mr-1 h-4 w-4 rotate-180" />} {/* Fixed: Using TrendingUp and rotating for negative trend */}
          {trend}
        </p>
      )}
      {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
    </CardContent>
  </Card>
);

export default function RevenueReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [defaultCurrency, setDefaultCurrency] = React.useState("USD");
  const [taxRate, setTaxRate] = React.useState("10"); // Stored as string for input
  const [pricesIncludeTax, setPricesIncludeTax] = React.useState(false);

  const handleSaveRevenueSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for actual save logic
    console.log({ defaultCurrency, taxRate, pricesIncludeTax });
    toast({
      title: "Settings Saved",
      description: "Your revenue settings have been (mock) saved.",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Revenue Report</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue (YTD)"
          value="$150,750.20"
          icon={DollarSign}
          description="Year-to-date gross revenue."
          trend="+15.2% vs last year"
          trendType="positive"
        />
        <StatCard
          title="Revenue (This Month)"
          value="$45,231.89"
          icon={DollarSign}
          description="Gross revenue for the current month."
          trend="+$5,231 vs last month"
          trendType="positive"
        />
        <StatCard
          title="Average Order Value"
          value="$85.50"
          icon={ShoppingCart}
          description="Average amount spent per order."
          trend="-2.5% vs last month"
          trendType="negative"
        />
        <StatCard
          title="Total Transactions"
          value="1,763"
          icon={CreditCard}
          description="Total successful transactions YTD."
          trend="+120 transactions this month"
          trendType="positive"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Track your gross revenue month over month.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
                    tickFormatter={(value) => `$${Number(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" formatter={(value) => `$${Number(value).toLocaleString()}`} />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
                <CardDescription>Distribution of revenue across different channels.</CardDescription>
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
                                    <span>${Number(value).toLocaleString()} ({(props.payload?.percent * 100).toFixed(1)}%)</span>
                                </div>
                            )} />}
                        />
                        <Pie
                            data={revenueSourceData}
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
                                // Adjust label position to avoid overlap, very basic adjustment
                                if (name === 'Marketplace A' && (percent * 100) < 30) { // Example condition
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
                            {revenueSourceData.map((entry, index) => (
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
          <CardDescription>Detailed breakdown of revenue by products this month.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right hidden md:table-cell">Units Sold</TableHead>
                <TableHead className="text-right hidden md:table-cell">AOV</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProductsData.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                      data-ai-hint={product.dataAiHint}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/products/${product.id}`} className="font-medium hover:underline">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">${product.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{product.unitsSold}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">${(product.revenue / product.unitsSold).toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/products/${product.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
            <Button variant="outline" asChild>
              <Link href="/reports/revenue/products">View All Products Revenue</Link>
            </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Revenue Settings</CardTitle>
            <CardDescription>Configure currency, tax, and payment gateway options.</CardDescription>
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
                            <SelectItem value="USD">USD - United States Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                            <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
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
                Connect payment gateways like Stripe, PayPal, etc. (Integration TBD).
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled>Connect Stripe</Button>
                <Button type="button" variant="outline" disabled>Connect PayPal</Button>
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

