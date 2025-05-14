
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
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
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
  {
    id: "prod_1",
    name: "Ergonomic Office Chair",
    images: [
        "https://placehold.co/400x300.png",
        "https://placehold.co/400x300.png",
        "https://placehold.co/400x300.png",
    ],
    dataAiHints: ["chair office", "office furniture", "ergonomic chair"],
    category: "Furniture",
    price: 299.99,
    orderPrice: 279.99, // Special order price
    stock: 150,
    status: "Active",
    createdAt: "2023-01-15",
    description: "High-back ergonomic chair with lumbar support and adjustable armrests.",
    fullDescription: "Experience ultimate comfort and support with our Ergonomic Office Chair. Designed for long hours of work, it features a breathable mesh back, adjustable lumbar support, customizable armrests, and a smooth swivel and tilt mechanism. Perfect for home offices and professional workspaces. Comes with a 5-year warranty.",
    sku: "FURN-CHR-001",
    tags: ["office", "ergonomic", "chair", "furniture"],
    weight: 15,
    dimensions: { length: 60, width: 60, height: 120 },
  },
  {
    id: "prod_2",
    name: "Wireless Noise-Cancelling Headphones",
    images: [
        "https://placehold.co/400x300.png",
        "https://placehold.co/400x300.png",
    ],
    dataAiHints: ["headphones tech", "audio gear"],
    category: "Electronics",
    price: 199.50,
    // orderPrice is undefined, so regular price applies
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
    images: ["https://placehold.co/400x300.png"],
    dataAiHints: ["shirt fashion"],
    category: "Apparel",
    price: 25.00,
    orderPrice: 22.50, // Special order price
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
    images: [
        "https://placehold.co/400x300.png",
        "https://placehold.co/400x300.png",
        "https://placehold.co/400x300.png",
        "https://placehold.co/400x300.png",
    ],
    dataAiHints: ["bottle lifestyle", "hydration metal", "reusable drinkware", "steel bottle"],
    category: "Home Goods",
    price: 18.75,
    // orderPrice is undefined
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
    images: [
        "https://placehold.co/400x300.png",
        "https://placehold.co/400x300.png",
        "https://placehold.co/400x300.png",
        "https://placehold.co/400x300.png",
        "https://placehold.co/400x300.png",
    ],
    dataAiHints: ["coffee food", "beans roast", "morning brew", "gourmet coffee", "fresh beans"],
    category: "Groceries",
    price: 15.99,
    orderPrice: 14.99, // Special order price
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
    total: 120.24, // Updated total based on potential order prices
    status: "Delivered",
    itemsCount: 3,
    detailedItems: [
      { productId: "prod_3", name: "Organic Cotton T-Shirt", quantity: 2, price: 22.50, image: "https://placehold.co/50x50.png", dataAiHint: "shirt fashion" }, // Used orderPrice
      { productId: "prod_4", name: "Stainless Steel Water Bottle", quantity: 1, price: 18.75, image: "https://placehold.co/50x50.png", dataAiHint: "bottle lifestyle" }, // Used regular price
      { productId: "prod_5", name: "Artisan Coffee Blend", quantity: 1, price: 14.99, image: "https://placehold.co/50x50.png", dataAiHint: "coffee food" }, // Used orderPrice
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
      { productId: "prod_2", name: "Wireless Noise-Cancelling Headphones", quantity: 1, price: 199.50, image: "https://placehold.co/50x50.png", dataAiHint: "headphones tech" }, // Used regular price
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
    total: 279.99, // Updated total
    status: "Processing",
    itemsCount: 1,
    detailedItems: [
      { productId: "prod_1", name: "Ergonomic Office Chair", quantity: 1, price: 279.99, image: "https://placehold.co/50x50.png", dataAiHint: "chair office" }, // Used orderPrice
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
    total: 37.49, // Updated total
    status: "Pending",
    itemsCount: 2,
     detailedItems: [
      { productId: "prod_3", name: "Organic Cotton T-Shirt", quantity: 1, price: 22.50, image: "https://placehold.co/50x50.png", dataAiHint: "shirt fashion" }, // Used orderPrice
      { productId: "prod_5", name: "Artisan Coffee Blend", quantity: 1, price: 14.99, image: "https://placehold.co/50x50.png", dataAiHint: "coffee food" }, // Used orderPrice
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
      { productId: "prod_4", name: "Stainless Steel Water Bottle", quantity: 1, price: 18.75, image: "https://placehold.co/50x50.png", dataAiHint: "bottle lifestyle" }, // Used regular price
    ],
    shippingAddress: "Suburban Castle, Dark Town, DT 303",
    billingAddress: "Suburban Castle, Dark Town, DT 303",
  },
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
    id: "store_1",
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
  {
    id: "store_3",
    name: "Green Thumb Nursery",
    description: "Your one-stop shop for plants and gardening supplies.",
    logo: "https://placehold.co/200x100.png",
    dataAiHint: "garden plants",
    status: "Maintenance",
    category: "Home & Garden",
    socialLinks: [
        { platform: "Facebook", url: "https://facebook.com/greenthumbnursery" },
        { platform: "Instagram", url: "https://instagram.com/greenthumb"}
    ],
    location: "Austin, TX",
    createdAt: "2023-03-15",
  },
  {
    id: "store_4",
    name: "Vintage Finds Co.",
    description: "Unique vintage clothing and collectibles.",
    logo: "https://placehold.co/200x100.png",
    dataAiHint: "vintage shop",
    status: "Inactive",
    category: "Fashion & Apparel",
    // No social links
    createdAt: "2022-09-01",
  },
];

export const storeStatusColors: Record<Store["status"], string> = {
  Active: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30",
  Inactive: "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-400 border-slate-500/30",
  Maintenance: "bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-400 border-amber-500/30",
};

export const initialCustomers: Customer[] = [
  {
    id: "cust_1",
    name: "Liam Gallagher",
    email: "liam.g@example.com",
    avatar: "https://placehold.co/40x40.png",
    dataAiHintAvatar: "man portrait",
    totalSpent: 1250.75,
    totalOrders: 5,
    joinedDate: "2023-01-15",
    lastOrderDate: "2023-10-22",
    status: "Active",
    tags: ["VIP", "Music Lover"],
    phone: "+1-202-555-0101",
    address: { street: "1 Abbey Road", city: "London", zip: "NW8 9AY", country: "UK" }
  },
  {
    id: "cust_2",
    name: "Noel Gallagher",
    email: "noel.g@example.com",
    avatar: "https://placehold.co/40x40.png",
    dataAiHintAvatar: "man sunglasses",
    totalSpent: 875.50,
    totalOrders: 3,
    joinedDate: "2023-02-20",
    lastOrderDate: "2023-11-05",
    status: "Active",
    tags: ["Guitarist"],
    phone: "+1-202-555-0102",
    address: { street: "2 Maine Road", city: "Manchester", zip: "M14 7PA", country: "UK" }
  },
  {
    id: "cust_3",
    name: "Olivia Rodrigo",
    email: "olivia.r@example.com",
    avatar: "https://placehold.co/40x40.png",
    dataAiHintAvatar: "woman singer",
    totalSpent: 2300.00,
    totalOrders: 12,
    joinedDate: "2022-11-01",
    lastOrderDate: "2023-11-15",
    status: "Active",
    tags: ["Pop Star", "Gen Z"],
    phone: "+1-202-555-0103",
    address: { street: "3 Drivers License St", city: "Los Angeles", state: "CA", zip: "90001", country: "USA" }
  },
  {
    id: "cust_4",
    name: "Billie Eilish",
    email: "billie.e@example.com",
    avatar: "https://placehold.co/40x40.png",
    dataAiHintAvatar: "woman green hair",
    totalSpent: 150.25,
    totalOrders: 1,
    joinedDate: "2023-05-10",
    status: "Inactive",
    tags: ["Alternative"],
    phone: "+1-202-555-0104",
    address: { street: "4 Bad Guy Ave", city: "Los Angeles", state: "CA", zip: "90002", country: "USA" }
  },
  {
    id: "cust_5",
    name: "Axl Rose",
    email: "axl.r@example.com",
    avatar: "https://placehold.co/40x40.png",
    dataAiHintAvatar: "man bandana",
    totalSpent: 0,
    totalOrders: 0,
    joinedDate: "2023-08-01",
    status: "Blocked",
    tags: ["Rock Legend", "Difficult"],
    phone: "+1-202-555-0105",
    address: { street: "5 Paradise City", city: "Los Angeles", state: "CA", zip: "90003", country: "USA" }
  },
];


export const customerStatusColors: Record<CustomerStatus, string> = {
  Active: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30",
  Inactive: "bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-400 border-slate-500/30",
  Blocked: "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-400 border-red-500/30",
};
    
