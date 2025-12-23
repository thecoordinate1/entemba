import type { LucideIcon } from "lucide-react";
import { PackageCheck, Truck, CheckCircle, XCircle, RefreshCw, PersonStanding } from "lucide-react";
import type { Product, Order, Store, Customer, OrderStatus, CustomerStatus, StoreStatus, SocialLink } from "./types";

export const initialProducts: Product[] = [
  // Mock product data removed to simulate backend-driven data
];


export const initialOrders: Order[] = [
  // Mock order data removed to simulate backend-driven data
];

export const initialStores: Store[] = [
  {
    id: "store_1", // This ID is used as a fallback if no store is in URL params
    name: "The Artisan Boutique",
    description: "Curated handcrafted goods from around the world.",
    logo: "https://placehold.co/200x100.png",
    status: "Active",
    categories: ["Handmade & Craft"],
    socialLinks: [
      { platform: "Instagram", url: "https://instagram.com/artisanboutique" },
      { platform: "Facebook", url: "https://facebook.com/artisanboutique" },
    ],
    location: "New York, NY",
    contactPhone: "+1-212-555-0123",
    pickupLatitude: 40.7128,
    pickupLongitude: -74.0060,
    createdAt: "2022-11-10",
    isVerified: true,
    averageRating: 4.8,
    reviewCount: 124,
  },
  {
    id: "store_2",
    name: "Tech Gadget Hub",
    description: "Latest and greatest in tech and electronics.",
    logo: "https://placehold.co/200x100.png",
    status: "Active",
    categories: ["Electronics"],
    socialLinks: [
      { platform: "Twitter", url: "https://twitter.com/techgadgethub" },
    ],
    location: "San Francisco, CA",
    contactPhone: "+1-415-555-0199",
    pickupLatitude: 37.7749,
    pickupLongitude: -122.4194,
    createdAt: "2023-01-25",
    isVerified: false,
    averageRating: 4.2,
    reviewCount: 45,
  },
  // Other mock stores can remain if needed for initial UI testing without a backend connection,
  // but the AppShell already fetches actual stores.
];


export const initialCustomers: Customer[] = [
  // Mock customer data removed to simulate backend-driven data
];
    
