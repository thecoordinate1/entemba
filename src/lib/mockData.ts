
import type { LucideIcon } from "lucide-react";
import { PackageCheck, Truck, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  image: string;
  dataAiHint: string;
  category: string;
  price: number;
  stock: number;
  status: "Active" | "Draft" | "Archived";
  createdAt: string;
  description?: string; // Short description for list views
  fullDescription: string; // Detailed description for product page
  sku?: string;
  tags?: string[];
  weight?: number; // in kg
  dimensions?: { length: number; width: number; height: number }; // in cm
}

export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number; // price per unit at the time of order
  image: string;
  dataAiHint: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  total: number;
  status: OrderStatus;
  itemsCount: number; // Renamed from 'items' to avoid confusion with detailedItems
  detailedItems: OrderItem[];
  shippingAddress: string;
  billingAddress: string;
  shippingMethod?: string;
  paymentMethod?: string;
  trackingNumber?: string;
}


export const initialProducts: Product[] = [
  {
    id: "prod_1",
    name: "Ergonomic Office Chair",
    image: "https://picsum.photos/id/1025/400/300",
    dataAiHint: "chair office",
    category: "Furniture",
    price: 299.99,
    stock: 150,
    status: "Active",
    createdAt: "2023-01-15",
    description: "High-back ergonomic chair with lumbar support and adjustable armrests.",
    fullDescription: "Experience ultimate comfort and support with our Ergonomic Office Chair. Designed for long hours of work, it features a breathable mesh back, adjustable lumbar support, customizable armrests, and a smooth swivel and tilt mechanism. Perfect for home offices and professional workspaces. Comes with a 5-year warranty.",
    sku: "FURN-CHR-001",
    tags: ["office", "ergonomic", "chair", "furniture"],
    weight: 15, // kg
    dimensions: { length: 60, width: 60, height: 120 }, // cm
  },
  {
    id: "prod_2",
    name: "Wireless Noise-Cancelling Headphones",
    image: "https://picsum.photos/id/1078/400/300",
    dataAiHint: "headphones tech",
    category: "Electronics",
    price: 199.50,
    stock: 85,
    status: "Active",
    createdAt: "2023-02-20",
    description: "Over-ear headphones with active noise cancellation and 30-hour battery life.",
    fullDescription: "Immerse yourself in pure sound with our Wireless Noise-Cancelling Headphones. Featuring advanced ANC technology, plush earcups, and a 30-hour battery life, these headphones are perfect for travel, work, or leisure. Crystal-clear call quality and intuitive controls.",
    sku: "ELEC-HP-002",
    tags: ["electronics", "audio", "headphones", "wireless"],
    weight: 0.25,
    dimensions: { length: 20, width: 18, height: 8 },
  },
  {
    id: "prod_3",
    name: "Organic Cotton T-Shirt",
    image: "https://picsum.photos/id/431/400/300",
    dataAiHint: "shirt fashion",
    category: "Apparel",
    price: 25.00,
    stock: 300,
    status: "Draft",
    createdAt: "2023-03-10",
    description: "Soft and breathable 100% organic cotton t-shirt, available in various colors.",
    fullDescription: "Our Organic Cotton T-Shirt is a wardrobe staple. Made from 100% GOTS-certified organic cotton, it's incredibly soft, breathable, and eco-friendly. Classic fit, durable construction. Available in sizes S-XXL and a range of versatile colors.",
    sku: "APP-TSH-003",
    tags: ["apparel", "clothing", "organic", "t-shirt"],
    weight: 0.15,
  },
  {
    id: "prod_4",
    name: "Stainless Steel Water Bottle",
    image: "https://picsum.photos/id/1072/400/300",
    dataAiHint: "bottle lifestyle",
    category: "Home Goods",
    price: 18.75,
    stock: 0,
    status: "Archived",
    createdAt: "2023-04-05",
    description: "Durable and eco-friendly 750ml stainless steel water bottle, leak-proof.",
    fullDescription: "Stay hydrated on the go with our Stainless Steel Water Bottle. This 750ml bottle is made from food-grade stainless steel, is BPA-free, and features a double-wall vacuum insulation to keep drinks cold for 24 hours or hot for 12 hours. Leak-proof lid and wide mouth for easy cleaning.",
    sku: "HOME-BOT-004",
    tags: ["home goods", "kitchen", "bottle", "reusable"],
    weight: 0.35,
  },
  {
    id: "prod_5",
    name: "Artisan Coffee Blend",
    image: "https://picsum.photos/id/225/400/300",
    dataAiHint: "coffee food",
    category: "Groceries",
    price: 15.99,
    stock: 200,
    status: "Active",
    createdAt: "2023-05-01",
    description: "Medium roast artisan coffee beans, whole bean, 12oz bag.",
    fullDescription: "Start your day right with our Artisan Coffee Blend. This medium roast features a balanced flavor profile with notes of chocolate and caramel. Sourced from sustainable farms and roasted in small batches for maximum freshness. Whole beans, 12oz (340g) bag.",
    sku: "GROC-COF-005",
    tags: ["groceries", "coffee", "beverage", "artisan"],
    weight: 0.34,
  },
];


