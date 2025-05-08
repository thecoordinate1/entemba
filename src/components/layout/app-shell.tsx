
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
  useSidebar, // Imported useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NavItem } from "@/config/nav";
import { navItems } from "@/config/nav";
import { LogOut, Settings, Gem, UserCircle, ChevronsUpDown, Store as StoreIcon } from "lucide-react";
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
} from "@/components/ui/tooltip"; // Imported Tooltip components


const UserDisplay = () => (
  <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
    <Avatar className="h-10 w-10"> {/* Increased size */}
      <AvatarImage src="https://picsum.photos/40/40" alt="Vendor Avatar" data-ai-hint="person portrait" />
      <AvatarFallback>VD</AvatarFallback>
    </Avatar>
    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
      <span className="text-sm font-medium text-sidebar-foreground">Vendor Name</span>
      <span className="text-xs text-sidebar-foreground/70">vendor@example.com</span>
    </div>
  </div>
);

const StoreSelector = ({ stores, selectedStoreId, onStoreChange }: { stores: Store[], selectedStoreId: string | null, onStoreChange: (storeId: string) => void }) => {
  const { state: sidebarState } = useSidebar(); // Access sidebar state for conditional rendering

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
  

  // Read sidebar state from cookie
  const [defaultOpen, setDefaultOpen] = React.useState(true);
  React.useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sidebar_state="))
      ?.split("=")[1];
    if (cookieValue) {
      setDefaultOpen(cookieValue === "true");
    }
    // Load stores (simulating API call)
    setAvailableStores(initialStores);
    const currentStoreId = searchParams.get("storeId");
    if (currentStoreId && initialStores.some(s => s.id === currentStoreId)) {
        setSelectedStoreId(currentStoreId);
    } else if (initialStores.length > 0) {
        setSelectedStoreId(initialStores[0].id);
         // Update URL if no storeId or invalid storeId is present
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set("storeId", initialStores[0].id);
        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }


  }, [searchParams, pathname, router]);

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("storeId", storeId);
    // Navigate to dashboard of the selected store, or current page if not dashboard
    const targetPath = pathname.startsWith("/dashboard") ? "/dashboard" : pathname;
    router.push(`${targetPath}?${newParams.toString()}`);
  };
  
  const getHrefWithStoreId = (href: string) => {
    if (!selectedStoreId) return href;
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("storeId", selectedStoreId);
    return `${href}?${newParams.toString()}`;
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
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Gem className="h-8 w-8 text-accent" /> {/* Increased size */}
            <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden"> {/* Increased size */}
              E-Ntemba
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-3 space-y-1"> {/* Increased padding and spacing */}
          <StoreSelector stores={availableStores} selectedStoreId={selectedStoreId} onStoreChange={handleStoreChange} />
          <ScrollArea className="h-full">
            <SidebarMenu className="space-y-1"> {/* Added spacing between menu items */}
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    size="lg" // Make buttons larger
                    isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')}
                    tooltip={{children: item.title, className:"bg-sidebar-accent text-sidebar-accent-foreground"}}
                    className="h-12 text-base" // Custom height and text size
                  >
                    <Link href={getHrefWithStoreId(item.href)}>
                      <item.icon className="h-5 w-5" /> {/* Ensure icons are appropriately sized */}
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
          <Button variant="ghost" className="w-full justify-start h-11 text-base group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:h-11"> {/* Increased size */}
            <Settings className="mr-2 group-data-[collapsible=icon]:mr-0 h-5 w-5" /> <span className="group-data-[collapsible=icon]:hidden">Settings</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start h-11 text-base group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:h-11"> {/* Increased size */}
            <LogOut className="mr-2 group-data-[collapsible=icon]:mr-0 h-5 w-5" /> <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-20 sm:px-6"> {/* Increased height */}
          <SidebarTrigger className="md:hidden" />
           <h1 className="text-xl font-semibold sm:text-2xl"> {/* Increased size */}
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

