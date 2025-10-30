import type { LucideIcon } from "lucide-react";

export type OrderStatus = "Pending" | "Confirmed" | "Driver Picking Up" | "Delivering" | "Delivered" | "Cancelled";
export type CustomerStatus = 'Active' | 'Inactive' | 'Blocked';
export type ProductStatus = "Active" | "Draft" | "Archived";
export type StoreStatus = "Active" | "Inactive" | "Maintenance";

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number; 
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string; 
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
  pickupAddress?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  customerSpecification?: string;
  deliveryCost?: number | null;
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
  status: StoreStatus;
  categories: string[];
  socialLinks?: SocialLink[];
  location?: string;
  contactPhone?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatar: string;
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

export interface ProductVariant {
    id: string;
    price: number;
    orderPrice?: number | null;
    stock: number;
    sku?: string | null;
    isDefault: boolean;
    options: {
        type: string;
        value: string;
    }[];
}

export interface Product {
  id: string;
  name: string;
  images: string[];
  category: string;
  price: number;
  orderPrice?: number;
  stock: number;
  status: ProductStatus;
  createdAt: string;
  description?: string;
  fullDescription: string;
  sku?: string;
  tags?: string[];
  weight?: number; // in kg
  dimensions?: { length: number; width: number; height: number }; // in cm
  variants: ProductVariant[];
}

export const orderStatusIcons: Record<OrderStatus, LucideIcon> = {
  Pending: require("lucide-react").RefreshCw,
  Confirmed: require("lucide-react").PackageCheck,
  "Driver Picking Up": require("lucide-react").PersonStanding,
  Delivering: require("lucide-react").Truck,
  Delivered: require("lucide-react").CheckCircle,
  Cancelled: require("lucide-react").XCircle,
};

export const orderStatusColors: Record<OrderStatus, string> = {
  Pending: "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-400 border-yellow-500/30",
  Confirmed: "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-400 border-blue-500/30",
  "Driver Picking Up": "bg-cyan-500/20 text-cyan-700 dark:bg-cyan-500/30 dark:text-cyan-400 border-cyan-500/30",
  Delivering: "bg-purple-500/20 text-purple-700 dark:bg-purple-500/30 dark:text-purple-400 border-purple-500/30",
  Delivered: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30",
  Cancelled: "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-400 border-red-500/30",
};

export const customerStatusColors: Record<CustomerStatus, string> = {
  Active: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30",
  Inactive: "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-400 border-slate-500/30",
  Blocked: "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-400 border-red-500/30",
};

export const storeStatusColors: Record<StoreStatus, string> = {
  Active: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30",
  Inactive: "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-400 border-slate-500/30",
  Maintenance: "bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-400 border-amber-500/30",
};
