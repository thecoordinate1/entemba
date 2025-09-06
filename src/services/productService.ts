
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
  return { data: productsData as ProductFromSupabase[], count, error: null };
}

export async function getProductById(productId: string): Promise<{ data: ProductFromSupabase | null; error: Error | null }> {
  console.log('[productService.getProductById] Fetching product by ID:', productId);

  const { data: productData, error: productError } = await supabase
    .from('products')
    .select(COMMON_PRODUCT_SELECT)
    .eq('id', productId)
    .single();

  if (productError) {
    console.error('[productService.getProductById] Supabase fetch product error:', productError);
    return { data: null, error: new Error(productError.message || `Failed to fetch product with ID ${productId}.`) };
  }
  
  if (productData && productData.product_images) {
      productData.product_images.sort((a, b) => a.order - b.order);
  }

  console.log('[productService.getProductById] Fetched product:', productData?.id);
  return { data: productData as ProductFromSupabase | null, error: null };
}

export async function createProduct(
  userId: string,
  storeId: string,
  productData: ProductPayload,
  images: { file: File; order: number }[]
): Promise<{ data: ProductFromSupabase | null; error: Error | null }> {
  console.log('[productService.createProduct] Creating product for store_id:', storeId);
  const { data: newProduct, error: createError } = await supabase
    .from('products')
    .insert({
      store_id: storeId,
      ...productData,
    })
    .select(COMMON_PRODUCT_SELECT)
    .single();

  if (createError || !newProduct) {
    console.error('[productService.createProduct] Error creating product record:', createError);
    return { data: null, error: new Error(createError?.message || 'Failed to create product.') };
  }

  if (images.length > 0) {
    console.log(`[productService.createProduct] Uploading ${images.length} images for new product ${newProduct.id}`);
    const imageUploadPromises = images.map(img => uploadProductImage(storeId, newProduct.id, img.file));
    const uploadResults = await Promise.all(imageUploadPromises);

    const imageRecordsToInsert: Omit<ProductImageFromSupabase, 'id' | 'created_at'>[] = [];
    for (let i = 0; i < uploadResults.length; i++) {
      if (uploadResults[i].publicUrl) {
        imageRecordsToInsert.push({
          product_id: newProduct.id,
          image_url: uploadResults[i].publicUrl!,
          order: images[i].order,
        });
      } else {
        console.warn(`[productService.createProduct] Failed to upload image ${i}:`, uploadResults[i].error?.message);
      }
    }

    if (imageRecordsToInsert.length > 0) {
      const { error: imageInsertError } = await supabase.from('product_images').insert(imageRecordsToInsert);
      if (imageInsertError) {
        console.error('[productService.createProduct] Error inserting image records:', imageInsertError);
        // Don't fail the whole operation, but warn the user.
        const productWithError = newProduct as ProductFromSupabase;
        return { data: productWithError, error: new Error(`Product created, but failed to save images: ${imageInsertError.message}`) };
      }
    }
  }

  // Refetch the product with its images
  return getProductById(newProduct.id);
}

