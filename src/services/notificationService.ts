import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface Notification {
    id: string;
    user_id: string;
    store_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    link: string | null;
    created_at: string;
}

export async function getUserNotifications(userId: string) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 for performance

    if (error) {
        console.error('Error fetching notifications:', error);
        return { data: null, error };
    }

    return { data: data as Notification[], error: null };
}

export async function getUnreadNotificationCount(userId: string) {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('Error fetching unread count:', error);
        return { count: 0, error };
    }

    return { count: count || 0, error: null };
}

export async function markNotificationAsRead(notificationId: string) {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification read:', error);
        return { error };
    }

    return { error: null };
}

export async function markAllNotificationsAsRead(userId: string) {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all read:', error);
        return { error };
    }

    return { error: null };
}
