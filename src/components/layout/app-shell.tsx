
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import type { User as AuthUser } from '@supabase/supabase-js';

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
import { LogOut, Settings, Gem, Store as StoreIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOut } from "@/services/authService";
import { getCurrentVendorProfile } from "@/services/userService";
import { getStoresByUserId, type StoreFromSupabase } from "@/services/storeService"; 
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";


interface UserDisplayProps {
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  isLoading: boolean;
}

const UserDisplay: React.FC<UserDisplayProps> = ({ displayName, email, avatarUrl, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  const fallbackName = displayName?.substring(0, 2).toUpperCase() || "VD";

  return (
    <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl || undefined} alt={displayName || "Vendor Avatar"} data-ai-hint="person portrait" />
        <AvatarFallback>{fallbackName}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[150px]">{displayName || "Vendor"}</span>
        <span className="text-xs text-sidebar-foreground/70 truncate max-w-[150px]">{email || "vendor@example.com"}</span>
      </div>
    </div>
  );
};

const StoreSelector = ({ stores, selectedStoreId, onStoreChange, isLoading }: { stores: StoreFromSupabase[], selectedStoreId: string | null, onStoreChange: (storeId: string) => void, isLoading: boolean }) => {
  const { state: sidebarState } = useSidebar();

  if (sidebarState === "collapsed") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground my-2" disabled={isLoading || stores.length === 0}>
              {isLoading ? <Skeleton className="h-5 w-5 rounded-full" /> : <StoreIcon className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-sidebar-accent text-sidebar-accent-foreground">
             {isLoading ? "Loading..." : stores.find(s => s.id === selectedStoreId)?.name || (stores.length > 0 ? "Select Store" : "No Stores")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isLoading) {
    return (
        <div className="w-full my-2 h-11 group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-full w-full" />
        </div>
    );
  }
  
  if (stores.length === 0 && !isLoading) {
     return (
        <Link href="/stores" className="w-full my-2 group-data-[collapsible=icon]:hidden">
            <Button variant="outline" className="w-full h-11 text-sm border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <StoreIcon className="h-5 w-5 mr-2 text-sidebar-primary" />
                Create a Store
            </Button>
        </Link>
     )
  }


  return (
    <Select value={selectedStoreId || ""} onValueChange={onStoreChange} disabled={isLoading || stores.length === 0}>
      <SelectTrigger className="w-full my-2 h-11 text-sm bg-sidebar-background border-sidebar-border text-sidebar-foreground focus:ring-sidebar-ring group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2 truncate">
          <StoreIcon className="h-5 w-5 text-sidebar-primary" />
          <SelectValue placeholder={stores.length === 0 ? "No stores available" : "Select a store"} />
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
  const { toast } = useToast();
  
  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null);
  const [availableStores, setAvailableStores] = React.useState<StoreFromSupabase[]>([]);
  const [isLoadingStores, setIsLoadingStores] = React.useState(true);

  const [defaultOpen, setDefaultOpen] = React.useState(true);
  const [hasMounted, setHasMounted] = React.useState(false);
  
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [vendorDisplayName, setVendorDisplayName] = React.useState<string | null>(null);
  const [vendorEmail, setVendorEmail] = React.useState<string | null>(null);
  const [vendorAvatarUrl, setVendorAvatarUrl] = React.useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [pageTitle, setPageTitle] = React.useState("Loading...");

  const supabase = createClient();

  React.useEffect(() => {
    setHasMounted(true);
    const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("sidebar_state="))?.split("=")[1];
    if (cookieValue) setDefaultOpen(cookieValue === "true");
    
    const fetchInitialUserData = async (user: AuthUser) => {
      setIsLoadingProfile(true);
      setIsLoadingStores(true);
      
      const profilePromise = getCurrentVendorProfile(user.id);
      const storesPromise = getStoresByUserId(user.id);

      const [profileResult, storesResult] = await Promise.allSettled([profilePromise, storesPromise]);

      if (profileResult.status === 'fulfilled') {
        const { profile, error: profileError } = profileResult.value;
        if (profile) {
          setVendorDisplayName(profile.display_name); setVendorEmail(profile.email); setVendorAvatarUrl(profile.avatar_url);
        } else {
          setVendorDisplayName(user.user_metadata?.display_name || user.email);
          setVendorEmail(user.email); setVendorAvatarUrl(user.user_metadata?.avatar_url);
          if (profileError) console.warn("Error fetching vendor profile:", (profileError as Error).message);
        }
      } else {
        console.error("Failed to fetch vendor profile:", profileResult.reason);
        setVendorDisplayName(user.user_metadata?.display_name || user.email);
        setVendorEmail(user.email); setVendorAvatarUrl(user.user_metadata?.avatar_url);
      }
      setIsLoadingProfile(false);

      if (storesResult.status === 'fulfilled') {
        const { data: storesData, error: storesError } = storesResult.value;
        if (storesError) {
          toast({ variant: "destructive", title: "Error fetching stores", description: storesError.message });
          setAvailableStores([]);
        } else {
          setAvailableStores(storesData || []);
        }
      } else {
        console.error("Failed to fetch stores:", storesResult.reason);
        toast({ variant: "destructive", title: "Error fetching stores", description: (storesResult.reason as Error).message });
        setAvailableStores([]);
      }
      setIsLoadingStores(false);
    };
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setAuthUser(currentUser);
      if (currentUser) {
        await fetchInitialUserData(currentUser);
      } else {
        setVendorDisplayName(null); setVendorEmail(null); setVendorAvatarUrl(null);
        setAvailableStores([]); setIsLoadingProfile(false); setIsLoadingStores(false); setSelectedStoreId(null);
      }
    });

    // Initial check for user
    supabase.auth.getUser().then(async ({ data: { user: initialUser } }) => {
      if (initialUser) {
        if (!authUser) setAuthUser(initialUser); // Set authUser if not already set by listener
        await fetchInitialUserData(initialUser);
      } else {
        setIsLoadingProfile(false); setIsLoadingStores(false);
      }
    });
    return () => { authListener?.subscription.unsubscribe(); };
  }, [supabase, toast, authUser]); // Added authUser to re-run if it changes externally.


  React.useEffect(() => {
    if (isLoadingStores || !hasMounted) return;
    const currentStoreIdFromUrl = searchParams.get("storeId");

    if (availableStores.length > 0) {
      if (currentStoreIdFromUrl && availableStores.some(s => s.id === currentStoreIdFromUrl)) {
        if (selectedStoreId !== currentStoreIdFromUrl) setSelectedStoreId(currentStoreIdFromUrl);
      } else {
        const firstStoreId = availableStores[0].id;
        // Only update if selectedStoreId is not already set or different
        if (selectedStoreId !== firstStoreId && !currentStoreIdFromUrl) {
            setSelectedStoreId(firstStoreId);
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.set("storeId", firstStoreId);
            router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
        } else if (!selectedStoreId && !currentStoreIdFromUrl) { // If no store selected and none in URL, pick first
            setSelectedStoreId(firstStoreId);
             const newParams = new URLSearchParams(searchParams.toString());
            newParams.set("storeId", firstStoreId);
            router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
        } else if (!selectedStoreId && currentStoreIdFromUrl && availableStores.some(s => s.id === currentStoreIdFromUrl)) {
             setSelectedStoreId(currentStoreIdFromUrl); // Sync state if URL has valid one but state is null
        }
      }
    } else if (availableStores.length === 0 && !isLoadingStores) { 
      if (selectedStoreId !== null) {
        setSelectedStoreId(null);
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("storeId");
        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
      }
    }
  }, [availableStores, searchParams, pathname, router, isLoadingStores, hasMounted, selectedStoreId]);

  React.useEffect(() => {
    const currentNavItem = navItems.find((item) => {
      const baseHref = item.href.split("?")[0];
      const currentPathBase = pathname.split("?")[0];
      return currentPathBase.startsWith(baseHref) && (baseHref !== '/' || currentPathBase === '/');
    });
    const baseTitle = currentNavItem?.title || "E-Ntemba";
    const store = availableStores.find(s => s.id === selectedStoreId);
    const newPageTitle = store ? `${store.name} - ${baseTitle}` : baseTitle;
    setPageTitle(newPageTitle);
    document.title = `${newPageTitle} | E-Ntemba`;
  }, [pathname, selectedStoreId, availableStores]);


  if (!hasMounted) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  const handleStoreChange = (storeId: string) => {
    if (storeId === "no-stores") return;
    setSelectedStoreId(storeId);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("storeId", storeId);
    router.push(`${pathname}?${newParams.toString()}`); 
  };
  
  const getHrefWithStoreId = (href: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    if (selectedStoreId) {
      currentParams.set("storeId", selectedStoreId);
    } else {
      currentParams.delete("storeId"); 
    }
    const queryString = currentParams.toString();
    return queryString ? `${href}?${queryString}` : href;
  }
  
  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    } else {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      setAuthUser(null); 
      router.push("/login");
    }
  };


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
          <StoreSelector stores={availableStores} selectedStoreId={selectedStoreId} onStoreChange={handleStoreChange} isLoading={isLoadingStores} />
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
                    disabled={(item.href !== "/stores" && item.href !== "/settings") && availableStores.length === 0 && !isLoadingStores} 
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
          <UserDisplay 
            displayName={vendorDisplayName} 
            email={vendorEmail}
            avatarUrl={vendorAvatarUrl}
            isLoading={isLoadingProfile}
          />
          <Button variant="ghost" asChild className="w-full justify-start h-11 text-base group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:h-11">
            <Link href={getHrefWithStoreId("/settings")}>
              <Settings className="mr-2 group-data-[collapsible=icon]:mr-0 h-5 w-5" /> <span className="group-data-[collapsible=icon]:hidden">Settings</span>
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start h-11 text-base group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:h-11"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 group-data-[collapsible=icon]:mr-0 h-5 w-5" /> <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-20 sm:px-6">
          <SidebarTrigger className="md:hidden" />
           <h1 className="text-xl font-semibold sm:text-2xl truncate">
            {(isLoadingStores || isLoadingProfile) && !pageTitle.includes("E-Ntemba") ? "Loading..." : pageTitle}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

