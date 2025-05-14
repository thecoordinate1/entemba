
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  BarChart2,
  PieChart as PieChartIcon,
  ArrowLeft,
  Receipt,
  Landmark
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

// Mock Data for Profit Report
const monthlyProfitData = [
  { month: "January", profit: 10150 },
  { month: "February", profit: 12800 },
  { month: "March", profit: 15900 },
  { month: "April", profit: 8500 },
  { month: "May", profit: 18300 },
  { month: "June", profit: 20500 },
];

const profitChartConfig = {
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-2))", // Using a different chart color
  },
};

const topProductsByProfitData = [
  { id: "prod_1", name: "Ergonomic Office Chair", profit: 5020.25, unitsSold: 43, image: "https://placehold.co/40x40.png", dataAiHint: "chair office" },
  { id: "prod_2", name: "Wireless Noise-Cancelling Headphones", profit: 4500.00, unitsSold: 49, image: "https://placehold.co/40x40.png", dataAiHint: "headphones tech" },
  { id: "prod_5", name: "Artisan Coffee Blend", profit: 3200.50, unitsSold: 469, image: "https://placehold.co/40x40.png", dataAiHint: "coffee food" },
];

const profitByCategoryData = [
    { name: 'Furniture', value: 8500, color: 'hsl(var(--chart-1))' },
    { name: 'Electronics', value: 7200, color: 'hsl(var(--chart-2))' },
    { name: 'Groceries', value: 5800, color: 'hsl(var(--chart-3))' },
    { name: 'Apparel', value: 3500, color: 'hsl(var(--chart-4))' },
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
          {trendType === "negative" && <TrendingDown className="mr-1 h-4 w-4" />}
          {trend}
        </p>
      )}
      {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
    </CardContent>
  </Card>
);

export default function ProfitReportPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profit Report</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gross Profit (YTD)"
          value="K76,500.75"
          icon={DollarSign}
          description="Total revenue minus COGS."
          trend="+12.5% vs last year"
          trendType="positive"
        />
        <StatCard
          title="Net Profit (YTD)"
          value="K55,200.30"
          icon={Landmark} // Using Landmark as an icon for Net Profit
          description="Profit after all expenses."
          trend="+K8,100 vs last period"
          trendType="positive"
        />
        <StatCard
          title="Profit Margin"
          value="36.6%"
          icon={Percent}
          description="Net profit as a percentage of revenue."
          trend="+1.5% vs last month"
          trendType="positive"
        />
        <StatCard
          title="Cost of Goods Sold (COGS)"
          value="K21,300.45"
          icon={Receipt}
          description="Direct costs of producing goods."
          trend="-K1,200 vs last month (lower is better)"
          trendType="positive" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly Profit Trend</CardTitle>
            <CardDescription>Track your net profit month over month.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={profitChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyProfitData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
                    tickFormatter={(value) => `K${Number(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" formatter={(value) => `K${Number(value).toLocaleString()}`} />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Profit by Category</CardTitle>
                <CardDescription>Distribution of profit across product categories.</CardDescription>
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
                            data={profitByCategoryData}
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
                            {profitByCategoryData.map((entry, index) => (
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
          <CardDescription>Detailed breakdown of profit by products this month.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right hidden md:table-cell">Units Sold</TableHead>
                <TableHead className="text-right hidden md:table-cell">Profit/Unit</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProductsByProfitData.map((product) => (
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
                  <TableCell className="text-right">K{product.profit.toFixed(2)}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{product.unitsSold}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {product.unitsSold > 0 ? `K${(product.profit / product.unitsSold).toFixed(2)}` : "K0.00"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/products/${product.id}`}>View Product</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
            <Button variant="outline" disabled>View All Products Profit (TBD)</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

