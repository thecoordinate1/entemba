import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Package, ShoppingCart, Store } from "lucide-react"; // Removed Settings icon

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
    title: "Stores",
    href: "/stores",
    icon: Store,
  },
  // { // Removed Settings from here
  //   title: "Settings",
  //   href: "/settings",
  //   icon: Settings,
  // },
];
