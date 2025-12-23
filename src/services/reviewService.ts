import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface Review {
    id: string;
    store_id: string;
    product_id: string | null;
    customer_name: string;
    rating: number;
    comment: string | null;
    vendor_reply: string | null;
    is_verified_purchase: boolean;
    created_at: string;
    // Joins
    products?: { name: string; image_urls: string[] } | null;
}

export async function getStoreReviews(storeId: string): Promise<{ data: Review[] | null; error: Error | null }> {
    const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name, image_urls)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        return { data: null, error: new Error(error.message) };
    }

    return { data: data as Review[], error: null };
}

export async function replyToReview(reviewId: string, reply: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
        .from('reviews')
        .update({ vendor_reply: reply, updated_at: new Date().toISOString() })
        .eq('id', reviewId);

    if (error) {
        console.error('Error replying to review:', error);
        return { error: new Error(error.message) };
    }

    return { error: null };
}
