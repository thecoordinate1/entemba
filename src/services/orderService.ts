
// src/services/orderService.ts
import { createClient } from '@/lib/supabase/client';
import type { ProductFromSupabase } from './productService'; // Assuming product images might be needed

const supabase = createClient();

// For creating individual order items
export interface OrderItemPayload {
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  price_per_unit_snapshot: number;
  product_image_url_snapshot?: string | null; // Optional
  data_ai_hint_snapshot?: string | null; // Optional
}

// For creating a new order
export interface OrderPayload {
  store_id: string;
  customer_id?: string | null; // Optional link to a customer record
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shipping_address: string;
  billing_address: string;
  shipping_method?: string | null;
  payment_method?: string | null;
  tracking_number?: string | null;
}

// For representing order items fetched from Supabase
export interface OrderItemFromSupabase {
  id: string;
  order_id: string;
  product_id: string | null; // Can be null if product was deleted
  product_name_snapshot: string;
  quantity: number;
  price_per_unit_snapshot: number;
  product_image_url_snapshot: string | null;
  data_ai_hint_snapshot: string | null;
  created_at: string;
  // Optionally, include product details if joining:
  // products?: Pick<ProductFromSupabase, 'name' | 'images' | 'dataAiHints'>;
}

// For representing orders fetched from Supabase
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
  created_at: string;
  updated_at: string;
  order_items: OrderItemFromSupabase[]; // Nested order items
}

export async function getOrdersByStoreId(storeId: string): Promise<{ data: OrderFromSupabase[] | null; error: Error | null }> {
  console.log('[orderService.getOrdersByStoreId] Fetching orders for store_id:', storeId);

  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id, store_id, customer_id, customer_name, customer_email, order_date, total_amount, status, 
      shipping_address, billing_address, shipping_method, payment_method, tracking_number, 
      created_at, updated_at,
      order_items (
        id, order_id, product_id, product_name_snapshot, quantity, price_per_unit_snapshot, 
        product_image_url_snapshot, data_ai_hint_snapshot, created_at
      )
    `)
    .eq('store_id', storeId)
    .order('order_date', { ascending: false });

  if (ordersError) {
    console.error('[orderService.getOrdersByStoreId] Supabase fetch orders error:', ordersError);
    return { data: null, error: new Error(ordersError.message || 'Failed to fetch orders.') };
  }

  console.log('[orderService.getOrdersByStoreId] Fetched orders count:', ordersData?.length);
  return { data: ordersData as OrderFromSupabase[] | null, error: null };
}


export async function createOrder(
  orderData: OrderPayload,
  itemsData: OrderItemPayload[]
): Promise<{ data: OrderFromSupabase | null; error: Error | null }> {
  console.log('[orderService.createOrder] Attempting to create order for store_id:', orderData.store_id);

  // Supabase doesn't have true transactions for multiple table inserts via JS client in one go.
  // We insert the order first, then the items. If item insertion fails, the order remains.
  // For true atomicity, a database function (RPC) would be needed.

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
      // order_date is defaulted by DB
    })
    .select(`
      id, store_id, customer_id, customer_name, customer_email, order_date, total_amount, status, 
      shipping_address, billing_address, shipping_method, payment_method, tracking_number, 
      created_at, updated_at
    `) // Exclude order_items for now, will add them separately
    .single();

  if (createOrderError || !newOrder) {
    let message = 'Failed to create order record.';
    if (createOrderError) {
        message = createOrderError.message || message;
        console.error('[orderService.createOrder] Error creating order record:', JSON.stringify(createOrderError, null, 2));
    } else {
        message = 'Failed to retrieve order after insert. Check RLS SELECT policies on orders table.';
        console.error('[orderService.createOrder] Error: newOrder is null after insert.');
    }
    return { data: null, error: new Error(message) };
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
      console.error('[orderService.createOrder] Error inserting order items. Order created but items failed:', JSON.stringify(itemsError, null, 2));
      // Order is created, but items failed. Decide on error handling strategy.
      // For now, return the created order but with an error indicating item failure.
      const orderWithError = { ...newOrder, order_items: [] } as OrderFromSupabase;
      return { 
        data: orderWithError, 
        error: new Error(`Order ${newOrder.id} created, but failed to insert order items: ${itemsError.message}`) 
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
    .select(`
      id, store_id, customer_id, customer_name, customer_email, order_date, total_amount, status, 
      shipping_address, billing_address, shipping_method, payment_method, tracking_number, 
      created_at, updated_at,
      order_items (
        id, order_id, product_id, product_name_snapshot, quantity, price_per_unit_snapshot, 
        product_image_url_snapshot, data_ai_hint_snapshot, created_at
      )
    `)
    .eq('id', orderId)
    .eq('store_id', storeId) // Ensure the order belongs to the specified store
    .single();

  if (orderError) {
    let message = orderError.message || 'Failed to fetch order.';
    if (orderError.code === 'PGRST116') { // Not found
        message = 'Order not found or access denied for this store.';
    }
    console.error('[orderService.getOrderById] Supabase fetch order error:', orderError);
    return { data: null, error: new Error(message) };
  }

  console.log('[orderService.getOrderById] Fetched order:', orderData?.id);
  return { data: orderData as OrderFromSupabase | null, error: null };
}


export async function updateOrderStatus(
  orderId: string, 
  storeId: string, // For RLS check or ensuring user owns the store associated with order
  status: OrderFromSupabase['status']
): Promise<{ data: OrderFromSupabase | null; error: Error | null }> {
  console.log(`[orderService.updateOrderStatus] Updating status for order ID: ${orderId} to ${status} for store ID: ${storeId}`);

  // First, verify the order belongs to the store (implicit if RLS is correctly set on 'orders' table)
  // Or, perform an explicit check if needed, though RLS is preferred.

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status: status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('store_id', storeId) // Ensure update happens only if store_id matches
    .select(`
      id, store_id, customer_id, customer_name, customer_email, order_date, total_amount, status, 
      shipping_address, billing_address, shipping_method, payment_method, tracking_number, 
      created_at, updated_at,
      order_items (
        id, order_id, product_id, product_name_snapshot, quantity, price_per_unit_snapshot, 
        product_image_url_snapshot, data_ai_hint_snapshot, created_at
      )
    `)
    .single();

  if (updateError || !updatedOrder) {
    let message = 'Failed to update order status.';
    if (updateError) {
        message = updateError.message || message;
        console.error('[orderService.updateOrderStatus] Error updating order status:', JSON.stringify(updateError, null, 2));
    } else {
        message = 'Failed to retrieve order after status update. Check RLS SELECT policies.';
        console.error('[orderService.updateOrderStatus] Error: updatedOrder is null after status update.');
    }
    return { data: null, error: new Error(message) };
  }
  
  console.log(`[orderService.updateOrderStatus] Successfully updated status for order ID: ${orderId}`);
  return { data: updatedOrder as OrderFromSupabase, error: null };
}

// Future functions:
// - deleteOrder (consider implications - usually orders are marked 'Cancelled' or archived, not hard deleted)
