
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NavItem } from "@/config/nav";
import { navItems } from "@/config/nav";
import { LogOut, Settings, Gem, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const UserDisplay = () => (
  <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
    <Avatar className="h-9 w-9">
      <AvatarImage src="https://picsum.photos/40/40" alt="Vendor Avatar" data-ai-hint="person portrait" />
      <AvatarFallback>VD</AvatarFallback>
    </Avatar>
    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
      <span className="text-sm font-medium text-sidebar-foreground">Vendor Name</span>
      <span className="text-xs text-sidebar-foreground/70">vendor@example.com</span>
    </div>
  </div>
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
  }, []);

  return (
    <SidebarProvider defaultOpen={defaultOpen} collapsible="icon">
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Gem className="h-7 w-7 text-accent" />
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
              E-Ntemba
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <ScrollArea className="h-full">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')}
                    tooltip={{children: item.title, className:"bg-sidebar-accent text-sidebar-accent-foreground"}}
                  >
                    <Link href={item.href}>
                      <item.icon />
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
          <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square">
            <Settings className="mr-2 group-data-[collapsible=icon]:mr-0" /> <span className="group-data-[collapsible=icon]:hidden">Settings</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square">
            <LogOut className="mr-2 group-data-[collapsible=icon]:mr-0" /> <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold sm:text-xl">
            {navItems.find((item) => pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/'))?.title || "Page Title"}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