export const initialOrders: Order[] = [
  {
    id: "ORD001",
    customerName: "Alice Wonderland",
    customerEmail: "alice@example.com",
    date: "2023-05-01",
    total: 125.50,
    status: "Delivered",
    itemsCount: 3,
    detailedItems: [
      { productId: "prod_3", name: "Organic Cotton T-Shirt", quantity: 2, price: 25.00, image: "https://picsum.photos/id/431/50/50", dataAiHint: "shirt fashion" },
      { productId: "prod_4", name: "Stainless Steel Water Bottle", quantity: 1, price: 18.75, image: "https://picsum.photos/id/1072/50/50", dataAiHint: "bottle lifestyle" },
      { productId: "prod_5", name: "Artisan Coffee Blend", quantity: 1, price: 15.99, image: "https://picsum.photos/id/225/50/50", dataAiHint: "coffee food" },
    ],
    shippingAddress: "123 Rabbit Hole Lane, Wonderland, WN 456",
    billingAddress: "123 Rabbit Hole Lane, Wonderland, WN 456",
    shippingMethod: "Standard Shipping",
    paymentMethod: "Credit Card **** 1234",
    trackingNumber: "TRK123456789",
  },
  {
    id: "ORD002",
    customerName: "Bob The Builder",
    customerEmail: "bob@example.com",
    date: "2023-05-03",
    total: 199.50,
    status: "Shipped",
    itemsCount: 1,
    detailedItems: [
      { productId: "prod_2", name: "Wireless Noise-Cancelling Headphones", quantity: 1, price: 199.50, image: "https://picsum.photos/id/1078/50/50", dataAiHint: "headphones tech" },
    ],
    shippingAddress: "456 Fixit Avenue, Builderville, BV 789",
    billingAddress: "456 Fixit Avenue, Builderville, BV 789",
    shippingMethod: "Express Shipping",
    paymentMethod: "PayPal",
    trackingNumber: "TRK987654321",
  },
  {
    id: "ORD003",
    customerName: "Charlie Brown",
    customerEmail: "charlie@example.com",
    date: "2023-05-05",
    total: 299.99,
    status: "Processing",
    itemsCount: 1,
    detailedItems: [
      { productId: "prod_1", name: "Ergonomic Office Chair", quantity: 1, price: 299.99, image: "https://picsum.photos/id/1025/50/50", dataAiHint: "chair office" },
    ],
    shippingAddress: "789 Good Grief Street, Peanuts Town, PT 101",
    billingAddress: "789 Good Grief Street, Peanuts Town, PT 101",
    shippingMethod: "Standard Shipping",
    paymentMethod: "Credit Card **** 5678",
  },
  {
    id: "ORD004",
    customerName: "Diana Prince",
    customerEmail: "diana@example.com",
    date: "2023-05-06",
    total: 43.74,
    status: "Pending",
    itemsCount: 2,
     detailedItems: [
      { productId: "prod_3", name: "Organic Cotton T-Shirt", quantity: 1, price: 25.00, image: "https://picsum.photos/id/431/50/50", dataAiHint: "shirt fashion" },
      { productId: "prod_5", name: "Artisan Coffee Blend", quantity: 1, price: 15.99, image: "https://picsum.photos/id/225/50/50", dataAiHint: "coffee food" },
    ],
    shippingAddress: "1 Wonder Woman Way, Themyscira, TH 202",
    billingAddress: "1 Wonder Woman Way, Themyscira, TH 202",
    paymentMethod: "Apple Pay",
  },
  {
    id: "ORD005",
    customerName: "Edward Scissorhands",
    customerEmail: "edward@example.com",
    date: "2023-05-02",
    total: 18.75,
    status: "Cancelled",
    itemsCount: 1,
    detailedItems: [
      { productId: "prod_4", name: "Stainless Steel Water Bottle", quantity: 1, price: 18.75, image: "https://picsum.photos/id/1072/50/50", dataAiHint: "bottle lifestyle" },
    ],
    shippingAddress: "Suburban Castle, Dark Town, DT 303",
    billingAddress: "Suburban Castle, Dark Town, DT 303",
  },
];


export const statusColors: Record<OrderStatus, string> = {
  Pending: "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-400 border-yellow-500/30",
  Processing: "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-400 border-blue-500/30",
  Shipped: "bg-purple-500/20 text-purple-700 dark:bg-purple-500/30 dark:text-purple-400 border-purple-500/30",
  Delivered: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30",
  Cancelled: "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-400 border-red-500/30",
};

export const statusIcons: Record<OrderStatus, LucideIcon> = {
  Pending: RefreshCw,
  Processing: PackageCheck,
  Shipped: Truck,
  Delivered: CheckCircle,
  Cancelled: XCircle,
};

    