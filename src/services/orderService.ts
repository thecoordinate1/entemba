
// src/services/orderService.ts
import { createClient } from '@/lib/supabase/client';
import type { OrderStatus } from '@/lib/mockData';

const supabase = createClient();

export interface OrderItemPayload {
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  price_per_unit_snapshot: number;
  product_image_url_snapshot?: string | null;
  data_ai_hint_snapshot?: string | null;
}

export interface OrderPayload {
  store_id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: OrderStatus;
  shipping_address: string;
  billing_address: string;
  shipping_method?: string | null;
  payment_method?: string | null;
  tracking_number?: string | null;
  shipping_latitude?: number | null;
  shipping_longitude?: number | null;
}

export interface OrderItemFromSupabase {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  quantity: number;
  price_per_unit_snapshot: number;
  product_image_url_snapshot: string | null;
  data_ai_hint_snapshot: string | null;
  created_at: string;
}

export interface OrderFromSupabase {
  id: string;
  store_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  order_date: string;
  total_amount: number;
  status: OrderStatus;
  shipping_address: string;
  billing_address: string;
  shipping_method: string | null;
  payment_method: string | null;
  tracking_number: string | null;
  shipping_latitude: number | null;
  shipping_longitude: number | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItemFromSupabase[];
}

// Expected structure from the get_monthly_sales_overview RPC function
export interface MonthlySalesDataFromRPC {
  period_start_date: string; // e.g., '2024-01-01'
  total_sales: number;
  order_count: number;
}


const commonOrderSelect = `
  id, store_id, customer_id, customer_name, customer_email, order_date, total_amount, status,
  shipping_address, billing_address, shipping_method, payment_method, tracking_number,
  shipping_latitude, shipping_longitude, created_at, updated_at,
  order_items (
    id, order_id, product_id, product_name_snapshot, quantity, price_per_unit_snapshot,
    product_image_url_snapshot, data_ai_hint_snapshot, created_at
  )
`;

export async function getOrdersByStoreId(
  storeId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: OrderFromSupabase[] | null; count: number | null; error: Error | null }> {
  console.log(`[orderService.getOrdersByStoreId] Fetching orders for store_id: ${storeId}, page: ${page}, limit: ${limit}`);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: ordersData, error: ordersError, count } = await supabase
    .from('orders')
    .select(commonOrderSelect, { count: 'exact' })
    .eq('store_id', storeId)
    .order('order_date', { ascending: false })
    .range(from, to);

  if (ordersError) {
    let message = ordersError.message || 'Failed to fetch orders.';
    if (Object.keys(ordersError).length === 0 || !ordersError.message) {
        message = `Failed to fetch orders for store ${storeId}. This often indicates an RLS policy issue on the 'orders' or 'order_items' tables, or a schema cache problem preventing the nested select. Please verify RLS policies and try refreshing the Supabase schema cache. Supabase Error: ${JSON.stringify(ordersError)}`;
    }
    console.error('[orderService.getOrdersByStoreId] Supabase fetch orders error:', message, 'Original Supabase Error:', JSON.stringify(ordersError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = ordersError;
    return { data: null, count: null, error: errorToReturn };
  }

  if (!ordersData) {
    console.warn(`[orderService.getOrdersByStoreId] No orders data returned for store ${storeId}, despite no explicit Supabase error. This could be due to RLS or no orders existing for this store.`);
    return { data: [], count: 0, error: null };
  }

  console.log('[orderService.getOrdersByStoreId] Fetched orders count:', ordersData?.length, "Total count:", count);
  return { data: ordersData as OrderFromSupabase[] | null, count: count, error: null };
}


export async function createOrder(
  orderData: OrderPayload,
  itemsData: OrderItemPayload[]
): Promise<{ data: OrderFromSupabase | null; error: Error | null }> {
  console.log('[orderService.createOrder] Attempting to create order for store_id:', orderData.store_id);

  const { data: newOrder, error: createOrderError } = await supabase
    .from('orders')
    .insert({
      store_id: orderData.store_id,
      customer_id: orderData.customer_id,
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      total_amount: orderData.total_amount,
      status: orderData.status,
      shipping_address: orderData.shipping_address,
      billing_address: orderData.billing_address,
      shipping_method: orderData.shipping_method,
      payment_method: orderData.payment_method,
      tracking_number: orderData.tracking_number,
      shipping_latitude: orderData.shipping_latitude,
      shipping_longitude: orderData.shipping_longitude,
    })
    .select(commonOrderSelect.replace('order_items (', 'order_items!left (')) 
    .single();

  if (createOrderError || !newOrder) {
    let message = 'Failed to create order record.';
    let details: any = createOrderError;
     if (createOrderError) {
        if (createOrderError.message && typeof createOrderError.message === 'string' && createOrderError.message.trim() !== '') {
             message = createOrderError.message;
        } else if (Object.keys(createOrderError).length === 0 && !createOrderError.message) {
            message = `Failed to create order. This often indicates an RLS policy issue on the 'orders' table preventing the insert or read-back. Original Supabase Error: ${JSON.stringify(createOrderError)}`;
        } else {
             message = createOrderError.message || `Supabase error during order insert. Details: ${JSON.stringify(createOrderError)}`;
        }
    } else if (!newOrder) {
        message = 'Failed to retrieve order after insert. This strongly suggests an RLS SELECT policy on the `orders` table is missing or incorrect.';
    }
    console.error('[orderService.createOrder] Error creating order. Message:', message, "Original Supabase Error:", JSON.stringify(createOrderError, null, 2) || 'No specific Supabase error object returned.');
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = details;
    return { data: null, error: errorToReturn };
  }

  const insertedOrderItems: OrderItemFromSupabase[] = [];
  if (itemsData.length > 0) {
    const itemsToInsert = itemsData.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      product_name_snapshot: item.product_name_snapshot,
      quantity: item.quantity,
      price_per_unit_snapshot: item.price_per_unit_snapshot,
      product_image_url_snapshot: item.product_image_url_snapshot,
      data_ai_hint_snapshot: item.data_ai_hint_snapshot,
    }));

    const { data: newItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select('*');

    if (itemsError) {
      let itemErrorMessage = itemsError.message || 'Failed to insert order items.';
       if (Object.keys(itemsError).length === 0 || !itemsError.message) {
            itemErrorMessage = `Order ${newOrder.id} created, but failed to insert order items due to a likely RLS issue on 'order_items'. Supabase Error: ${JSON.stringify(itemsError)}`;
       }
      console.error('[orderService.createOrder] Error inserting order items:', itemErrorMessage, 'Original Supabase Error:', JSON.stringify(itemsError, null, 2));
      const orderWithError = { ...newOrder, order_items: [] } as OrderFromSupabase;
      const errorToReturn = new Error(itemErrorMessage);
      (errorToReturn as any).details = itemsError;
      return {
        data: orderWithError,
        error: errorToReturn
      };
    }
    if (newItems) {
      insertedOrderItems.push(...newItems as OrderItemFromSupabase[]);
    }
  }

  const finalOrderData: OrderFromSupabase = {
    ...newOrder,
    order_items: insertedOrderItems,
  };

  console.log('[orderService.createOrder] Successfully created order:', finalOrderData.id);
  return { data: finalOrderData, error: null };
}