export async function updateProduct(
  productId: string,
  userId: string,
  storeId: string,
  productData: ProductPayload,
  imagesToUpdate: { id?: string; file?: File; existingUrl?: string, order: number }[]
): Promise<{ data: ProductFromSupabase | null; error: Error | null }> {
  console.log(`[productService.updateProduct] Updating product ${productId}`);
  
  const { data: updatedProduct, error: updateError } = await supabase
    .from('products')
    .update({ ...productData, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .select(COMMON_PRODUCT_SELECT)
    .single();

  if (updateError || !updatedProduct) {
    console.error(`[productService.updateProduct] Error updating product ${productId}:`, updateError);
    return { data: null, error: new Error(updateError?.message || `Failed to update product.`) };
  }

  const existingImages = updatedProduct.product_images || [];
  const imageUrlsToKeep = imagesToUpdate
    .map(img => img.existingUrl)
    .filter((url): url is string => !!url);
    
  const imagesToDelete = existingImages.filter(img => !imageUrlsToKeep.includes(img.image_url));

  if (imagesToDelete.length > 0) {
    const imageIdsToDelete = imagesToDelete.map(img => img.id);
    const imagePathsToDelete = imagesToDelete
        .map(img => getPathFromStorageUrl(img.image_url, 'product-images'))
        .filter((path): path is string => !!path);
    
    console.log(`[productService.updateProduct] Deleting ${imageIdsToDelete.length} image records and ${imagePathsToDelete.length} files from storage.`);
    
    if (imagePathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage.from('product-images').remove(imagePathsToDelete);
        if (storageError) console.error('[productService.updateProduct] Error deleting files from storage:', storageError.message);
    }

    const { error: dbError } = await supabase.from('product_images').delete().in('id', imageIdsToDelete);
    if (dbError) console.error('[productService.updateProduct] Error deleting image records from DB:', dbError.message);
  }

  const imageUpsertPromises = imagesToUpdate.map(async (img) => {
    if (img.file) { // New file needs upload
      const { publicUrl, error } = await uploadProductImage(storeId, productId, img.file);
      if (error) {
          console.error('[productService.updateProduct] Failed to upload new image:', error.message);
          return null;
      }
      return { product_id: productId, image_url: publicUrl, order: img.order };
    } else if (img.id && img.existingUrl) { // Existing image, maybe hint changed
      return { id: img.id, product_id: productId, image_url: img.existingUrl, order: img.order };
    }
    return null;
  });

  const upsertData = (await Promise.all(imageUpsertPromises)).filter(d => d !== null);

  if (upsertData.length > 0) {
      console.log(`[productService.updateProduct] Upserting ${upsertData.length} image records.`);
      const { error: upsertError } = await supabase.from('product_images').upsert(upsertData, { onConflict: 'id' });
      if (upsertError) {
          console.error('[productService.updateProduct] Error upserting image records:', upsertError.message);
      }
  }

  // Refetch the product to get all latest data in one consistent object
  return getProductById(productId);
}

// UPDATED to perform a soft delete
export async function deleteProduct(
  productId: string,
  userId: string,
  storeId: string,
): Promise<{ error: Error | null }> {
  console.log(`[productService.deleteProduct] Soft deleting product ${productId} from store ${storeId}`);
  
  const { error: updateError } = await supabase
    .from('products')
    .update({ status: 'Archived', updated_at: new Date().toISOString() })
    .eq('id', productId)
    .eq('store_id', storeId);

  if (updateError) {
    console.error(`[productService.deleteProduct] Error soft-deleting product ${productId}:`, updateError);
    return { error: new Error(updateError.message || 'Failed to archive product.') };
  }

  console.log(`[productService.deleteProduct] Product ${productId} successfully archived.`);
  return { error: null };
}

// --- Dashboard / Reports Specific Functions ---

export async function getStoreTopSellingProductsRPC(
  storeId: string,
  limit: number,
  daysPeriod: number | null
): Promise<{ data: TopSellingProductFromRPC[] | null; error: Error | null }> {
  console.log(`[productService.getStoreTopSellingProductsRPC] Fetching for store ${storeId}, limit ${limit}, period ${daysPeriod} days.`);
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required.") };
  }

  const { data, error } = await supabase.rpc('get_top_selling_products', {
    p_store_id: storeId,
    p_limit: limit,
    p_days_period: daysPeriod,
  });

  if (error) {
    console.error('[productService.getStoreTopSellingProductsRPC] Error calling RPC:', JSON.stringify(error, null, 2));
    return { data: null, error: new Error(error.message || 'Failed to fetch top selling products from RPC.') };
  }

  console.log('[productService.getStoreTopSellingProductsRPC] Data from RPC:', data);
  return { data: data as TopSellingProductFromRPC[] | null, error: null };
}

export async function getProductsByIds(
  productIds: string[]
): Promise<{ data: ProductFromSupabase[] | null, error: Error | null }> {
    if (!productIds || productIds.length === 0) {
        return { data: [], error: null };
    }

    const { data, error } = await supabase
        .from('products')
        .select(COMMON_PRODUCT_SELECT)
        .in('id', productIds);

    if (error) {
        console.error(`[productService.getProductsByIds] Error fetching products:`, error);
        return { data: null, error };
    }

    return { data: data as ProductFromSupabase[], error: null };
}
