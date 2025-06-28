
import type { LucideIcon } from "lucide-react";
import { PackageCheck, Truck, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  images: string[];
  dataAiHints: string[];
  category: string;
  price: number;
  orderPrice?: number; // Price specifically for orders, if different from regular price
  stock: number;
  status: "Active" | "Draft" | "Archived";
  createdAt: string;
  description?: string;
  fullDescription: string;
  sku?: string;
  tags?: string[];
  weight?: number; // in kg
  dimensions?: { length: number; width: number; height: number }; // in cm
  averageRating?: number;
  reviewCount?: number;
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
  itemsCount: number;
  detailedItems: OrderItem[];
  shippingAddress: string;
  billingAddress: string;
  shippingMethod?: string;
  paymentMethod?: string;
  trackingNumber?: string;
  shippingLatitude?: number;
  shippingLongitude?: number;
  deliveryType?: 'self_delivery' | 'courier' | null;
}

export interface SocialLink {
  platform: "Instagram" | "Facebook" | "Twitter" | "TikTok" | "LinkedIn" | "Other";
  url: string;
}
export interface Store {
  id: string;
  name: string;
  description: string;
  logo: string;
  dataAiHint: string;
  status: "Active" | "Inactive" | "Maintenance";
  category: string;
  socialLinks?: SocialLink[];
  location?: string;
  createdAt: string;
}

export type CustomerStatus = 'Active' | 'Inactive' | 'Blocked';

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  dataAiHintAvatar: string;
  totalSpent: number;
  totalOrders: number;
  joinedDate: string;
  lastOrderDate?: string;
  status: CustomerStatus;
  tags?: string[];
  phone?: string;
  address?: {
    street: string;
    city: string;
    state?: string;
    zip: string;
    country: string;
  };
}


export const initialProducts: Product[] = [
  // Mock product data removed to simulate backend-driven data
];


export const initialOrders: Order[] = [
  // Mock order data removed to simulate backend-driven data
];


export const orderStatusColors: Record<OrderStatus, string> = {
  Pending: "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-400 border-yellow-500/30",
  Processing: "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-400 border-blue-500/30",
  Shipped: "bg-purple-500/20 text-purple-700 dark:bg-purple-500/30 dark:text-purple-400 border-purple-500/30",
  Delivered: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30",
  Cancelled: "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-400 border-red-500/30",
};

export const orderStatusIcons: Record<OrderStatus, LucideIcon> = {
  Pending: RefreshCw,
  Processing: PackageCheck,
  Shipped: Truck,
  Delivered: CheckCircle,
  Cancelled: XCircle,
};


export const initialStores: Store[] = [
  {
    id: "store_1", // This ID is used as a fallback if no store is in URL params
    name: "The Artisan Boutique",
    description: "Curated handcrafted goods from around the world.",
    logo: "https://placehold.co/200x100.png",
    dataAiHint: "storefront boutique",
    status: "Active",
    category: "Handmade & Craft",
    socialLinks: [
      { platform: "Instagram", url: "https://instagram.com/artisanboutique" },
      { platform: "Facebook", url: "https://facebook.com/artisanboutique" },
    ],
    location: "New York, NY",
    createdAt: "2022-11-10",
  },
  {
    id: "store_2",
    name: "Tech Gadget Hub",
    description: "Latest and greatest in tech and electronics.",
    logo: "https://placehold.co/200x100.png",
    dataAiHint: "tech store",
    status: "Active",
    category: "Electronics",
    socialLinks: [
      { platform: "Twitter", url: "https://twitter.com/techgadgethub" },
    ],
    location: "San Francisco, CA",
    createdAt: "2023-01-25",
  },
  // Other mock stores can remain if needed for initial UI testing without a backend connection,
  // but the AppShell already fetches actual stores.
];

export const storeStatusColors: Record<Store["status"], string> = {
  Active: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30",
  Inactive: "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-400 border-slate-500/30",
  Maintenance: "bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-400 border-amber-500/30",
};

export const initialCustomers: Customer[] = [
  // Mock customer data removed to simulate backend-driven data
];


export const customerStatusColors: Record<CustomerStatus, string> = {
  Active: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30",
  Inactive: "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-400 border-slate-500/30",
  Blocked: "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-400 border-red-500/30",
};
    
