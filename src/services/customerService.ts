
// src/services/customerService.ts
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface CustomerAddressPayload {
  street: string;
  city: string;
  state_province?: string | null;
  zip_postal_code: string;
  country: string;
}

export interface CustomerPayload {
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  data_ai_hint_avatar?: string | null;
  status: 'Active' | 'Inactive' | 'Blocked';
  tags?: string[] | null;
  street_address?: string | null;
  city?: string | null;
  state_province?: string | null;
  zip_postal_code?: string | null;
  country?: string | null;
}

export interface CustomerFromSupabase {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  data_ai_hint_avatar: string | null;
  status: 'Active' | 'Inactive' | 'Blocked';
  tags: string[] | null;
  street_address: string | null;
  city: string | null;
  state_province: string | null;
  zip_postal_code: string | null;
  country: string | null;
  joined_date: string; 
  last_order_date: string | null; 
  total_spent: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

const COMMON_CUSTOMER_SELECT = `
  id, name, email, phone, avatar_url, data_ai_hint_avatar, status, tags,
  street_address, city, state_province, zip_postal_code, country,
  joined_date, last_order_date, total_spent, total_orders, created_at, updated_at
`;

export async function getCustomers(
  page: number = 1,
  limit: number = 10
): Promise<{ data: CustomerFromSupabase[] | null; count: number | null; error: Error | null }> {
  console.log(`[customerService.getCustomers] Fetching customers via RPC, page: ${page}, limit: ${limit}`);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], count: 0, error: new Error("User not authenticated.") };
  }

  // Parameters MUST be in the same order as the function definition in SQL
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_vendor_customers', {
    p_vendor_id: user.id,
    p_page_number: page,
    p_page_size: limit,
  });
  
  if (rpcError) {
    let message = rpcError.message || 'Failed to fetch customers via RPC.';
    if (rpcError.message.includes("function get_vendor_customers") && rpcError.message.includes("does not exist")) {
        message = `RPC Error: ${rpcError.message}. Ensure the 'get_vendor_customers' function is correctly defined in your Supabase SQL Editor and that the 'authenticated' role has EXECUTE permission on it.`;
    }
    console.error('[customerService.getCustomers] Supabase RPC error:', message, 'Original Error:', JSON.stringify(rpcError, null, 2));
    return { data: null, count: null, error: new Error(message) };
  }

  const customers = rpcData as (CustomerFromSupabase & { total_count: number })[];
  const totalCount = customers?.[0]?.total_count || 0;

  console.log('[customerService.getCustomers] Fetched customers via RPC. Count:', customers?.length, 'Total Count:', totalCount);
  return { data: customers, count: totalCount, error: null };
}

export async function getCustomerById(customerId: string): Promise<{ data: CustomerFromSupabase | null; error: Error | null }> {
  console.log('[customerService.getCustomerById] Fetching customer by ID:', customerId);
  if (!customerId) {
    console.error('[customerService.getCustomerById] Customer ID is required.');
    return { data: null, error: new Error('Customer ID is required.') };
  }
  const { data, error } = await supabase
    .from('customers')
    .select(COMMON_CUSTOMER_SELECT)
    .eq('id', customerId)
    .single();

  if (error) {
    let message = error.message || `Failed to fetch customer ${customerId}.`;
    if (error.code === 'PGRST116') { 
        message = `Customer with ID ${customerId} not found or access denied.`;
    } else if (Object.keys(error).length === 0 || !error.message) {
        message = `Failed to fetch customer ${customerId}. This often indicates an RLS policy issue preventing access.`;
    }
    console.error('[customerService.getCustomerById] Supabase fetch error:', message, 'Original Supabase Error:', JSON.stringify(error, null, 2));
    return { data: null, error: new Error(message) };
  }
  if (!data) {
    console.warn(`[customerService.getCustomerById] No customer data returned for ID ${customerId}, despite no explicit error. Likely RLS issue or customer does not exist.`);
    return { data: null, error: new Error(`Customer with ID ${customerId} not found or access denied. Please verify RLS and data.`) };
  }
  console.log('[customerService.getCustomerById] Successfully fetched customer:', data.id);
  return { data, error: null };
}

