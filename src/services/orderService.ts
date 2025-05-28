
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

const commonOrderSelect = `
  id, store_id, customer_id, customer_name, customer_email, order_date, total_amount, status,
  shipping_address, billing_address, shipping_method, payment_method, tracking_number,
  shipping_latitude, shipping_longitude, created_at, updated_at,
  order_items (
    id, order_id, product_id, product_name_snapshot, quantity, price_per_unit_snapshot,
    product_image_url_snapshot, data_ai_hint_snapshot, created_at
  )
`;

export async function getOrdersByStoreId(storeId: string): Promise<{ data: OrderFromSupabase[] | null; error: Error | null }> {
  console.log('[orderService.getOrdersByStoreId] Fetching orders for store_id:', storeId);

  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(commonOrderSelect)
    .eq('store_id', storeId)
    .order('order_date', { ascending: false });

  if (ordersError) {
    let message = ordersError.message || 'Failed to fetch orders.';
    if (Object.keys(ordersError).length === 0 || !ordersError.message) {
        message = `Failed to fetch orders for store ${storeId}. This often indicates a Row Level Security (RLS) policy issue on the 'orders' or 'order_items' tables, or a schema cache problem preventing the nested select. Please verify RLS policies and try refreshing the Supabase schema cache.`;
    }
    console.error('[orderService.getOrdersByStoreId] Supabase fetch orders error:', message, 'Original Supabase Error:', JSON.stringify(ordersError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = ordersError;
    return { data: null, error: errorToReturn };
  }

  if (!ordersData) {
    console.warn(`[orderService.getOrdersByStoreId] No orders data returned for store ${storeId}, despite no explicit Supabase error. This could be due to RLS or no orders existing for this store.`);
    return { data: [], error: null };
  }

  console.log('[orderService.getOrdersByStoreId] Fetched orders count:', ordersData?.length);
  return { data: ordersData as OrderFromSupabase[] | null, error: null };
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
            itemErrorMessage = `Order ${newOrder.id} created, but failed to insert order items due to a likely RLS issue on 'order_items'.`;
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
    if (orderError.code === 'PGRST116') { // Standard Supabase "Not found" error
        message = `Order with ID ${orderId} not found for store ${storeId}, or access denied.`;
    } else if (Object.keys(orderError).length === 0 || !orderError.message) {
        message = `Failed to fetch order ${orderId}. This often indicates an RLS policy issue on 'orders' or 'order_items', or a schema cache problem. Please verify RLS policies and try refreshing the Supabase schema cache.`;
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

  if (trackingNumber !== undefined) { // Check for undefined to allow explicitly setting to null
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
  status: OrderStatus
): Promise<{ data: OrderFromSupabase[] | null; error: Error | null }> {
  console.log(`[orderService.getOrdersByStoreIdAndStatus] Fetching orders for store_id: ${storeId} with status: ${status}`);

  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(commonOrderSelect)
    .eq('store_id', storeId)
    .eq('status', status)
    .order('order_date', { ascending: false });

  if (ordersError) {
    let message = ordersError.message || `Failed to fetch orders with status ${status}.`;
    if (Object.keys(ordersError).length === 0 || !ordersError.message) {
        message = `Failed to fetch orders for store ${storeId} with status ${status}. This often indicates an RLS policy issue or schema cache problem.`;
    }
    console.error(`[orderService.getOrdersByStoreIdAndStatus] Supabase fetch error (status: ${status}):`, message, 'Original Supabase Error:', JSON.stringify(ordersError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = ordersError;
    return { data: null, error: errorToReturn };
  }

  if (!ordersData) {
    console.warn(`[orderService.getOrdersByStoreIdAndStatus] No orders data returned for store ${storeId} with status ${status}, despite no explicit Supabase error.`);
    return { data: [], error: null };
  }

  console.log(`[orderService.getOrdersByStoreIdAndStatus] Fetched orders count (status: ${status}):`, ordersData?.length);
  return { data: ordersData as OrderFromSupabase[] | null, error: null };
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
        message = `Failed to fetch orders for customer ${customerId} in store ${storeId}. This often indicates an RLS policy issue or schema cache problem.`;
    }
    console.error(`[orderService.getOrdersByCustomerAndStore] Supabase fetch error:`, message, 'Original Supabase Error:', JSON.stringify(ordersError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = ordersError;
    return { data: null, error: errorToReturn };
  }

  if (!ordersData) {
    console.warn(`[orderService.getOrdersByCustomerAndStore] No orders data returned for customer ${customerId} in store ${storeId}, despite no explicit Supabase error.`);
    return { data: [], error: null }; // Return empty array if no orders, not an error
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

  // For total revenue, we sum 'total_amount' for orders that are 'Delivered' or 'Shipped'.
  // For active orders, we count orders that are 'Pending' or 'Processing'.
  // This often requires two separate queries or an RPC function for efficiency.
  // Here, we'll do it with client-side processing for simplicity, which is not ideal for large datasets.

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
  if (!storeId) return { data: null, error: new Error("Store ID is required.") };

  // This query sums the quantity of all order items for a given store.
  // It requires joining orders and order_items.
  // Supabase allows aggregate functions like .count() directly, but sum often needs RPC or client-side processing.
  // For simplicity, fetching items and summing client-side.
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('order_items(quantity)')
    .eq('store_id', storeId);

  if (ordersError) {
    console.error(`[orderService.getStoreTotalProductsSold] Error fetching order items for store ${storeId}:`, ordersError.message);
    return { data: null, error: new Error(ordersError.message) };
  }

  if (!orders) {
    return { data: { totalSold: 0 }, error: null };
  }

  let totalSold = 0;
  orders.forEach(order => {
    order.order_items.forEach(item => {
      totalSold += item.quantity || 0;
    });
  });

  console.log(`[orderService.getStoreTotalProductsSold] Total products sold for store ${storeId}: ${totalSold}`);
  return { data: { totalSold }, error: null };
}
