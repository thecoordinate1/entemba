// src/services/reportService.ts
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// --- Interfaces for RPC Return Types (Revenue) ---

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
  total_revenue_generated: number;
  units_sold: number;
}

// --- Interfaces for RPC Return Types (Profit) ---

export interface ProfitSummaryStats {
  ytd_gross_profit: number;
  ytd_cogs: number;
  current_month_gross_profit: number;
  current_month_cogs: number;
  ytd_revenue_for_margin_calc: number; // Total revenue for YTD to calculate margin
  current_month_revenue_for_margin_calc: number; // Total revenue for current month
}

export interface MonthlyProfitData {
  period_start_date: string; // e.g., '2024-01-01'
  total_gross_profit: number;
  total_cogs: number;
}

export interface ProductProfitData { // Used for both top products and all products profit
  product_id: string;
  product_name: string;
  product_category: string;
  primary_image_url: string | null;
  total_profit_generated: number;
  units_sold: number;
}

export interface CategoryProfitData {
    category: string;
    total_profit: number;
}


// --- Service Functions (Revenue) ---

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
    console.error('[reportService.getRevenueSummaryStats] Error calling RPC:', JSON.stringify(error, null, 2));
    return { data: null, error: new Error(error.message || 'Failed to fetch revenue summary stats from RPC.') };
  }
  // RPCs returning a single row often wrap it in an array
  if (!data || data.length === 0) {
    console.warn('[reportService.getRevenueSummaryStats] No data returned from RPC for store:', storeId);
    return { data: null, error: new Error('No summary data returned from RPC for revenue.') };
  }
  console.log('[reportService.getRevenueSummaryStats] Data from RPC:', data[0]);
  return { data: data[0] as RevenueSummaryStats, error: null };
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
    console.error('[reportService.getMonthlyRevenueOverview] Error calling RPC:', JSON.stringify(error, null, 2));
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
    console.error('[reportService.getTopProductsByRevenue] Error calling RPC:', JSON.stringify(error, null, 2));
    return { data: null, error: new Error(error.message || 'Failed to fetch top products by revenue from RPC.') };
  }

  console.log('[reportService.getTopProductsByRevenue] Data from RPC:', data);
  return { data: data as TopProductByRevenue[] | null, error: null };
}

export async function getAllProductsRevenueForStore(
  storeId: string,
  daysPeriod: number | null
): Promise<{ data: TopProductByRevenue[] | null; error: Error | null }> {
  console.log(`[reportService.getAllProductsRevenueForStore] Fetching all products revenue for store ${storeId}, period: ${daysPeriod === null ? 'all time' : daysPeriod + ' days'}.`);
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required for all products revenue.") };
  }

  const { data, error } = await supabase.rpc('get_all_products_revenue_for_store', {
    p_store_id: storeId,
    p_days_period: daysPeriod,
  });

  if (error) {
    console.error('[reportService.getAllProductsRevenueForStore] Error calling RPC:', JSON.stringify(error, null, 2));
    return { data: null, error: new Error(error.message || 'Failed to fetch all products revenue from RPC.') };
  }
  console.log('[reportService.getAllProductsRevenueForStore] Data from RPC:', data);
  return { data: data as TopProductByRevenue[] | null, error: null };
}


// --- Service Functions (Profit) ---

export async function getProfitSummaryStats(
  storeId: string,
  daysPeriod: number | null = 90 // Default to last 90 days
): Promise<{ data: ProfitSummaryStats | null; error: Error | null }> {
  console.log(`[reportService.getProfitSummaryStats] Fetching for store ${storeId}, period ${daysPeriod} days`);
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required for profit summary.") };
  }

  const { data, error } = await supabase.rpc('get_profit_summary_stats', {
    p_store_id: storeId
  });

  if (error) {
    console.error('[reportService.getProfitSummaryStats] Error calling RPC:', JSON.stringify(error, null, 2));
    return { data: null, error: new Error(error.message || 'Failed to fetch profit summary stats from RPC.') };
  }
  if (!data || data.length === 0) {
    console.warn('[reportService.getProfitSummaryStats] No data returned from RPC for store:', storeId);
    return { data: null, error: new Error('No summary data returned from RPC for profit.') };
  }
  console.log('[reportService.getProfitSummaryStats] Data from RPC:', data[0]);
  return { data: data[0] as ProfitSummaryStats, error: null };
}

