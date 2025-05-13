
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NavItem } from "@/config/nav";
import { navItems } from "@/config/nav";
import { LogOut, Settings, Gem, Store as StoreIcon } from "lucide-react"; // Removed UserCircle, ChevronsUpDown
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initialStores, type Store } from "@/lib/mockData";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const UserDisplay = () => (
  <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
    <Avatar className="h-10 w-10">
      <AvatarImage src="https://picsum.photos/seed/user-avatar/40/40" alt="Vendor Avatar" data-ai-hint="person portrait" />
      <AvatarFallback>VD</AvatarFallback>
    </Avatar>
    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
      <span className="text-sm font-medium text-sidebar-foreground">Vendor Name</span>
      <span className="text-xs text-sidebar-foreground/70">vendor@example.com</span>
    </div>
  </div>
);

const StoreSelector = ({ stores, selectedStoreId, onStoreChange }: { stores: Store[], selectedStoreId: string | null, onStoreChange: (storeId: string) => void }) => {
  const { state: sidebarState } = useSidebar();

  if (sidebarState === "collapsed") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground my-2">
              <StoreIcon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-sidebar-accent text-sidebar-accent-foreground">
             {stores.find(s => s.id === selectedStoreId)?.name || "Select Store"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Select value={selectedStoreId || ""} onValueChange={onStoreChange}>
      <SelectTrigger className="w-full my-2 h-11 text-sm bg-sidebar-background border-sidebar-border text-sidebar-foreground focus:ring-sidebar-ring group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2 truncate">
          <StoreIcon className="h-5 w-5 text-sidebar-primary" />
          <SelectValue placeholder="Select a store" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-popover text-popover-foreground border-border">
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id} className="hover:bg-accent focus:bg-accent">
            {store.name}
          </SelectItem>
        ))}
         {stores.length === 0 && <SelectItem value="" disabled>No stores available</SelectItem>}
      </SelectContent>
    </Select>
  );
};


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null);
  const [availableStores, setAvailableStores] = React.useState<Store[]>([]);
  

  const [defaultOpen, setDefaultOpen] = React.useState(true);
  React.useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sidebar_state="))
      ?.split("=")[1];
    if (cookieValue) {
      setDefaultOpen(cookieValue === "true");
    }
    
    setAvailableStores(initialStores);
    const currentStoreIdFromUrl = searchParams.get("storeId");

    if (currentStoreIdFromUrl && initialStores.some(s => s.id === currentStoreIdFromUrl)) {
        setSelectedStoreId(currentStoreIdFromUrl);
    } else if (initialStores.length > 0) {
        const firstStoreId = initialStores[0].id;
        setSelectedStoreId(firstStoreId);
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set("storeId", firstStoreId);
        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    } else {
      // No stores available, ensure storeId is not in URL or set to empty
      setSelectedStoreId(null);
      const newParams = new URLSearchParams(searchParams.toString());
      if (newParams.has("storeId")) {
        newParams.delete("storeId");
        router.replace(newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname, { scroll: false });
      }
    }
  }, [searchParams, pathname, router]);

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("storeId", storeId);
    const targetPath = pathname.startsWith("/dashboard") ? "/dashboard" : pathname; // Keep current page or go to dashboard
    router.push(`${targetPath}?${newParams.toString()}`);
  };
  
  const getHrefWithStoreId = (href: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    if (selectedStoreId) {
      currentParams.set("storeId", selectedStoreId);
    } else {
      currentParams.delete("storeId"); // Remove if no store is selected
    }
    const queryString = currentParams.toString();
    return queryString ? `${href}?${queryString}` : href;
  }

  const pageTitle = navItems.find((item) => {
    const baseHref = item.href.split("?")[0];
    const currentPathBase = pathname.split("?")[0];
    return currentPathBase === baseHref || (currentPathBase.startsWith(baseHref) && baseHref !== '/');
  })?.title || "Page Title";
  
  const storeName = availableStores.find(s => s.id === selectedStoreId)?.name;
  const displayTitle = storeName ? `${storeName} - ${pageTitle}` : pageTitle;


  return (
    <SidebarProvider defaultOpen={defaultOpen} collapsible="icon">
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href={getHrefWithStoreId("/dashboard")} className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Gem className="h-8 w-8 text-accent" />
            <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">
              E-Ntemba
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-3 space-y-1">
          <StoreSelector stores={availableStores} selectedStoreId={selectedStoreId} onStoreChange={handleStoreChange} />
          <ScrollArea className="h-full">
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={pathname === item.href.split("?")[0] || (pathname.startsWith(item.href.split("?")[0]) && item.href !== '/')}
                    tooltip={{children: item.title, className:"bg-sidebar-accent text-sidebar-accent-foreground"}}
                    className="h-12 text-base"
                  >
                    <Link href={getHrefWithStoreId(item.href)}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        
        <SidebarFooter className="p-4 space-y-2">
          <UserDisplay />
          <Button variant="ghost" asChild className="w-full justify-start h-11 text-base group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:h-11">
            <Link href={getHrefWithStoreId("/settings")}>
              <Settings className="mr-2 group-data-[collapsible=icon]:mr-0 h-5 w-5" /> <span className="group-data-[collapsible=icon]:hidden">Settings</span>
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start h-11 text-base group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:h-11">
            <LogOut className="mr-2 group-data-[collapsible=icon]:mr-0 h-5 w-5" /> <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-20 sm:px-6">
          <SidebarTrigger className="md:hidden" />
           <h1 className="text-xl font-semibold sm:text-2xl">
            {displayTitle}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

