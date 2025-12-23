
// src/services/orderService.ts
import { createClient } from '@/lib/supabase/client';
import type { OrderStatus } from '@/lib/types';
import type { CustomerFromSupabase } from './customerService';

const supabase = createClient();

export interface OrderItemPayload {
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  price_per_unit_snapshot: number;
  product_image_url_snapshot?: string | null;
}

// This payload is for the NEW create_order_with_snapshots RPC
export interface OrderPayloadForRPC {
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: OrderStatus;
  shipping_address: string;
  billing_address: string;
  delivery_tier?: string | null;
  payment_method?: string | null;
  shipping_latitude?: number | null;
  shipping_longitude?: number | null;
  delivery_type?: 'self_delivery' | 'courier' | null;
  customer_specification?: string | null;
  delivery_cost?: number | null;
  // New fields
  driver_id?: string | null;
  notes?: Record<string, any> | null;
  service_fees?: number | null;
}


export interface OrderItemFromSupabase {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  quantity: number;
  price_per_unit_snapshot: number;
  cost_per_unit_snapshot: number; // Added for profit calculation
  product_image_url_snapshot: string | null;
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
  delivery_tier: string | null;
  payment_method: string | null;
  delivery_code: string | null;
  shipping_latitude: number | null;
  shipping_longitude: number | null;
  delivery_type: 'self_delivery' | 'courier' | null;
  pickup_address: string | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  customer_specification: string | null;
  delivery_cost: number | null;
  // New fields from schema
  driver_id: string | null;
  notes: Record<string, any> | null;
  service_fees: number | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItemFromSupabase[];
  customers: CustomerFromSupabase | null;
}

// Expected structure from the get_monthly_sales_overview RPC function
export interface MonthlySalesDataFromRPC {
  period_start_date: string; // e.g., '2024-01-01'
  total_sales: number;
  order_count: number;
}


const commonOrderSelect = `
  id, store_id, customer_id, customer_name, customer_email, order_date, total_amount, status,
  shipping_address, billing_address, delivery_tier, payment_method, delivery_code,
  shipping_latitude, shipping_longitude, delivery_type, pickup_address, pickup_latitude, pickup_longitude,
  customer_specification, delivery_cost, driver_id, notes, service_fees,
  created_at, updated_at,
  order_items (
    id, order_id, product_id, product_name_snapshot, quantity, price_per_unit_snapshot, cost_per_unit_snapshot,
    product_image_url_snapshot, created_at
  ),
  customers ( * )
`;

function formatOrderResponse(order: any): OrderFromSupabase {
  if (!order) return order;
  return {
    ...order,
    customers: Array.isArray(order.customers) ? order.customers[0] || null : order.customers
  } as OrderFromSupabase;
}

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
  const formattedOrders = ordersData?.map(formatOrderResponse) || [];
  return { data: formattedOrders, count: count, error: null };
}

// UPDATED to use the new RPC function
export async function createOrder(
  storeId: string,
  customerId: string,
  orderData: OrderPayloadForRPC,
  itemsData: OrderItemPayload[]
): Promise<{ data: { id: string } | null; error: Error | null }> {
  console.log('[orderService.createOrder] Calling create_order_with_snapshots RPC for store_id:', storeId);

  const { data, error } = await supabase.rpc('create_order_with_snapshots', {
    p_store_id: storeId,
    p_customer_id: customerId,
    p_order_payload: orderData,
    p_order_items: itemsData,
  });

  if (error) {
    console.error('[orderService.createOrder] Error calling RPC:', error);
    return { data: null, error: new Error(error.message || 'Failed to create order via RPC.') };
  }

  console.log('[orderService.createOrder] Successfully called RPC, new order ID:', data);
  // The RPC returns the new_order_id directly
  return { data: { id: data as string }, error: null };
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
  return { data: formatOrderResponse(orderData), error: null };
}


