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
  storeId: string;
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
  deliveryTier?: string;
  paymentMethod?: string;
  deliveryCode?: string;
  shippingLatitude?: number;
  shippingLongitude?: number;
  deliveryType?: 'self_delivery' | 'courier' | null;
  pickupAddress?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  customerSpecification?: string;
  deliveryCost?: number | null;
  driverId?: string | null;
  notes?: Record<string, any> | null;
  serviceFees?: number | null;
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
  banner?: string;
  status: StoreStatus;
  categories: string[];
  socialLinks?: SocialLink[];
  location?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWebsite?: string;
  slug?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  createdAt: string;
  isVerified: boolean;
  commissionRate?: number;
  averageRating: number;
  reviewCount: number;
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
  attributes?: Record<string, any>;
  is_dropshippable?: boolean;
  supplier_product_id?: string | null;
  supplier_price?: number | null;
}

/**
 * Vendor interface mirrors the public.vendors table. All fields are optional except `id`
 * because they are filled after sign‑up. This type is used throughout the app for
 * type‑safe profile handling.
 */
export interface Vendor {
  id: string;
  display_name: string;
  email?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_branch_name?: string | null;
  mobile_money_provider?: string | null;
  mobile_money_number?: string | null;
  mobile_money_name?: string | null;
  is_supplier?: boolean;
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