export async function getMonthlyProfitOverview(
  storeId: string,
  numberOfMonths: number
): Promise<{ data: MonthlyProfitData[] | null; error: Error | null }> {
  console.log(`[reportService.getMonthlyProfitOverview] Fetching for store ${storeId}, last ${numberOfMonths} months.`);
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required for monthly profit.") };
  }
  if (numberOfMonths <= 0) {
    return { data: null, error: new Error("Number of months must be positive.") };
  }

  const { data, error } = await supabase.rpc('get_monthly_profit_overview', {
    p_store_id: storeId,
    p_number_of_months: numberOfMonths,
  });

  if (error) {
    console.error('[reportService.getMonthlyProfitOverview] Error calling RPC:', JSON.stringify(error, null, 2));
    return { data: null, error: new Error(error.message || 'Failed to fetch monthly profit overview from RPC.') };
  }
  console.log('[reportService.getMonthlyProfitOverview] Data from RPC:', data);
  return { data: data as MonthlyProfitData[] | null, error: null };
}

export async function getTopProductsByProfit(
  storeId: string,
  limit: number,
  daysPeriod: number | null = 90 // Default to last 90 days
): Promise<{ data: ProductProfitData[] | null; error: Error | null }> {
  console.log(`[reportService.getTopProductsByProfit] Fetching top ${limit} products by profit for store ${storeId}, period: ${daysPeriod === null ? 'all time' : daysPeriod + ' days'}.`);
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required for top products by profit.") };
  }

  const { data, error } = await supabase.rpc('get_top_products_by_profit', {
    p_store_id: storeId,
    p_limit: limit,
    p_days_period: daysPeriod,
  });

  if (error) {
    console.error('[reportService.getTopProductsByProfit] Error calling RPC:', JSON.stringify(error, null, 2));
    return { data: null, error: new Error(error.message || 'Failed to fetch top products by profit from RPC.') };
  }
  console.log('[reportService.getTopProductsByProfit] Data from RPC:', data);
  return { data: data as ProductProfitData[] | null, error: null };
}

export async function getAllProductsProfitForStore(
  storeId: string,
  daysPeriod: number | null
): Promise<{ data: ProductProfitData[] | null; error: Error | null }> {
  console.log(`[reportService.getAllProductsProfitForStore] Fetching all products profit for store ${storeId}, period: ${daysPeriod === null ? 'all time' : daysPeriod + ' days'}.`);
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required for all products profit.") };
  }

  const { data, error } = await supabase.rpc('get_all_products_profit_for_store', {
    p_store_id: storeId,
    p_days_period: daysPeriod,
  });

  if (error) {
    console.error('[reportService.getAllProductsProfitForStore] Error calling RPC:', JSON.stringify(error, null, 2));
    return { data: null, error: new Error(error.message || 'Failed to fetch all products profit from RPC.') };
  }
  console.log('[reportService.getAllProductsProfitForStore] Data from RPC:', data);
  return { data: data as ProductProfitData[] | null, error: null };
}

export async function getProfitByCategory(
    storeId: string,
    daysPeriod: number | null = null // Default to all-time if not specified
): Promise<{ data: CategoryProfitData[] | null; error: Error | null}> {
    console.log(`[reportService.getProfitByCategory] Fetching for store ${storeId}, period: ${daysPeriod === null ? 'all time' : daysPeriod + ' days'}.`);
    if (!storeId) {
        return { data: null, error: new Error("Store ID is required for profit by category.") };
    }

    const { data, error } = await supabase.rpc('get_profit_by_category', {
        p_store_id: storeId,
        p_days_period: daysPeriod,
    });

    if (error) {
        console.error('[reportService.getProfitByCategory] Error calling RPC:', JSON.stringify(error, null, 2));
        return { data: null, error: new Error(error.message || 'Failed to fetch profit by category from RPC.') };
    }
    console.log('[reportService.getProfitByCategory] Data from RPC:', data);
    return { data: data as CategoryProfitData[] | null, error: null };
}
