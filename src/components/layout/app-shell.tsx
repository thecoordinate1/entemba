
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
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

const StoreSelector = ({ stores, selectedStoreId, onStoreChange, isLoadingOverall }: { stores: StoreFromSupabase[], selectedStoreId: string | null, onStoreChange: (storeId: string) => void, isLoadingOverall: boolean }) => {
  const { state: sidebarState } = useSidebar();

  if (sidebarState === "collapsed") {
    const selectedStoreName = stores.find(s => s.id === selectedStoreId)?.name;
    const tooltipText = isLoadingOverall ? "Loading..." : (selectedStoreName || (stores.length > 0 ? "Select Store" : "No Stores"));
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground my-2" disabled={isLoadingOverall || stores.length === 0}>
              {isLoadingOverall && stores.length === 0 ? <Skeleton className="h-5 w-5 rounded-full" /> : <StoreIcon className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-sidebar-accent text-sidebar-accent-foreground">
             {tooltipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded sidebar:
  if (isLoadingOverall) {
    return <Skeleton className="w-full my-2 h-11" />;
  }

  if (stores.length === 0) {
     return (
        <Link href="/stores" className="w-full my-2">
            <Button variant="outline" className="w-full h-11 text-sm border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <StoreIcon className="h-5 w-5 mr-2 text-sidebar-primary" />
                Create a Store
            </Button>
        </Link>
     );
  }

  return (
    <Select
      value={selectedStoreId || ""} // Ensure value is a string
      onValueChange={onStoreChange}
      disabled={stores.length === 0}
    >
      <SelectTrigger className="w-full my-2 h-11 text-sm bg-sidebar-background border-sidebar-border text-sidebar-foreground focus:ring-sidebar-ring">
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


const MobileSheetSidebar = ({
  children,
  openMobile,
  setOpenMobile,
}: {
  children: React.ReactNode;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
}) => {
  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent
        data-sidebar="sidebar"
        data-mobile="true"
        className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
        side="left"
      >
        <div className="flex h-full w-full flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  );
};

const SidebarContentContainer = ({
  getHrefWithStoreId,
  pathname,
  authUser,
  availableStores,
  selectedStoreId,
  handleStoreChange,
  isLoadingProfile,
  isLoadingStores,
  areStoresFetched,
  vendorDisplayName,
  vendorEmail,
  vendorAvatarUrl,
  handleLogout,
  disableNavCondition
}: any) => {
  const overallAppLoading = isLoadingProfile || (isLoadingStores && !areStoresFetched);

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href={getHrefWithStoreId("/dashboard")} className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Gem className="h-8 w-8 text-accent" />
          <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">
            E-Ntemba
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-3 space-y-1">
        {authUser && (
          <TooltipProvider>
            <StoreSelector
              stores={availableStores}
              selectedStoreId={selectedStoreId}
              onStoreChange={handleStoreChange}
              isLoadingOverall={overallAppLoading}
            />
          </TooltipProvider>
        )}
        <ScrollArea className="h-full">
          <SidebarMenu className="space-y-1">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  isActive={pathname.startsWith(item.href.split("?")[0]) && ((item.href === '/' && pathname === '/') || item.href !== '/')}
                  tooltip={{children: item.title, className:"bg-sidebar-accent text-sidebar-accent-foreground"}}
                  className="h-12 text-base"
                  disabled={disableNavCondition(item.href)}
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
        {authUser && (
          <>
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
          </>
        )}
        {!authUser && !isLoadingProfile && (
           <Button variant="outline" asChild className="w-full justify-start h-11 text-base group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:h-11">
              <Link href="/login">
                  <LogOut className="mr-2 group-data-[collapsible=icon]:mr-0 h-5 w-5" /> <span className="group-data-[collapsible=icon]:hidden">Login</span>
              </Link>
          </Button>
        )}
      </SidebarFooter>
    </>
  );
};


function AppShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const { toast } = useToast();

  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null);
  const [availableStores, setAvailableStores] = React.useState<StoreFromSupabase[]>([]);
  const [isLoadingStores, setIsLoadingStores] = React.useState(true);
  const [areStoresFetched, setAreStoresFetched] = React.useState(false);

  const [hasMounted, setHasMounted] = React.useState(false);

  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [vendorDisplayName, setVendorDisplayName] = React.useState<string | null>(null);
  const [vendorEmail, setVendorEmail] = React.useState<string | null>(null);
  const [vendorAvatarUrl, setVendorAvatarUrl] = React.useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [pageTitle, setPageTitle] = React.useState("Loading...");

  const supabase = createClient();
  const { openMobile, setOpenMobile } = useSidebar();


  const fetchInitialUserData = React.useCallback(async (user: AuthUser) => {
    setIsLoadingProfile(true);
    setIsLoadingStores(true);
    setAreStoresFetched(false);

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
    setAreStoresFetched(true);
  }, [toast]);

  React.useEffect(() => {
    setHasMounted(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setAuthUser(currentUser);
      if (!currentUser) {
          setVendorDisplayName(null); setVendorEmail(null); setVendorAvatarUrl(null);
          setAvailableStores([]); setSelectedStoreId(null);
          setIsLoadingProfile(false); setIsLoadingStores(false); setAreStoresFetched(true);
      }
    });

    supabase.auth.getUser().then(async ({ data: { user: initialUser } }) => {
      setAuthUser(initialUser);
      if (!initialUser) {
        setIsLoadingProfile(false);
        setIsLoadingStores(false);
        setAreStoresFetched(true);
      }
    });
    return () => { authListener?.subscription.unsubscribe(); };
  }, [supabase]);

  React.useEffect(() => {
    if (authUser) {
      fetchInitialUserData(authUser);
    } else {
      setVendorDisplayName(null); setVendorEmail(null); setVendorAvatarUrl(null);
      setAvailableStores([]); setSelectedStoreId(null);
      setIsLoadingProfile(false); setIsLoadingStores(false); setAreStoresFetched(true);
    }
  }, [authUser, fetchInitialUserData]);

  // Effect to set selectedStoreId state based on URL changes
  React.useEffect(() => {
    if (!areStoresFetched) return; // Wait until stores are fetched

    const storeIdFromUrl = searchParamsHook.get("storeId");

    if (storeIdFromUrl && availableStores.some(s => s.id === storeIdFromUrl)) {
      if (selectedStoreId !== storeIdFromUrl) {
        setSelectedStoreId(storeIdFromUrl);
      }
    } else if (availableStores.length > 0) {
      if (!selectedStoreId || !availableStores.some(s => s.id === selectedStoreId)) {
      }
    } else {
      if (selectedStoreId !== null) {
        setSelectedStoreId(null);
      }
    }
  }, [searchParamsHook, availableStores, areStoresFetched, selectedStoreId]);


  // Effect to manage storeId in URL (defaulting, clearing)
  React.useEffect(() => {
    if (!areStoresFetched || !hasMounted || !authUser) return;

    const currentStoreIdFromUrl = searchParamsHook.get("storeId");
    const currentPathIsPublic = ["/", "/about", "/login", "/signup", "/forgot-password", "/update-password"].includes(pathname) || pathname.startsWith('/auth/callback');
    const isOnStoresPage = pathname.startsWith('/stores');
    const isOnSettingsPage = pathname.startsWith('/settings');

    if (availableStores.length > 0) {
      const firstStoreId = availableStores[0].id;
      const isValidStoreInUrl = currentStoreIdFromUrl && availableStores.some(s => s.id === currentStoreIdFromUrl);

      if (isValidStoreInUrl) {
        if (selectedStoreId !== currentStoreIdFromUrl) setSelectedStoreId(currentStoreIdFromUrl);
      } else if (!currentPathIsPublic && !isOnStoresPage && !isOnSettingsPage) {
        const newParams = new URLSearchParams(searchParamsHook.toString());
        newParams.set("storeId", firstStoreId);
        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
      } else if (!currentStoreIdFromUrl && (!selectedStoreId || selectedStoreId !== firstStoreId)) {
        setSelectedStoreId(firstStoreId);
      }
    } else { 
      if (selectedStoreId !== null) setSelectedStoreId(null);
      if (currentStoreIdFromUrl && !currentPathIsPublic && !isOnStoresPage && !isOnSettingsPage) {
        const newParams = new URLSearchParams(searchParamsHook.toString());
        newParams.delete("storeId");
        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
      }
    }
  }, [availableStores, areStoresFetched, hasMounted, pathname, router, searchParamsHook, authUser, selectedStoreId, toast]);


  React.useEffect(() => {
    const currentNavItem = navItems.find((item) => {
      const baseHref = item.href.split("?")[0];
      const currentPathBase = pathname.split("?")[0];
      return (baseHref === '/' && currentPathBase === '/') || (baseHref !== '/' && currentPathBase.startsWith(baseHref));
    });
    const baseTitle = currentNavItem?.title || "E-Ntemba";

    let newPageTitle;
    const overallAppLoading = isLoadingProfile || (isLoadingStores && !areStoresFetched);

    if (overallAppLoading) {
      newPageTitle = "Loading...";
    } else {
      const store = availableStores.find(s => s.id === selectedStoreId);
      newPageTitle = store ? `${store.name} - ${baseTitle}` : baseTitle;
    }
    setPageTitle(newPageTitle);
    document.title = `${newPageTitle === "Loading..." && baseTitle !== "E-Ntemba" ? baseTitle : newPageTitle} | E-Ntemba`;
  }, [pathname, selectedStoreId, availableStores, isLoadingProfile, isLoadingStores, areStoresFetched]);


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
    if (storeId === "no-stores-available") return;
    const newParams = new URLSearchParams(searchParamsHook.toString());
    newParams.set("storeId", storeId);
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const getHrefWithStoreId = (href: string) => {
    const currentParams = new URLSearchParams(searchParamsHook.toString());
    if (selectedStoreId) {
      currentParams.set("storeId", selectedStoreId);
    } else if (availableStores.length > 0 && areStoresFetched) {
      currentParams.set("storeId", availableStores[0].id);
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
      router.push("/login");
    }
  };

  const disableNavCondition = (itemHref: string) => {
    if (!authUser) return false;
    const path = itemHref.split("?")[0];
    if (path === "/stores" || path === "/settings") return false; 
    return !selectedStoreId && areStoresFetched && availableStores.length > 0;
  };

  const sidebarProps = {
    getHrefWithStoreId,
    pathname,
    authUser,
    availableStores,
    selectedStoreId,
    handleStoreChange,
    isLoadingProfile,
    isLoadingStores,
    areStoresFetched,
    vendorDisplayName,
    vendorEmail,
    vendorAvatarUrl,
    handleLogout,
    disableNavCondition
  };

  return (
    <>
      <Sidebar>
        <SidebarContentContainer {...sidebarProps} />
      </Sidebar>
      <MobileSheetSidebar openMobile={openMobile} setOpenMobile={setOpenMobile}>
        <SidebarContentContainer {...sidebarProps} />
      </MobileSheetSidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-20 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-semibold sm:text-2xl truncate">
            {pageTitle}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = React.useState(false);
  const [defaultOpen, setDefaultOpen] = React.useState(true);

  React.useEffect(() => {
    setHasMounted(true);
    const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("sidebar_state="))?.split("=")[1];
    if (cookieValue) setDefaultOpen(cookieValue === "true");
  }, []);

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

  return (
    <SidebarProvider defaultOpen={defaultOpen} collapsible="icon">
      <AppShellLayout>{children}</AppShellLayout>
    </SidebarProvider>
  );
}