export async function updateOrderStatus(
  orderId: string,
  storeId: string,
  status: OrderStatus,
  options?: {
    deliveryCode?: string | null;
    deliveryType?: 'self_delivery' | 'courier' | null;
    pickup_address?: string | null;
    pickup_latitude?: number | null;
    pickup_longitude?: number | null;
    verificationCode?: string; // For self-delivery verification
  }
): Promise<{ data: OrderFromSupabase | null; error: Error | null }> {
  console.log(`[orderService.updateOrderStatus] Updating status for order ID: ${orderId} to ${status} for store ID: ${storeId}. Options:`, options);

  // --- Verification Logic ---
  if (status === 'Delivered') {
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('delivery_type, delivery_code')
      .eq('id', orderId)
      .eq('store_id', storeId)
      .single();

    if (fetchError) {
      console.error("Error fetching order for verification:", fetchError);
      return { data: null, error: new Error("Failed to verify order details.") };
    }

    if (currentOrder?.delivery_type === 'self_delivery') {
      if (!options?.verificationCode) {
        return { data: null, error: new Error("Customer verification code is required for delivery.") };
      }
      if (currentOrder.delivery_code !== options.verificationCode) {
        return { data: null, error: new Error("Invalid verification code. Please ask the customer for the correct 6-digit code.") };
      }
    }
  }
  // --------------------------

  const updatePayload: { [key: string]: any } = {
    status: status,
    updated_at: new Date().toISOString(),
  };

  if (options?.deliveryCode !== undefined) updatePayload.delivery_code = options.deliveryCode;
  if (options?.deliveryType !== undefined) updatePayload.delivery_type = options.deliveryType;
  if (options?.pickup_address !== undefined) updatePayload.pickup_address = options.pickup_address;
  if (options?.pickup_latitude !== undefined) updatePayload.pickup_latitude = options.pickup_latitude;
  if (options?.pickup_longitude !== undefined) updatePayload.pickup_longitude = options.pickup_longitude;

  if (status === 'Delivering' || status === 'Delivered') {
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('[orderService.updateOrderStatus] Error fetching order items for stock update:', itemsError);
      return { data: null, error: new Error('Could not fetch order items to update stock.') };
    }

    if (orderItems) {
      for (const item of orderItems) {
        if (item.product_id && item.quantity > 0) {
          const { error: stockUpdateError } = await supabase.rpc('decrement_product_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          });
          if (stockUpdateError) {
            console.error(`[orderService.updateOrderStatus] Error decrementing stock for product ${item.product_id}:`, stockUpdateError);
            // In a real-world scenario, you might want to halt or rollback here
            return { data: null, error: new Error(`Failed to update stock for product ${item.product_id}.`) };
          }
        }
      }
    }
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
  return { data: formatOrderResponse(updatedOrder), error: null };
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
  const formattedOrders = ordersData?.map(formatOrderResponse) || [];
  return { data: formattedOrders, count: count, error: null };
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
  const formattedOrders = ordersData?.map(formatOrderResponse) || [];
  return { data: formattedOrders, error: null };
}

// --- Dashboard Specific Functions ---
export interface StoreOrderStats {
  totalRevenue: number;
  inEscrow: number;
  activeOrdersCount: number;
  productsSoldCount: number;
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
    return { data: { totalRevenue: 0, inEscrow: 0, activeOrdersCount: 0, productsSoldCount: 0 }, error: null };
  }

  let totalRevenue = 0;
  let inEscrow = 0;
  let activeOrdersCount = 0;

  orders.forEach(order => {
    // Total revenue should be calculated from fulfilled orders
    if (['Shipped', 'Delivered'].includes(order.status)) {
      totalRevenue += order.total_amount || 0;
    }
    // Active orders are those that need action - these are considered "in escrow"
    if (['Pending', 'Confirmed', 'Driver Picking Up', 'Delivering'].includes(order.status)) {
      activeOrdersCount++;
      inEscrow += order.total_amount || 0;
    }
  });

  const { data: productsSoldCount, error: productsSoldError } = await getStoreTotalProductsSold(storeId);
  if (productsSoldError) {
    console.error('[orderService.getStoreOrderStats] Error fetching products sold count:', productsSoldError.message);
  }

  console.log(`[orderService.getStoreOrderStats] Stats for store ${storeId}:`, { totalRevenue, inEscrow, activeOrdersCount, productsSoldCount });
  return { data: { totalRevenue, inEscrow, activeOrdersCount, productsSoldCount: productsSoldCount ?? 0 }, error: null };
}


