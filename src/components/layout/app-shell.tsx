
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import type { User as AuthUser } from '@supabase/supabase-js';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NavItem } from "@/config/nav";
import { navItems } from "@/config/nav";
import { LogOut, Settings, Store as StoreIcon, PanelLeft, Menu, PlusCircle, Download } from "lucide-react";
import { KioskIcon } from "@/components/icons/KioskIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { signOut } from "@/services/authService";
import { getCurrentVendorProfile } from "@/services/userService";
import { getStoresByUserId, type StoreFromSupabase } from "@/services/storeService";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationsMenu } from "@/components/NotificationsMenu";


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
  const router = useRouter();
  const selectedStoreName = stores.find(s => s.id === selectedStoreId)?.name || "Select a store";

  if (isCollapsed) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full my-2 h-11 text-sm bg-sidebar-background border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:ring-sidebar-ring justify-start">
          <div className="flex items-center gap-2 truncate">
            <StoreIcon className="h-5 w-5 text-sidebar-primary flex-shrink-0" />
            <span className="truncate">{selectedStoreName}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup value={selectedStoreId || ""} onValueChange={onStoreChange}>
          {stores.map((store) => (
            <DropdownMenuRadioItem key={store.id} value={store.id}>{store.name}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/stores')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Create New Store</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


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
  const [isSupplier, setIsSupplier] = React.useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [pageTitle, setPageTitle] = React.useState("Loading...");

  const [installPrompt, setInstallPrompt] = React.useState<any>(null);

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
        setIsSupplier(!!profile.is_supplier);
      } else {
        setVendorDisplayName(user.user_metadata?.display_name || user.email || null);
        setVendorEmail(user.email || null); setVendorAvatarUrl(user.user_metadata?.avatar_url || null);
        setIsSupplier(false);
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
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Effect for Auth changes
  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setAuthUser(currentUser);
      if (event === "SIGNED_IN" && currentUser) {
        fetchInitialUserData(currentUser);
      } else if (event === 'SIGNED_OUT') {
        setVendorDisplayName(null); setVendorEmail(null); setVendorAvatarUrl(null);
        setAvailableStores([]); setSelectedStoreId(null);
        setIsLoadingProfile(false); setIsLoadingStores(false);
        setIsSupplier(false);
      } else if (event === 'USER_UPDATED' && currentUser) {
        setVendorDisplayName(currentUser.user_metadata.display_name || currentUser.email);
        setVendorAvatarUrl(currentUser.user_metadata.avatar_url);
        // We might want to re-fetch profile here if is_supplier depends on metadata, but it's in DB
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
    // Only run this logic if we have finished loading stores.
    if (isLoadingStores) {
      return;
    }

    const storeIdFromUrl = searchParams.get("storeId");

    if (availableStores.length > 0) {
      // If there's a valid store ID in the URL, use it.
      if (storeIdFromUrl && availableStores.some(s => s.id === storeIdFromUrl)) {
        if (selectedStoreId !== storeIdFromUrl) {
          setSelectedStoreId(storeIdFromUrl);
        }
      } else {
        // Otherwise, default to the first store and update the URL.
        const firstStoreId = availableStores[0].id;
        if (selectedStoreId !== firstStoreId) {
          setSelectedStoreId(firstStoreId);
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.set("storeId", firstStoreId);
          // Use replace to avoid polluting browser history on initial load.
          router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
        }
      }
    } else {
      // If the user has no stores, clear the selected store and redirect if they are on the dashboard.
      setSelectedStoreId(null);
      if (pathname === '/dashboard') {
        router.replace('/stores');
      }
    }
  }, [searchParams, availableStores, pathname, router, isLoadingStores, selectedStoreId]);


  React.useEffect(() => {
    const currentNavItem = navItems.find(item => pathname.startsWith(item.href));
    const baseTitle = currentNavItem?.title || "E-Ntemba";
    const store = availableStores.find(s => s.id === selectedStoreId);
    const newTitle = store ? `${store.name} - ${baseTitle}` : baseTitle;

    setPageTitle(newTitle);
    if (typeof window !== 'undefined') {
      document.title = `${newTitle} | E-Ntemba`;
    }
  }, [pathname, selectedStoreId, availableStores]);


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

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({ title: "Installation Complete", description: "E-Ntemba has been added to your device." });
    }
    setInstallPrompt(null);
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
      <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center justify-between p-2 flex-shrink-0">
          {!isSidebarCollapsed && (
            <Link href={getHrefWithStoreId("/dashboard")} className="flex items-center gap-2">
              <KioskIcon className="h-8 w-8" />
              <span className="text-xl font-semibold">E-Ntemba</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <PanelLeft />
          </Button>
        </div>

        <Separator className="my-0 bg-sidebar-border flex-shrink-0" />

        {authUser && (
          <div className="px-2 pt-2 flex-shrink-0">
            <StoreSelector stores={availableStores} selectedStoreId={selectedStoreId} onStoreChange={handleStoreChange} isLoading={isLoadingStores} isCollapsed={isSidebarCollapsed} />
          </div>
        )}

        <ScrollArea className="flex-1">
          <nav className="grid gap-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const isDisabled = !selectedStoreId && item.href !== '/stores' && item.href !== '/settings';
              const navLink = (
                <Link
                  href={getHrefWithStoreId(item.href)}
                  className={cn("flex items-center justify-start gap-2 rounded-md p-3 text-base font-medium transition-colors", {
                    'bg-sidebar-accent text-sidebar-accent-foreground': isActive,
                    'text-sidebar-foreground hover:bg-sidebar-accent/50': !isActive,
                    'justify-center': isSidebarCollapsed,
                    'cursor-not-allowed opacity-50': isDisabled
                  })}
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

        <div className="mt-auto p-2 space-y-2 flex-shrink-0">
          {authUser && (
            <>
              <UserDisplay displayName={vendorDisplayName} email={vendorEmail} avatarUrl={vendorAvatarUrl} isLoading={isLoadingProfile} isCollapsed={isSidebarCollapsed} />
              <Link href={getHrefWithStoreId('/settings')} className={cn("flex items-center justify-start gap-2 rounded-md p-3 text-base font-medium transition-colors", { 'bg-sidebar-accent text-sidebar-accent-foreground': pathname.startsWith('/settings'), 'text-sidebar-foreground hover:bg-sidebar-accent/50': !pathname.startsWith('/settings'), 'justify-center': isSidebarCollapsed })}>
                <Settings className="h-5 w-5" /><span className={cn(isSidebarCollapsed && "hidden")}>Settings</span>
              </Link>
              {installPrompt && (
                <Button variant="ghost" className={cn("w-full flex items-center justify-start gap-2 rounded-md p-3 text-base font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50", { 'justify-center': isSidebarCollapsed })} onClick={handleInstallClick}>
                  <Download className="h-5 w-5" /><span className={cn(isSidebarCollapsed && "hidden")}>Install App</span>
                </Button>
              )}
              <Button variant="ghost" className={cn("w-full flex items-center justify-start gap-2 rounded-md p-3 text-base font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50", { 'justify-center': isSidebarCollapsed })} onClick={handleLogout}>
                <LogOut className="h-5 w-5" /><span className={cn(isSidebarCollapsed && "hidden")}>Logout</span>
              </Button>
            </>
          )}
          {!authUser && !isLoadingProfile && (
            <Link href="/login" className={cn("flex items-center justify-start gap-2 rounded-md p-3 text-base font-medium transition-colors", { 'justify-center': isSidebarCollapsed })}>
              <LogOut className="h-5 w-5" /><span className={cn(isSidebarCollapsed && "hidden")}>Login</span>
            </Link>
          )}
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside data-state="sticky" className={cn("hidden md:block bg-sidebar transition-all duration-300 fixed top-0 left-0 z-20 h-full", isSidebarCollapsed ? "w-20" : "w-64")}>
        {sidebarContent}
      </aside>
      <div className={cn("flex flex-col flex-1 transition-all duration-300", isSidebarCollapsed ? "md:pl-20" : "md:pl-64")}>
        <div className="relative flex h-full max-h-screen flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-20 sm:px-6">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[85vw] max-w-xs bg-sidebar text-sidebar-foreground border-r-sidebar-border">
                <SheetHeader>
                  <SheetTitle className="sr-only">Main Menu</SheetTitle>
                </SheetHeader>
                {React.cloneElement(sidebarContent, { isCollapsed: false })}
              </SheetContent>
            </Sheet>
            <h1 className="text-lg sm:text-xl font-semibold truncate flex-1">
              {isLoadingOverall ? "Loading..." : pageTitle}
            </h1>
            <div className="flex items-center gap-2">
              <NotificationsMenu />
              {selectedStoreId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="hidden sm:flex gap-1 h-9 rounded-full px-3 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 active:scale-95">
                      <PlusCircle className="h-4 w-4" />
                      <span>Create</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => router.push(`/orders?storeId=${selectedStoreId}&action=new`)}>
                      <Menu className="mr-2 h-4 w-4" /> New Order
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/products/new?storeId=${selectedStoreId}`)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> New Product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
          <main className={cn("flex-1 w-full max-w-full overflow-x-hidden p-4 sm:p-6", isSupplier ? "theme-supplier" : "")}>
            {children}
          </main>
        </div>
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
        <KioskIcon className="h-10 w-10 text-primary animate-pulse" />
      </div>
    );
  }

  return <AppShellLayout>{children}</AppShellLayout>;
}
