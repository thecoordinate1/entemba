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
  attributes?: Record<string, any> | null;
  is_dropshippable?: boolean;
  supplier_product_id?: string | null;
  supplier_price?: number | null;
}

export interface ProductImageFromSupabase {
  id: string;
  product_id: string;
  image_url: string;
  order: number;
  created_at: string;
}

export interface ProductVariantFromSupabase {
  id: string;
  product_id: string;
  price: number;
  stock: number;
  sku: string | null;
  is_default: boolean;
}

export interface ProductFromSupabase {
  id: string;
  store_id: string;
  name: string;
  category: string;
  price: number; // This will now represent the base/default price
  order_price?: number | null;
  stock: number; // This will now be an aggregation of variant stocks
  status: 'Active' | 'Draft' | 'Archived';
  description?: string | null;
  full_description: string;
  sku?: string | null;
  tags?: string[] | null;
  weight_kg?: number | null;
  dimensions_cm?: { length: number; width: number; height: number } | null;
  attributes?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  product_images: ProductImageFromSupabase[];
  product_variants?: ProductVariantFromSupabase[];

  is_dropshippable?: boolean;
  supplier_product_id?: string | null;
  supplier_price?: number | null;
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

const COMMON_PRODUCT_SELECT = `
  id, store_id, name, category, price, order_price, stock, status, description, full_description, sku, tags, weight_kg, dimensions_cm, attributes, created_at, updated_at, is_dropshippable, supplier_product_id, supplier_price,
  product_images(*)
`;

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
        p.product_images.sort((a, b) => a.order - b.order);
      }
    });
  }

  console.log('[productService.getProductsByStoreId] Fetched products count:', productsData?.length, 'Total count:', count);
  return { data: productsData as unknown as ProductFromSupabase[], count, error: null };
}

export async function getProductById(productId: string): Promise<{ data: ProductFromSupabase | null; error: Error | null }> {
  console.log('[productService.getProductById] Fetching product by ID:', productId);

  if (!productId) {
    return { data: null, error: new Error("Product ID is required") };
  }

  const { data: productData, error: productError } = await supabase
    .from('products')
    .select(COMMON_PRODUCT_SELECT)
    .eq('id', productId)
    .single();

  if (productError) {
    console.error(`[productService.getProductById] Supabase fetch product error for ID ${productId}:`, JSON.stringify(productError, null, 2));
    const msg = productError.message || (productError.code ? `Supabase Error Code: ${productError.code}` : `Unknown error fetching product with ID ${productId}`);
    return { data: null, error: new Error(msg) };
  }

  if (productData) {
    if (productData.product_images) {
      productData.product_images.sort((a, b) => a.order - b.order);
    }
  }


  console.log('[productService.getProductById] Fetched product:', productData?.id);
  return { data: productData as unknown as ProductFromSupabase | null, error: null };
}