export async function getOrderById(orderId: string, storeId: string): Promise<{ data: OrderFromSupabase | null; error: Error | null }> {
  console.log('[orderService.getOrderById] Fetching order by ID:', orderId, 'for store ID:', storeId);

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select(commonOrderSelect)
    .eq('id', orderId)
    .eq('store_id', storeId)
    .single();

  if (orderError) {
    let message = orderError.message || 'Failed to fetch order.';
    if (orderError.code === 'PGRST116') { 
        message = `Order with ID ${orderId} not found for store ${storeId}, or access denied.`;
    } else if (Object.keys(orderError).length === 0 || !orderError.message) {
        message = `Failed to fetch order ${orderId}. This often indicates an RLS policy issue on 'orders' or 'order_items', or a schema cache problem. Please verify RLS policies and try refreshing the Supabase schema cache. Supabase Error: ${JSON.stringify(orderError)}`;
    }
    console.error('[orderService.getOrderById] Supabase fetch order error:', message, 'Original Supabase Error:', JSON.stringify(orderError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = orderError;
    return { data: null, error: errorToReturn };
  }

  if (!orderData) {
    const msg = `Order with ID ${orderId} not found for store ${storeId}, or access denied (no data returned). Verify RLS SELECT policies.`;
    console.warn(`[orderService.getOrderById] ${msg}`);
    return { data: null, error: new Error(msg) };
  }

  console.log('[orderService.getOrderById] Fetched order:', orderData?.id);
  return { data: orderData as OrderFromSupabase | null, error: null };
}


export async function updateOrderStatus(
  orderId: string,
  storeId: string,
  status: OrderStatus,
  trackingNumber?: string | null
): Promise<{ data: OrderFromSupabase | null; error: Error | null }> {
  console.log(`[orderService.updateOrderStatus] Updating status for order ID: ${orderId} to ${status} for store ID: ${storeId}. Tracking: ${trackingNumber}`);

  const updatePayload: { status: OrderStatus, updated_at: string, tracking_number?: string | null } = {
    status: status,
    updated_at: new Date().toISOString(),
  };

  if (trackingNumber !== undefined) { 
    updatePayload.tracking_number = trackingNumber;
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .eq('store_id', storeId)
    .select(commonOrderSelect)
    .single();

  if (updateError || !updatedOrder) {
    let message = 'Failed to update order status.';
    if (updateError) {
        if (updateError.message && typeof updateError.message === 'string' && updateError.message.trim() !== '') {
            message = updateError.message;
        } else if (Object.keys(updateError).length === 0 && !updateError.message) {
            message = `Failed to update order ${orderId}. This often indicates an RLS policy issue on 'orders' preventing the update or read-back. Original Supabase Error: ${JSON.stringify(updateError)}`;
        } else {
            message = updateError.message || `Supabase error during order status update. Details: ${JSON.stringify(updateError)}`;
        }
    } else if (!updatedOrder) {
        message = 'Failed to retrieve order after status update. This strongly suggests an RLS SELECT policy on the `orders` table is missing or incorrect.';
    }
    console.error('[orderService.updateOrderStatus] Error updating order status. Message:', message, "Original Supabase Error:", JSON.stringify(updateError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = updateError;
    return { data: null, error: errorToReturn };
  }

  console.log(`[orderService.updateOrderStatus] Successfully updated status for order ID: ${orderId}`);
  return { data: updatedOrder as OrderFromSupabase, error: null };
}

export async function getOrdersByStoreIdAndStatus(
  storeId: string,
  status: OrderStatus,
  page: number = 1,
  limit: number = 10
): Promise<{ data: OrderFromSupabase[] | null; count: number | null; error: Error | null }> {
  console.log(`[orderService.getOrdersByStoreIdAndStatus] Fetching orders for store_id: ${storeId}, status: ${status}, page: ${page}, limit: ${limit}`);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: ordersData, error: ordersError, count } = await supabase
    .from('orders')
    .select(commonOrderSelect, { count: 'exact' })
    .eq('store_id', storeId)
    .eq('status', status)
    .order('order_date', { ascending: false })
    .range(from, to);

  if (ordersError) {
    let message = ordersError.message || `Failed to fetch orders with status ${status}.`;
    if (Object.keys(ordersError).length === 0 || !ordersError.message) {
        message = `Failed to fetch orders for store ${storeId} with status ${status}. This often indicates an RLS policy issue or schema cache problem. Supabase Error: ${JSON.stringify(ordersError)}`;
    }
    console.error(`[orderService.getOrdersByStoreIdAndStatus] Supabase fetch error (status: ${status}):`, message, 'Original Supabase Error:', JSON.stringify(ordersError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = ordersError;
    return { data: null, count: null, error: errorToReturn };
  }

  if (!ordersData) {
    console.warn(`[orderService.getOrdersByStoreIdAndStatus] No orders data returned for store ${storeId} with status ${status}, despite no explicit Supabase error.`);
    return { data: [], count: 0, error: null }; 
  }

  console.log(`[orderService.getOrdersByStoreIdAndStatus] Fetched orders count (status: ${status}):`, ordersData?.length, "Total count:", count);
  return { data: ordersData as OrderFromSupabase[] | null, count: count, error: null };
}

export async function getOrdersByCustomerAndStore(
  customerId: string,
  storeId: string
): Promise<{ data: OrderFromSupabase[] | null; error: Error | null }> {
  console.log(`[orderService.getOrdersByCustomerAndStore] Fetching orders for customer_id: ${customerId} and store_id: ${storeId}`);

  if (!customerId || !storeId) {
    const msg = "Customer ID and Store ID are required.";
    console.error(`[orderService.getOrdersByCustomerAndStore] ${msg}`);
    return { data: null, error: new Error(msg) };
  }

  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(commonOrderSelect)
    .eq('customer_id', customerId)
    .eq('store_id', storeId)
    .order('order_date', { ascending: false });

  if (ordersError) {
    let message = ordersError.message || 'Failed to fetch orders for customer and store.';
    if (Object.keys(ordersError).length === 0 || !ordersError.message) {
        message = `Failed to fetch orders for customer ${customerId} in store ${storeId}. This often indicates an RLS policy issue or schema cache problem. Supabase Error: ${JSON.stringify(ordersError)}`;
    }
    console.error(`[orderService.getOrdersByCustomerAndStore] Supabase fetch error:`, message, 'Original Supabase Error:', JSON.stringify(ordersError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = ordersError;
    return { data: null, error: errorToReturn };
  }

  if (!ordersData) {
    console.warn(`[orderService.getOrdersByCustomerAndStore] No orders data returned for customer ${customerId} in store ${storeId}, despite no explicit Supabase error.`);
    return { data: [], error: null }; 
  }

  console.log(`[orderService.getOrdersByCustomerAndStore] Fetched orders count:`, ordersData?.length);
  return { data: ordersData as OrderFromSupabase[] | null, error: null };
}

// --- Dashboard Specific Functions ---
export interface StoreOrderStats {
  totalRevenue: number;
  activeOrdersCount: number;
}

export async function getStoreOrderStats(storeId: string): Promise<{ data: StoreOrderStats | null; error: Error | null }> {
  console.log(`[orderService.getStoreOrderStats] Fetching order stats for store ID: ${storeId}`);
  if (!storeId) return { data: null, error: new Error("Store ID is required for order stats.") };

  const { data: orders, error: fetchError } = await supabase
    .from('orders')
    .select('total_amount, status')
    .eq('store_id', storeId);

  if (fetchError) {
    console.error(`[orderService.getStoreOrderStats] Error fetching orders for store ${storeId}:`, fetchError.message);
    return { data: null, error: new Error(fetchError.message) };
  }

  if (!orders) {
    return { data: { totalRevenue: 0, activeOrdersCount: 0 }, error: null };
  }

  let totalRevenue = 0;
  let activeOrdersCount = 0;

  orders.forEach(order => {
    if (order.status === 'Delivered' || order.status === 'Shipped') {
      totalRevenue += order.total_amount || 0;
    }
    if (order.status === 'Pending' || order.status === 'Processing') {
      activeOrdersCount++;
    }
  });
  
  console.log(`[orderService.getStoreOrderStats] Stats for store ${storeId}:`, { totalRevenue, activeOrdersCount });
  return { data: { totalRevenue, activeOrdersCount }, error: null };
}


export async function getStoreTotalProductsSold(storeId: string): Promise<{ data: { totalSold: number } | null; error: Error | null }> {
  console.log(`[orderService.getStoreTotalProductsSold] Fetching total products sold for store ID: ${storeId}`);
  if (!storeId) {
    console.error("[orderService.getStoreTotalProductsSold] Store ID is required.");
    return { data: null, error: new Error("Store ID is required.") };
  }

  const { data, error } = await supabase.rpc('get_total_products_sold_for_store', {
    p_store_id: storeId,
  });

  if (error) {
    let detailedErrorMessage = error.message || 'Failed to fetch total products sold from RPC.';
    if (error.message.includes("function get_total_products_sold_for_store") && error.message.includes("does not exist")) {
        detailedErrorMessage = `RPC Error: ${error.message}. Ensure the 'get_total_products_sold_for_store(UUID)' function is correctly defined in your Supabase SQL Editor and that the 'authenticated' role has EXECUTE permission on it.`;
    } else if (error.message.includes("permission denied for function")) {
         detailedErrorMessage = `RPC Error: ${error.message}. The 'authenticated' role (or the role your user is using) lacks EXECUTE permission on the 'get_total_products_sold_for_store' function. Please grant permission using: GRANT EXECUTE ON FUNCTION get_total_products_sold_for_store(UUID) TO authenticated;`;
    }
    console.error(`[orderService.getStoreTotalProductsSold] Error calling RPC for store ${storeId}:`, detailedErrorMessage, 'Original Supabase Error:', JSON.stringify(error, null, 2));
    return { data: null, error: new Error(detailedErrorMessage) };
  }
  
  const totalSold = data && data.length > 0 ? data[0].total_products_sold : 0;

  console.log(`[orderService.getStoreTotalProductsSold] Total products sold for store ${storeId}: ${totalSold}`);
  return { data: { totalSold: totalSold }, error: null };
}


export async function getMonthlySalesOverviewForStore(
  storeId: string,
  numberOfMonths: number
): Promise<{ data: MonthlySalesDataFromRPC[] | null; error: Error | null }> {
  console.log(`[orderService.getMonthlySalesOverviewForStore] Fetching for store ${storeId}, last ${numberOfMonths} months.`);
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required.") };
  }
  if (numberOfMonths <= 0) {
    return { data: null, error: new Error("Number of months must be positive.") };
  }

  const { data, error } = await supabase.rpc('get_monthly_sales_overview', {
    p_store_id: storeId,
    p_number_of_months: numberOfMonths,
  });

  if (error) {
    console.error('[orderService.getMonthlySalesOverviewForStore] Error calling RPC:', error);
    return { data: null, error: new Error(error.message || 'Failed to fetch monthly sales overview from RPC.') };
  }

  console.log('[orderService.getMonthlySalesOverviewForStore] Data from RPC:', data);
  return { data: data as MonthlySalesDataFromRPC[] | null, error: null };
}

