"use client";

import * as React from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount, type Notification } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function NotificationsMenu() {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const router = useRouter();
    const supabase = createClient();

    const fetchNotifications = React.useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [listRes, countRes] = await Promise.all([
            getUserNotifications(user.id),
            getUnreadNotificationCount(user.id)
        ]);

        if (listRes.data) setNotifications(listRes.data);
        if (countRes.count !== null) setUnreadCount(countRes.count);
        setIsLoading(false);
    }, [supabase]);

    React.useEffect(() => {
        fetchNotifications();

        // Optional: Set up realtime subscription here if desired in future
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkRead = async (id: string, link: string | null) => {
        await markNotificationAsRead(id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        if (link) {
            setIsOpen(false);
            router.push(link);
        }
    };

    const handleMarkAllRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await markAllNotificationsAsRead(user.id);
            setUnreadCount(0);
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto px-2 py-0.5 text-xs text-muted-foreground hover:text-primary">
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {isLoading ? (
                        <div className="p-4 performant-loading text-center text-xs text-muted-foreground">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground p-4 text-center">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex gap-3 p-4 transition-colors hover:bg-muted/50 cursor-pointer text-sm",
                                        !notification.is_read ? "bg-muted/30" : ""
                                    )}
                                    onClick={() => handleMarkRead(notification.id, notification.link)}
                                >
                                    <div className="mt-0.5">{getIcon(notification.type)}</div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between gap-2">
                                            <p className={cn("font-medium", !notification.is_read && "text-foreground")}>
                                                {notification.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground leading-snug line-clamp-2">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8" asChild onClick={() => setIsOpen(false)}>
                        <Link href="/notifications">View all notifications</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
