import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface Coupon {
    id: string;
    store_id: string;
    code: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    min_spend: number;
    usage_limit: number | null;
    used_count: number;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    created_at: string;
}

export type CouponPayload = Omit<Coupon, 'id' | 'created_at' | 'used_count' | 'store_id'>;

export async function getCouponsByStoreId(storeId: string): Promise<{ data: Coupon[] | null; error: Error | null }> {
    if (!storeId) return { data: [], error: null };

    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching coupons:', error);
        return { data: null, error: new Error(error.message) };
    }

    return { data: data as Coupon[], error: null };
}

export async function createCoupon(storeId: string, coupon: CouponPayload): Promise<{ data: Coupon | null; error: Error | null }> {
    const { data, error } = await supabase
        .from('coupons')
        .insert({ ...coupon, store_id: storeId })
        .select()
        .single();

    if (error) {
        console.error('Error creating coupon:', error);
        return { data: null, error: new Error(error.message) };
    }

    return { data: data as Coupon, error: null };
}

export async function updateCoupon(id: string, updates: Partial<CouponPayload>): Promise<{ data: Coupon | null; error: Error | null }> {
    const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating coupon:', error);
        return { data: null, error: new Error(error.message) };
    }

    return { data: data as Coupon, error: null };
}

export async function toggleCouponStatus(id: string, isActive: boolean): Promise<{ error: Error | null }> {
    const { error } = await supabase
        .from('coupons')
        .update({ is_active: isActive })
        .eq('id', id);

    return { error: error ? new Error(error.message) : null };
}

export async function deleteCoupon(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

    return { error: error ? new Error(error.message) : null };
}
