// src/lib/order-mapper.ts

import type { Order as OrderUIType, OrderStatus as OrderStatusUIType } from "@/lib/types";
import type { OrderFromSupabase } from "@/services/orderService";

/**
 * Maps an order object from the Supabase service layer to the UI-friendly OrderUIType.
 * This centralizes the mapping logic.
 * @param order - The order object fetched from Supabase.
 * @returns An object conforming to the OrderUIType interface.
 */
export const mapOrderFromSupabaseToUI = (order: OrderFromSupabase): OrderUIType => {
  return {
    id: order.id,
    storeId: order.store_id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customers?.phone || undefined, // Extract phone from nested customer
    date: new Date(order.order_date).toISOString().split("T")[0],
    total: order.total_amount,
    status: order.status as OrderStatusUIType,
    itemsCount: order.order_items.reduce((sum, item) => sum + item.quantity, 0),
    detailedItems: order.order_items.map(item => ({
      productId: item.product_id || `deleted_${item.id}`,
      name: item.product_name_snapshot,
      quantity: item.quantity,
      price: item.price_per_unit_snapshot,
      image: item.product_image_url_snapshot || "https://placehold.co/50x50.png",
    })),
    shippingAddress: order.shipping_address,
    billingAddress: order.billing_address,
    deliveryTier: order.delivery_tier || undefined,
    paymentMethod: order.payment_method || undefined,
    deliveryCode: order.delivery_code || undefined,
    shippingLatitude: order.shipping_latitude || undefined,
    shippingLongitude: order.shipping_longitude || undefined,
    deliveryType: order.delivery_type || undefined,
    pickupAddress: order.pickup_address || undefined,
    pickupLatitude: order.pickup_latitude || undefined,
    pickupLongitude: order.pickup_longitude || undefined,
    customerSpecification: order.customer_specification || undefined,
    deliveryCost: order.delivery_cost ?? undefined,
    driverId: order.driver_id || undefined,
    notes: order.notes || undefined,
    serviceFees: order.service_fees ?? undefined,
  };
};