export async function getStoreTotalProductsSold(storeId: string): Promise<{ data: number | null; error: Error | null }> {
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

  const totalSold = typeof data === 'number' ? data : 0;

  console.log(`[orderService.getStoreTotalProductsSold] Total products sold for store ${storeId}: ${totalSold}`);
  return { data: totalSold, error: null };
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

export async function getSelfDeliveryOrdersForStore(
  storeId: string
): Promise<{ data: OrderFromSupabase[] | null; error: Error | null }> {
  console.log(`[orderService.getSelfDeliveryOrdersForStore] Fetching self-delivery orders for store_id: ${storeId}`);

  const deliveryStatuses: OrderStatus[] = ['Confirmed', 'Driver Picking Up', 'Delivering'];

  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(commonOrderSelect)
    .eq('store_id', storeId)
    .eq('delivery_type', 'self_delivery')
    .in('status', deliveryStatuses)
    .order('created_at', { ascending: true }); // Show oldest first for delivery queue

  if (ordersError) {
    let message = ordersError.message || 'Failed to fetch self-delivery orders.';
    console.error('[orderService.getSelfDeliveryOrdersForStore] Supabase fetch error:', message, 'Original Supabase Error:', JSON.stringify(ordersError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = ordersError;
    return { data: null, error: errorToReturn };
  }

  console.log(`[orderService.getSelfDeliveryOrdersForStore] Fetched ${ordersData?.length || 0} self-delivery orders.`);
  const formattedOrders = ordersData?.map(formatOrderResponse) || [];
  return { data: formattedOrders, error: null };
}

export async function getSelfDeliveryOrdersForVendor(
  vendorId: string
): Promise<{ data: OrderFromSupabase[] | null; error: Error | null }> {
  console.log(`[orderService.getSelfDeliveryOrdersForVendor] Fetching self-delivery orders for vendor_id: ${vendorId}`);

  const deliveryStatuses: OrderStatus[] = ['Confirmed', 'Driver Picking Up', 'Delivering'];

  // Use !inner join to filter by vendor_id on the related stores table
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(`${commonOrderSelect}, stores!inner(vendor_id)`)
    .eq('stores.vendor_id', vendorId)
    .eq('delivery_type', 'self_delivery')
    .in('status', deliveryStatuses)
    .order('created_at', { ascending: true });

  if (ordersError) {
    let message = ordersError.message || 'Failed to fetch self-delivery orders for vendor.';
    console.error('[orderService.getSelfDeliveryOrdersForVendor] Supabase fetch error:', message, 'Original Supabase Error:', JSON.stringify(ordersError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = ordersError;
    return { data: null, error: errorToReturn };
  }

  console.log(`[orderService.getSelfDeliveryOrdersForVendor] Fetched ${ordersData?.length || 0} self-delivery orders for vendor.`);
  const formattedOrders = ordersData?.map(formatOrderResponse) || [];
  return { data: formattedOrders, error: null };
}


export async function getConfirmedOrdersByDeliveryTier(
  storeId: string,
  deliveryTier: 'Standard' | 'Economy'
): Promise<{ data: OrderFromSupabase[] | null; error: Error | null }> {
  console.log(`[orderService.getConfirmedOrdersByDeliveryTier] Fetching orders for store_id: ${storeId}, tier: ${deliveryTier}`);

  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(commonOrderSelect)
    .eq('store_id', storeId)
    .eq('delivery_tier', deliveryTier)
    .eq('status', 'Confirmed')
    .order('order_date', { ascending: true }); // Oldest first

  if (ordersError) {
    let message = ordersError.message || `Failed to fetch ${deliveryTier} orders.`;
    console.error(`[orderService.getConfirmedOrdersByDeliveryTier] Supabase fetch error:`, message, 'Original Supabase Error:', JSON.stringify(ordersError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = ordersError;
    return { data: null, error: errorToReturn };
  }

  console.log(`[orderService.getConfirmedOrdersByDeliveryTier] Fetched ${ordersData?.length || 0} ${deliveryTier} orders.`);
  const formattedOrders = ordersData?.map(formatOrderResponse) || [];
  return { data: formattedOrders, error: null };
}
