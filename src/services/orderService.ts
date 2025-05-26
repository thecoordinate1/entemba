
// src/services/orderService.ts
import { createClient } from '@/lib/supabase/client';

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
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
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
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
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
    if (Object.keys(ordersError).length === 0 || ordersError.message === '') {
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
    .select(commonOrderSelect.replace('order_items (', 'order_items!left (')) // Use left join for items if none initially
    .single();

  if (createOrderError || !newOrder) {
    let message = 'Failed to create order record.';
    let details: any = createOrderError;
    if (createOrderError) {
        message = createOrderError.message || message;
        if (Object.keys(createOrderError).length === 0 || createOrderError.message === '') {
             message = `Failed to create order. This often indicates an RLS policy issue on the 'orders' table preventing the insert or read-back.`;
        }
        console.error('[orderService.createOrder] Error creating order record:', message, 'Original Supabase Error:', JSON.stringify(createOrderError, null, 2));
    } else {
        message = 'Failed to retrieve order after insert. This strongly suggests an RLS SELECT policy on the `orders` table is missing or incorrect.';
        console.error('[orderService.createOrder] Error: newOrder is null after insert.');
    }
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
       if (Object.keys(itemsError).length === 0 || itemsError.message === '') {
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
    if (orderError.code === 'PGRST116') {
        message = 'Order not found or access denied for this store.';
    } else if (Object.keys(orderError).length === 0 || orderError.message === '') {
        message = `Failed to fetch order ${orderId}. This often indicates an RLS policy issue on 'orders' or 'order_items', or a schema cache problem. Please verify RLS policies and try refreshing the Supabase schema cache.`;
    }
    console.error('[orderService.getOrderById] Supabase fetch order error:', message, 'Original Supabase Error:', JSON.stringify(orderError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = orderError;
    return { data: null, error: errorToReturn };
  }

  if (!orderData) {
    console.warn(`[orderService.getOrderById] No order data returned for order ${orderId} and store ${storeId}, despite no explicit Supabase error. This is highly indicative of an RLS SELECT policy issue.`);
    return { data: null, error: new Error('Order not found or access denied. Verify RLS SELECT policies and ensure the order exists and belongs to the store.') };
  }

  console.log('[orderService.getOrderById] Fetched order:', orderData?.id);
  return { data: orderData as OrderFromSupabase | null, error: null };
}


export async function updateOrderStatus(
  orderId: string,
  storeId: string,
  status: OrderFromSupabase['status'],
  trackingNumber?: string | null
): Promise<{ data: OrderFromSupabase | null; error: Error | null }> {
  console.log(`[orderService.updateOrderStatus] Updating status for order ID: ${orderId} to ${status} for store ID: ${storeId}. Tracking: ${trackingNumber}`);

  const updatePayload: { status: OrderFromSupabase['status'], updated_at: string, tracking_number?: string | null } = {
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
        message = updateError.message || message;
        if (Object.keys(updateError).length === 0 || updateError.message === '') {
            message = `Failed to update order ${orderId}. This often indicates an RLS policy issue on 'orders' preventing the update or read-back.`;
        }
        console.error('[orderService.updateOrderStatus] Error updating order status:', message, 'Original Supabase Error:', JSON.stringify(updateError, null, 2));
    } else {
        message = 'Failed to retrieve order after status update. This strongly suggests an RLS SELECT policy on the `orders` table is missing or incorrect.';
        console.error('[orderService.updateOrderStatus] Error: updatedOrder is null after status update.');
    }
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = updateError;
    return { data: null, error: errorToReturn };
  }

  console.log(`[orderService.updateOrderStatus] Successfully updated status for order ID: ${orderId}`);
  return { data: updatedOrder as OrderFromSupabase, error: null };
}

export async function getOrdersByStoreIdAndStatus(
  storeId: string,
  status: OrderFromSupabase['status']
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
    if (Object.keys(ordersError).length === 0 || ordersError.message === '') {
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
