
// src/services/reportService.ts
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// --- Interfaces for RPC Return Types ---

export interface RevenueSummaryStats {
  ytd_revenue: number;
  ytd_transactions: number;
  current_month_revenue: number;
  current_month_transactions: number;
}

export interface MonthlyRevenueData {
  period_start_date: string; // e.g., '2024-01-01'
  total_revenue: number;
  transaction_count: number;
}

export interface TopProductByRevenue {
  product_id: string;
  product_name: string;
  product_category: string;
  primary_image_url: string | null;
  primary_image_data_ai_hint: string | null;
  total_revenue_generated: number;
  units_sold: number;
}

// --- Service Functions ---

export async function getRevenueSummaryStats(
  storeId: string
): Promise<{ data: RevenueSummaryStats | null; error: Error | null }> {
  console.log(`[reportService.getRevenueSummaryStats] Fetching for store ${storeId}`);
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required.") };
  }

  const { data, error } = await supabase.rpc('get_revenue_summary_stats', {
    p_store_id: storeId,
  });

  if (error) {
    console.error('[reportService.getRevenueSummaryStats] Error calling RPC:', error);
    return { data: null, error: new Error(error.message || 'Failed to fetch revenue summary stats from RPC.') };
  }
  // RPCs that return a single row are returned as an object, not an array.
  // If your RPC returns a SETOF, it would be an array. Assuming single row for stats.
  console.log('[reportService.getRevenueSummaryStats] Data from RPC:', data);
  return { data: data as RevenueSummaryStats | null, error: null };
}


export async function getMonthlyRevenueOverview(
  storeId: string,
  numberOfMonths: number
): Promise<{ data: MonthlyRevenueData[] | null; error: Error | null }> {
  console.log(`[reportService.getMonthlyRevenueOverview] Fetching for store ${storeId}, last ${numberOfMonths} months.`);
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required.") };
  }
  if (numberOfMonths <= 0) {
    return { data: null, error: new Error("Number of months must be positive.") };
  }

  const { data, error } = await supabase.rpc('get_monthly_revenue_overview', {
    p_store_id: storeId,
    p_number_of_months: numberOfMonths,
  });

  if (error) {
    console.error('[reportService.getMonthlyRevenueOverview] Error calling RPC:', error);
    return { data: null, error: new Error(error.message || 'Failed to fetch monthly revenue overview from RPC.') };
  }

  console.log('[reportService.getMonthlyRevenueOverview] Data from RPC:', data);
  return { data: data as MonthlyRevenueData[] | null, error: null };
}

export async function getTopProductsByRevenue(
  storeId: string,
  limit: number,
  daysPeriod: number | null // Allow null for all-time
): Promise<{ data: TopProductByRevenue[] | null; error: Error | null }> {
  console.log(`[reportService.getTopProductsByRevenue] Fetching top ${limit} products by revenue for store ${storeId}, period: ${daysPeriod === null ? 'all time' : daysPeriod + ' days'}.`);
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required.") };
  }

  const { data, error } = await supabase.rpc('get_top_products_by_revenue', {
    p_store_id: storeId,
    p_limit: limit,
    p_days_period: daysPeriod,
  });

  if (error) {
    console.error('[reportService.getTopProductsByRevenue] Error calling RPC:', error);
    return { data: null, error: new Error(error.message || 'Failed to fetch top products by revenue from RPC.') };
  }

  console.log('[reportService.getTopProductsByRevenue] Data from RPC:', data);
  return { data: data as TopProductByRevenue[] | null, error: null };
}
