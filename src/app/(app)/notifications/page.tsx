"use client";

import * as React from "react";
import { Check, CheckCircle, Info, AlertTriangle, XCircle, Trash2, Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, type Notification } from "@/services/notificationService";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function NotificationsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const res = await getUserNotifications(user.id);
            if (res.data) setNotifications(res.data);
            setIsLoading(false);
        }
        load();
    }, [supabase]);

    const handleRead = async (n: Notification) => {
        if (!n.is_read) {
            await markNotificationAsRead(n.id);
            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
        }
        if (n.link) router.push(n.link);
    };

    const markAll = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await markAllNotificationsAsRead(user.id);
            setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
            toast({ title: "Marked all as read" });
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-600" />;
            case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
            default: return <Info className="h-5 w-5 text-blue-600" />;
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground mt-1">Stay updated with important alerts.</p>
                </div>
                <Button variant="outline" onClick={markAll} disabled={!notifications.some(n => !n.is_read)}>
                    <Check className="mr-2 h-4 w-4" /> Mark all as read
                </Button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : notifications.length === 0 ? (
                    <Card className="border-dashed py-12">
                        <CardContent className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-center">
                            <Bell className="h-10 w-10 opacity-20" />
                            <p>You're all caught up!</p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map(n => (
                        <Card
                            key={n.id}
                            className={cn(
                                "transition-all cursor-pointer hover:shadow-md border-l-4",
                                n.is_read ? "border-l-transparent opacity-80" : "border-l-blue-500 bg-blue-50/10"
                            )}
                            onClick={() => handleRead(n)}
                        >
                            <CardContent className="flex gap-4 p-4 sm:p-6 items-start">
                                <div className={cn("p-2 rounded-full shrink-0", n.is_read ? "bg-muted" : "bg-background shadow-sm")}>
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <h4 className={cn("font-semibold", !n.is_read && "text-blue-700 dark:text-blue-400")}>{n.title}</h4>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(n.created_at), 'MMM d, yyyy h:mm a')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                                </div>
                                {!n.is_read && (
                                    <div className="self-center">
                                        <div className="h-2 w-2 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