export async function getCustomerByEmail(email: string): Promise<{ data: CustomerFromSupabase | null; error: Error | null }> {
  console.log('[customerService.getCustomerByEmail] Fetching customer by email:', email);
  if (!email) {
    console.error('[customerService.getCustomerByEmail] Email is required.');
    return { data: null, error: new Error('Email is required.') };
  }
  const { data, error } = await supabase
    .from('customers')
    .select(COMMON_CUSTOMER_SELECT)
    .eq('email', email)
    .maybeSingle(); 

  if (error && error.code !== 'PGRST116') { 
    console.error('[customerService.getCustomerByEmail] Supabase fetch error:', error);
    return { data: null, error: new Error(error.message || 'Failed to fetch customer by email.') };
  }
  if (data) {
    console.log('[customerService.getCustomerByEmail] Successfully fetched customer by email:', data.id);
  } else {
    console.log('[customerService.getCustomerByEmail] No customer found with email:', email);
  }
  return { data, error: null };
}


export async function createCustomer(
  customerData: CustomerPayload
): Promise<{ data: CustomerFromSupabase | null; error: Error | null }> {
  console.log('[customerService.createCustomer] Attempting to create customer:', customerData.name);
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      avatar_url: customerData.avatar_url,
      data_ai_hint_avatar: customerData.data_ai_hint_avatar,
      status: customerData.status,
      tags: customerData.tags,
      street_address: customerData.street_address,
      city: customerData.city,
      state_province: customerData.state_province,
      zip_postal_code: customerData.zip_postal_code,
      country: customerData.country,
    })
    .select(COMMON_CUSTOMER_SELECT)
    .single();

  if (error || !newCustomer) {
    console.error('[customerService.createCustomer] Error creating customer:', error);
    const message = error?.message || 'Failed to create customer or retrieve it after insert. Check RLS or data constraints.';
    return { data: null, error: new Error(message) };
  }
  console.log('[customerService.createCustomer] Successfully created customer:', newCustomer.id);
  return { data: newCustomer, error: null };
}

export async function updateCustomer(
  customerId: string,
  updates: Partial<CustomerPayload>
): Promise<{ data: CustomerFromSupabase | null; error: Error | null }> {
  console.log('[customerService.updateCustomer] Attempting to update customer:', customerId);
  const { data: updatedCustomer, error } = await supabase
    .from('customers')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select(COMMON_CUSTOMER_SELECT)
    .single();

  if (error || !updatedCustomer) {
    console.error('[customerService.updateCustomer] Error updating customer:', error);
    const message = error?.message || `Failed to update customer ${customerId} or retrieve it. Check RLS.`;
    return { data: null, error: new Error(message) };
  }
  console.log('[customerService.updateCustomer] Successfully updated customer:', updatedCustomer.id);
  return { data: updatedCustomer, error: null };
}

export async function deleteCustomer(customerId: string): Promise<{ error: Error | null }> {
  console.log('[customerService.deleteCustomer] Attempting to delete customer:', customerId);
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (error) {
    console.error('[customerService.deleteCustomer] Error deleting customer:', error);
    return { error: new Error(error.message || `Failed to delete customer ${customerId}.`) };
  }
  console.log('[customerService.deleteCustomer] Successfully deleted customer:', customerId);
  return { error: null };
}


// --- Dashboard Specific Functions ---
export async function getRecentGlobalCustomersCount(days: number = 30): Promise<{ data: { count: number } | null; error: Error | null }> {
  console.log(`[customerService.getRecentGlobalCustomersCount] Fetching count of customers joined in the last ${days} days.`);
  
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  const dateThresholdString = dateThreshold.toISOString();

  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .gte('joined_date', dateThresholdString);

  if (error) {
    console.error('[customerService.getRecentGlobalCustomersCount] Error fetching recent customers count:', error.message);
    return { data: null, error: new Error(error.message) };
  }

  console.log(`[customerService.getRecentGlobalCustomersCount] Count: ${count ?? 0}`);
  return { data: { count: count ?? 0 }, error: null };
}
