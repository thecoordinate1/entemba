
// src/services/productService.ts
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const supabase = createClient();

// Helper to extract path from Supabase Storage URL
function getPathFromStorageUrl(url: string, bucketName: string): string | null {
  try {
    const urlObj = new URL(url);
    const publicPathPrefix = `/storage/v1/object/public/${bucketName}/`;
    const signedPathPrefix = `/storage/v1/object/sign/${bucketName}/`; 

    let pathWithinBucket: string | undefined;

    if (urlObj.pathname.startsWith(publicPathPrefix)) {
      pathWithinBucket = urlObj.pathname.substring(publicPathPrefix.length);
    } else if (urlObj.pathname.startsWith(signedPathPrefix)) {
      pathWithinBucket = urlObj.pathname.substring(signedPathPrefix.length).split('?')[0];
    } else {
      console.warn(`[productService.getPathFromStorageUrl] URL does not match expected prefix for bucket ${bucketName}: ${url}`);
      return null;
    }
    return pathWithinBucket;

  } catch (e) {
    console.error(`[productService.getPathFromStorageUrl] Invalid URL: ${url}`, e);
    return null;
  }
}


export interface ProductImagePayload { 
  image_url: string;
  data_ai_hint?: string | null;
  order: number;
}

export interface ProductPayload {
  name: string;
  category: string;
  price: number;
  order_price?: number | null;
  stock: number;
  status: 'Active' | 'Draft' | 'Archived';
  description?: string | null;
  full_description: string; 
  sku?: string | null;
  tags?: string[] | null;
  weight_kg?: number | null;
  dimensions_cm?: { length: number; width: number; height: number } | null;
}

export interface ProductImageFromSupabase {
  id: string;
  product_id: string;
  image_url: string;
  data_ai_hint: string | null;
  order: number;
  created_at: string;
}

export interface ProductFromSupabase {
  id: string;
  store_id: string;
  name: string;
  category: string;
  price: number;
  order_price?: number | null;
  stock: number;
  status: 'Active' | 'Draft' | 'Archived';
  description?: string | null;
  full_description: string; 
  sku?: string | null;
  tags?: string[] | null;
  weight_kg?: number | null;
  dimensions_cm?: { length: number; width: number; height: number } | null;
  created_at: string;
  updated_at: string;
  product_images: ProductImageFromSupabase[];
}

// Interface for the data returned by the get_top_selling_products RPC
export interface TopSellingProductFromRPC {
  product_id: string;
  product_name: string;
  product_category: string;
  primary_image_url: string | null;
  primary_image_data_ai_hint: string | null;
  total_quantity_sold: number; // Ensure this is part of the interface
  total_revenue_generated?: number; 
}


// Helper to upload a single product image
async function uploadProductImage(
  storeId: string,
  productId: string,
  imageFile: File
): Promise<{ publicUrl: string | null; error: Error | null }> {
  const pathWithinBucket = `${storeId}/${productId}/${Date.now()}_${imageFile.name}`;
  
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const currentAuthUserId = currentUser?.id;
  console.log(`[productService.uploadProductImage] Attempting to upload. StoreID: ${storeId}, ProductID: ${productId}, Path: ${pathWithinBucket}, AuthUserID: ${currentAuthUserId}`);

  const { error: uploadError } = await supabase.storage
    .from('product-images') 
    .upload(pathWithinBucket, imageFile, {
      cacheControl: '3600',
      upsert: true, 
    });

  if (uploadError) {
    console.error('[productService.uploadProductImage] Raw Supabase upload error object:', JSON.stringify(uploadError, null, 2));
    const message = uploadError.message || 'Failed to upload product image. Check RLS policies on the "product-images" bucket.';
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = uploadError;
    return { publicUrl: null, error: errorToReturn };
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(pathWithinBucket);
  if (!data?.publicUrl) {
    console.error('[productService.uploadProductImage] Failed to get public URL for image after upload.');
    return { publicUrl: null, error: new Error('Failed to get public URL for image after upload.') };
  }
  console.log(`[productService.uploadProductImage] Successfully uploaded. Public URL: ${data.publicUrl}`);
  return { publicUrl: data.publicUrl, error: null };
}

const COMMON_PRODUCT_SELECT = 'id, store_id, name, category, price, order_price, stock, status, description, full_description, sku, tags, weight_kg, dimensions_cm, created_at, updated_at, product_images(*)';

export async function getProductsByStoreId(
  storeId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: ProductFromSupabase[] | null; count: number | null; error: Error | null }> {
  console.log(`[productService.getProductsByStoreId] Fetching products for store_id: ${storeId}, page: ${page}, limit: ${limit}`);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: productsData, error: productsError, count } = await supabase
    .from('products')
    .select(COMMON_PRODUCT_SELECT, { count: 'exact' }) 
    .eq('store_id', storeId)
    .neq('status', 'Archived') // Exclude soft-deleted products
    .order('created_at', { ascending: false })
    .range(from, to);

  if (productsError) {
    console.error('[productService.getProductsByStoreId] Supabase fetch products error:', productsError);
    return { data: null, count: null, error: new Error(productsError.message || 'Failed to fetch products.') };
  }

  if (productsData) {
    productsData.forEach(p => {
        if (p.product_images) {
            p.product_images.sort((a,b) => a.order - b.order);
        }
    });
  }

  console.log('[productService.getProductsByStoreId] Fetched products count:', productsData?.length, 'Total count:', count);
  return { data: productsData as ProductFromSupa