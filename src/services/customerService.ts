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
  storeId: string | null,
  page: number = 1,
  limit: number = 10
): Promise<{ data: CustomerFromSupabase[] | null; count: number | null; error: Error | null }> {
  console.log(`[customerService.getCustomers] Fetching customers. StoreID: ${storeId}, Page: ${page}, Limit: ${limit}`);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], count: 0, error: new Error("User not authenticated.") };
  }

  let storeIds: string[] = [];
  if (storeId) {
    storeIds = [storeId];
  } else {
    // If no specific store is selected, get all stores for the vendor
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .eq('vendor_id', user.id);

    if (storesError) {
      console.error('[customerService.getCustomers] Error fetching vendor stores:', storesError.message);
      return { data: null, count: 0, error: new Error("Could not fetch vendor's stores to determine customer list.") };
    }
    if (stores) {
      storeIds = stores.map(s => s.id);
    }
  }

  if (storeIds.length === 0) {
    console.log('[customerService.getCustomers] No stores found for this vendor, returning empty customer list.');
    return { data: [], count: 0, error: null };
  }

  // Fetch unique customer IDs who have ordered from the relevant stores
  const { data: customerLinks, error: ordersError } = await supabase
    .from('orders')
    .select('customer_id')
    .in('store_id', storeIds)
    .not('customer_id', 'is', null);

  if (ordersError) {
    console.error('[customerService.getCustomers] Error fetching customer links from orders:', ordersError.message);
    return { data: null, count: 0, error: new Error("Could not fetch customer list from orders.") };
  }

  const customerIds = [...new Set(customerLinks.map(o => o.customer_id))].filter(id => id !== null) as string[];

  if (customerIds.length === 0) {
    console.log('[customerService.getCustomers] No customers found for this vendor\'s stores.');
    return { data: [], count: 0, error: null };
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Now fetch the actual customer data for the filtered IDs
  const { data, error, count } = await supabase
    .from('customers')
    .select(COMMON_CUSTOMER_SELECT, { count: 'exact' })
    .in('id', customerIds)
    .order('last_order_date', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) {
    let message = error.message || 'Failed to fetch filtered customers.';
    console.error('[customerService.getCustomers] Supabase fetch error:', message, 'Original Error:', JSON.stringify(error, null, 2));
    return { data: null, count: null, error: new Error(message) };
  }

  console.log('[customerService.getCustomers] Fetched customers count:', data?.length, 'Total Count:', count);
  return { data, count, error: null };
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
export async function getNewCustomersForStoreCount(storeId: string, days: number = 30): Promise<{ data: { count: number } | null; error: Error | null }> {
  console.log(`[customerService.getNewCustomersForStoreCount] Fetching count for store ${storeId}, last ${days} days.`);
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required to get new customer count.") };
  }

  const { data, error } = await supabase.rpc('get_new_customers_for_store_count', {
    p_store_id: storeId,
    p_days_period: days,
  });

  if (error) {
    console.error('[customerService.getNewCustomersForStoreCount] Error calling RPC:', error.message);
    return { data: null, error: new Error(error.message) };
  }

  const count = typeof data === 'number' ? data : 0;
  console.log(`[customerService.getNewCustomersForStoreCount] Count for store ${storeId}: ${count}`);
  return { data: { count }, error: null };
}
