import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Package, ShoppingCart, Store, Users, Truck, Globe, Factory, Tag, LifeBuoy, MessageSquare, Bell } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  external?: boolean;
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Delivery",
    href: "/delivery",
    icon: Truck,
  },
  {
    title: "Stores",
    href: "/stores",
    icon: Store,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Marketing",
    href: "/marketing",
    icon: Tag,
  },
  {
    title: "Marketplace",
    href: "/market",
    icon: Globe,
  },
  {
    title: "Supplier",
    href: "/supplier",
    icon: Factory,
  },
  {
    title: "Reviews",
    href: "/reviews",
    icon: MessageSquare,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Support",
    href: "/support",
    icon: LifeBuoy,
  },
];