export async function createProduct(
  userId: string,
  storeId: string,
  productData: ProductPayload,
  images: { file: File; order: number }[]
): Promise<{ data: ProductFromSupabase | null; error: Error | null }> {
  console.log('[productService.createProduct] Creating product for store_id:', storeId);
  const { order_price, ...productDataForDb } = productData;
  const { data: newProduct, error: createError } = await supabase
    .from('products')
    .insert({
      store_id: storeId,
      ...productDataForDb,
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

  const { order_price, ...productDataForDb } = productData;

  const { data: updatedProduct, error: updateError } = await supabase
    .from('products')
    .update({ ...productDataForDb, updated_at: new Date().toISOString() })
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

  return { data: data as unknown as ProductFromSupabase[], error: null };
}



// --- Market Service ---

export async function getDropshippableProducts(currentUserStoreId?: string): Promise<{ data: ProductFromSupabase[] | null, error: Error | null }> {
  let query = supabase
    .from('products')
    .select(`
      *,
      product_images(*),
      store:stores(name, logo_url)
    `)
    .eq('is_dropshippable', true)
    .eq('status', 'Active');

  if (currentUserStoreId) {
    query = query.neq('store_id', currentUserStoreId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[productService.getDropshippableProducts] Error:", error);
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as unknown as ProductFromSupabase[], error: null };
}

export async function getMarketProductById(productId: string): Promise<{ data: ProductFromSupabase | null, error: Error | null }> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images(*),
      store:stores(name, logo_url)
    `)
    .eq('id', productId)
    .single();

  if (error) {
    console.error(`[productService.getMarketProductById] Error fetching product ${productId}:`, error);
    return { data: null, error: new Error(error.message) };
  }

  // Sort images if present
  if (data && data.product_images) {
    data.product_images.sort((a: any, b: any) => a.order - b.order);
  }

  return { data: data as unknown as ProductFromSupabase, error: null };
}


// --- Import Logic ---

export async function importDropshipProduct(
  vendorId: string,
  storeId: string,
  supplierProductId: string
): Promise<{ data: ProductFromSupabase | null, error: Error | null }> {
  console.log(`[productService.importDropshipProduct] Importing product ${supplierProductId} for store ${storeId}`);

  // 1. Fetch original product with all nested variant info
  const { data: originalProduct, error: fetchError } = await supabase
    .from('products')
    .select(`
            *,
            product_images(*)
        `)
    .eq('id', supplierProductId)
    .single();

  if (fetchError || !originalProduct) {
    return { data: null, error: new Error("Original product not found.") };
  }

  // 2. Prepare cloned data
  const wholesalePrice = originalProduct.supplier_price || originalProduct.price;
  const taxMargin = 1.2;
  const newPrice = wholesalePrice * taxMargin;

  const productData: ProductPayload = {
    name: originalProduct.name,
    category: originalProduct.category,
    price: newPrice,
    order_price: wholesalePrice,
    stock: originalProduct.stock,
    status: 'Draft',
    description: originalProduct.description,
    full_description: originalProduct.full_description,
    sku: originalProduct.sku, // Keep SKU or Append something? Usually keep for tracking.
    tags: originalProduct.tags,
    weight_kg: originalProduct.weight_kg,
    dimensions_cm: originalProduct.dimensions_cm,
    attributes: originalProduct.attributes,
    is_dropshippable: false,
    supplier_product_id: originalProduct.id,
    supplier_price: originalProduct.price
  };

  // 3. Create the product
  const { data: newProduct, error: createError } = await createProduct(vendorId, storeId, productData, []);

  if (createError || !newProduct) {
    return { data: null, error: createError };
  }

  // 4. Handle Images - Reuse URLs
  if (originalProduct.product_images && originalProduct.product_images.length > 0) {
    const imagesToInsert = originalProduct.product_images.map((img: any) => ({
      product_id: newProduct.id,
      image_url: img.image_url,
      order: img.order
    }));

    const { error: imgError } = await supabase.from('product_images').insert(imagesToInsert);
    if (imgError) {
      console.warn("Failed to copy images for imported product", imgError);
    }
  }

  // 5. Handle Variants - Deep Copy


  return getProductById(newProduct.id);
}

export interface InventoryStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalMarketValue: number;
}

export async function getStoreInventoryStats(storeId: string): Promise<{ data: InventoryStats | null; error: Error | null }> {
  console.log(`[productService.getStoreInventoryStats] Fetching inventory stats for store ${storeId}`);

  // Fetch all products for the store to calculate stats
  // Note: For very large stores, we might want to do this via RPC or improved separate queries
  const { data, error } = await supabase
    .from('products')
    .select('id, status, stock, price, product_variants(stock, price)')
    .eq('store_id', storeId)
    .neq('status', 'Archived');

  if (error) {
    console.error(`[productService.getStoreInventoryStats] Error:`, error);
    return { data: null, error: new Error(error.message) };
  }

  const stats: InventoryStats = {
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalMarketValue: 0,
  };

  if (data) {
    stats.totalProducts = data.length;

    data.forEach(p => {
      if (p.status === 'Active') stats.activeProducts++;

      // Calculate compiled stock/price including variants if any
      let stock = p.stock;
      let price = p.price;

      if (p.product_variants && p.product_variants.length > 0) {
        // If variants exist, stock is sum of variants
        stock = p.product_variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
        // Price is tricky with variants, maybe take average or lowest? 
        // For valuation, ideally we sum (variant_stock * variant_price)
        // For simple valuation here, let's do variant level calculation
        const variantValuation = p.product_variants.reduce((sum: number, v: any) => sum + ((v.stock || 0) * (v.price || 0)), 0);
        stats.totalMarketValue += variantValuation;
      } else {
        // Simple product
        stats.totalMarketValue += (stock * price);
      }

      if (stock < 10) stats.lowStockProducts++;
    });
  }

  return { data: stats, error: null };
}
