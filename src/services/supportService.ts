import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface SupportTicket {
    id: string;
    user_id: string;
    subject: string;
    message: string;
    category: 'technical' | 'billing' | 'feature_request' | 'other';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
}

export type TicketPayload = Omit<SupportTicket, 'id' | 'created_at' | 'status'>;

export async function getUserTickets(userId: string): Promise<{ data: SupportTicket[] | null; error: Error | null }> {
    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tickets:', error);
        return { data: null, error: new Error(error.message) };
    }

    return { data: data as SupportTicket[], error: null };
}

export async function createTicket(userId: string, ticket: TicketPayload): Promise<{ data: SupportTicket | null; error: Error | null }> {
    const { data, error } = await supabase
        .from('support_tickets')
        .insert({ ...ticket, user_id: userId })
        .select()
        .single();

    if (error) {
        console.error('Error creating ticket:', error);
        return { data: null, error: new Error(error.message) };
    }

    return { data: data as SupportTicket, error: null };
}
