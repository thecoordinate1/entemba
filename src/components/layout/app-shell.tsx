"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import type { User as AuthUser } from '@supabase/supabase-js';
import { cva } from "class-variance-authority";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NavItem } from "@/config/nav";
import { navItems } from "@/config/nav";
import { LogOut, Settings, Gem, Store as StoreIcon, PanelLeft, Menu } from "lucide-react";
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
import { cn } from "@/lib/utils";

const UserDisplay: React.FC<{
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  isLoading: boolean;
  isCollapsed: boolean;
}> = ({ displayName, email, avatarUrl, isLoading, isCollapsed }) => {
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className={cn("flex flex-col gap-1", isCollapsed && "hidden")}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  const fallbackName = displayName?.substring(0, 2).toUpperCase() || "VD";

  return (
    <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl || undefined} alt={displayName || "Vendor Avatar"} data-ai-hint="person portrait" />
        <AvatarFallback>{fallbackName}</AvatarFallback>
      </Avatar>
      <div className={cn("flex flex-col", isCollapsed && "hidden")}>
        <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[150px]">{displayName || "Vendor"}</span>
        <span className="text-xs text-sidebar-foreground/70 truncate max-w-[150px]">{email || "vendor@example.com"}</span>
      </div>
    </div>
  );
};

const StoreSelector = ({
  stores,
  selectedStoreId,
  onStoreChange,
  isLoading,
  isCollapsed,
}: {
  stores: StoreFromSupabase[];
  selectedStoreId: string | null;
  onStoreChange: (storeId: string) => void;
  isLoading: boolean;
  isCollapsed: boolean;
}) => {
  if (isCollapsed) {
    const selectedStoreName = stores.find(s => s.id === selectedStoreId)?.name;
    const tooltipText = isLoading ? "Loading..." : (selectedStoreName || (stores.length > 0 ? "Select Store" : "No Stores"));
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground my-2" disabled={isLoading || stores.length === 0}>
              {isLoading && stores.length === 0 ? <Skeleton className="h-5 w-5 rounded-full" /> : <StoreIcon className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isLoading) return <Skeleton className="w-full my-2 h-11" />;

  if (stores.length === 0) {
    return (
      <Link href="/stores" className="w-full my-2">
        <Button variant="outline" className="w-full h-11 text-sm border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <StoreIcon className="h-5 w-5 mr-2 text-sidebar-primary" /> Create a Store
        </Button>
      </Link>
    );
  }

  return (
    <Select value={selectedStoreId || ""} onValueChange={onStoreChange} disabled={stores.length === 0}>
      <SelectTrigger className="w-full my-2 h-11 text-sm bg-sidebar-background border-sidebar-border text-sidebar-foreground focus:ring-sidebar-ring">
        <div className="flex items-center gap-2 truncate">
          <StoreIcon className="h-5 w-5 text-sidebar-primary" />
          <SelectValue placeholder="Select a store" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const navItemVariants = cva(
  "flex items-center justify-start gap-2 rounded-md p-3 text-base font-medium transition-colors",
  {
    variants: {
      isActive: {
        true: "bg-sidebar-accent text-sidebar-accent-foreground",
        false: "text-sidebar-foreground hover:bg-sidebar-accent/50",
      },
      isCollapsed: {
        true: "justify-center",
        false: "justify-start",
      },
      isDisabled: {
        true: "cursor-not-allowed opacity-50",
      }
    },
    defaultVariants: {
      isActive: false,
      isCollapsed: false,
      isDisabled: false,
    },
  }
);


function AppShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null);
  const [availableStores, setAvailableStores] = React.useState<StoreFromSupabase[]>([]);
  const [isLoadingStores, setIsLoadingStores] = React.useState(true);
  
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [vendorDisplayName, setVendorDisplayName] = React.useState<string | null>(null);
  const [vendorEmail, setVendorEmail] = React.useState<string | null>(null);
  const [vendorAvatarUrl, setVendorAvatarUrl] = React.useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [pageTitle, setPageTitle] = React.useState("Loading...");

  const supabase = createClient();
  
  const fetchInitialUserData = React.useCallback(async (user: AuthUser) => {
    setIsLoadingProfile(true);
    setIsLoadingStores(true);

    const profilePromise = getCurrentVendorProfile(user.id);
    const storesPromise = getStoresByUserId(user.id);

    const [profileResult, storesResult] = await Promise.allSettled([profilePromise, storesPromise]);

    if (profileResult.status === 'fulfilled') {
      const { profile, error } = profileResult.value;
      if (profile) {
        setVendorDisplayName(profile.display_name); setVendorEmail(profile.email); setVendorAvatarUrl(profile.avatar_url);
      } else {
        setVendorDisplayName(user.user_metadata?.display_name || user.email);
        setVendorEmail(user.email); setVendorAvatarUrl(user.user_metadata?.avatar_url);
        if (error) console.warn("Error fetching vendor profile:", (error as Error).message);
      }
    } else {
      console.error("Failed to fetch profile:", profileResult.reason);
    }
    setIsLoadingProfile(false);

    if (storesResult.status === 'fulfilled') {
      const { data, error } = storesResult.value;
      if (error) toast({ variant: "destructive", title: "Error fetching stores", description: error.message });
      setAvailableStores(data || []);
    } else {
      console.error("Failed to fetch stores:", storesResult.reason);
    }
    setIsLoadingStores(false);
  }, [toast]);
  
  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthUser(session?.user ?? null);
      if (event === "SIGNED_IN" && session?.user) {
        fetchInitialUserData(session.user);
      } else if (event === "SIGNED_OUT") {
        setVendorDisplayName(null); setVendorEmail(null); setVendorAvatarUrl(null);
        setAvailableStores([]); setSelectedStoreId(null);
        setIsLoadingProfile(false); setIsLoadingStores(false);
      }
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user);
      if (user) {
        fetchInitialUserData(user);
      } else {
        setIsLoadingProfile(false); setIsLoadingStores(false);
      }
    });
    
    return () => authListener.subscription.unsubscribe();
  }, [supabase, fetchInitialUserData]);
  
  React.useEffect(() => {
    const storeIdFromUrl = searchParams.get("storeId");
    if (storeIdFromUrl) {
      setSelectedStoreId(storeIdFromUrl);
    } else if (availableStores.length > 0) {
      const firstStoreId = availableStores[0].id;
      setSelectedStoreId(firstStoreId);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("storeId", firstStoreId);
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
  }, [searchParams, availableStores, pathname, router]);

  React.useEffect(() => {
    const currentNavItem = navItems.find(item => pathname.startsWith(item.href));
    const baseTitle = currentNavItem?.title || "E-Ntemba";
    const store = availableStores.find(s => s.id === selectedStoreId);
    setPageTitle(store ? `${store.name} - ${baseTitle}` : baseTitle);
    document.title = `${pageTitle} | E-Ntemba`;
  }, [pathname, selectedStoreId, availableStores, pageTitle]);

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("storeId", storeId);
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logged Out" });
    router.push("/login");
  };

  const getHrefWithStoreId = (href: string) => {
    const params = new URLSearchParams();
    if (selectedStoreId) params.set("storeId", selectedStoreId);
    const queryString = params.toString();
    return queryString ? `${href}?${queryString}` : href;
  };

  const isLoadingOverall = isLoadingProfile || isLoadingStores;

  const sidebarContent = (
    <TooltipProvider>
      <div className="flex h-full flex-col p-2 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center justify-between p-2">
          {!isSidebarCollapsed && (
            <Link href={getHrefWithStoreId("/dashboard")} className="flex items-center gap-2">
              <Gem className="h-8 w-8 text-accent" />
              <span className="text-xl font-semibold">E-Ntemba</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <PanelLeft />
          </Button>
        </div>
        
        <Separator className="my-2 bg-sidebar-border" />
        
        {authUser && (
          <StoreSelector stores={availableStores} selectedStoreId={selectedStoreId} onStoreChange={handleStoreChange} isLoading={isLoadingStores} isCollapsed={isSidebarCollapsed} />
        )}
        
        <ScrollArea className="flex-1">
          <nav className="grid gap-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const isDisabled = !selectedStoreId && item.href !== '/stores' && item.href !== '/settings';
              const navLink = (
                <Link
                  href={getHrefWithStoreId(item.href)}
                  className={cn(navItemVariants({ isActive, isCollapsed: isSidebarCollapsed, isDisabled }))}
                  aria-disabled={isDisabled}
                  onClick={(e) => {
                    if (isDisabled) e.preventDefault();
                    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={cn(isSidebarCollapsed && "hidden")}>{item.title}</span>
                </Link>
              );

              return isSidebarCollapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.href}>{navLink}</div>
              );
            })}
          </nav>
        </ScrollArea>
        
        <div className="mt-auto p-2 space-y-2">
          {authUser && (
            <>
              <UserDisplay displayName={vendorDisplayName} email={vendorEmail} avatarUrl={vendorAvatarUrl} isLoading={isLoadingProfile} isCollapsed={isSidebarCollapsed} />
              <Link href={getHrefWithStoreId('/settings')} className={cn(navItemVariants({ isCollapsed: isSidebarCollapsed, isActive: pathname.startsWith('/settings')}))}>
                <Settings className="h-5 w-5" /><span className={cn(isSidebarCollapsed && "hidden")}>Settings</span>
              </Link>
              <Button variant="ghost" className={cn("w-full", navItemVariants({ isCollapsed: isSidebarCollapsed }))} onClick={handleLogout}>
                <LogOut className="h-5 w-5" /><span className={cn(isSidebarCollapsed && "hidden")}>Logout</span>
              </Button>
            </>
          )}
          {!authUser && !isLoadingProfile && (
            <Link href="/login" className={cn(navItemVariants({ isCollapsed: isSidebarCollapsed }))}>
              <LogOut className="h-5 w-5" /><span className={cn(isSidebarCollapsed && "hidden")}>Login</span>
            </Link>
          )}
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <div className="flex min-h-screen w-full">
      <aside className={cn("hidden md:block bg-sidebar transition-all duration-300", isSidebarCollapsed ? "w-20" : "w-64")}>
        {sidebarContent}
      </aside>
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-20 sm:px-6">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground border-r-sidebar-border">
              {React.cloneElement(sidebarContent, { isCollapsed: false })}
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-semibold sm:text-2xl truncate">
            {isLoadingOverall ? "Loading..." : pageTitle}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}


export function AppShell({ children }: { children: React.ReactNode }) {
    const [hasMounted, setHasMounted] = React.useState(false);
    
    React.useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Gem className="h-10 w-10 text-primary animate-pulse" />
            </div>
        );
    }

    return <AppShellLayout>{children}</AppShellLayout>;
}
