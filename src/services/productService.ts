
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
  return { data: productsData as ProductFromSupabase[] | null, count: count, error: null };
}


export async function createProduct(
  userId: string, 
  storeId: string,
  productData: ProductPayload, 
  imageFilesWithHints: { file: File; hint: string; order: number }[]
): Promise<{ data: ProductFromSupabase | null; error: Error | null }> {
  console.log(`[productService.createProduct] Attempting for store ID: ${storeId}`, { productData, imageCount: imageFilesWithHints.length });

  const productInsertData = {
    store_id: storeId,
    name: productData.name,
    category: productData.category,
    price: productData.price,
    order_price: productData.order_price,
    stock: productData.stock,
    status: productData.status,
    description: productData.description,
    full_description: productData.full_description,
    sku: productData.sku,
    tags: productData.tags,
    weight_kg: productData.weight_kg,
    dimensions_cm: productData.dimensions_cm,
  };

  const { data: newProduct, error: createProductError } = await supabase
    .from('products')
    .insert(productInsertData)
    .select(COMMON_PRODUCT_SELECT.replace('product_images(*)', 'product_images!left(*)')) // !left for initial insert
    .single();

  if (createProductError || !newProduct) {
    let message = 'Failed to create product record or retrieve it.';
    let details: any = createProductError;
    if (createProductError) {
        if (createProductError.message && typeof createProductError.message === 'string' && createProductError.message.trim() !== '') {
            message = createProductError.message;
        } else if (Object.keys(createProductError).length === 0 && !createProductError.message) { 
            message = `Product creation failed (empty error object). This likely indicates an RLS policy issue on the 'products' table preventing the operation or read-back. Or, a schema mismatch (e.g. column name). Supabase Error: ${JSON.stringify(createProductError)}`;
            details = { reason: "RLS or data constraint/schema issue, empty error object from Supabase", supabaseError: createProductError };
        } else {
            message = `Supabase error during product insert. Details: ${JSON.stringify(createProductError)}`;
        }
    } else { 
        message = 'Failed to retrieve product after insert. This strongly suggests an RLS SELECT policy on the `products` table is missing or incorrect.';
        details = { reason: "Failed to retrieve after insert, likely RLS SELECT policy missing/incorrect" };
    }
    console.error('[productService.createProduct] Error creating product record:', message, "Original Supabase Error (if any):", JSON.stringify(createProductError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = details;
    return { data: null, error: errorToReturn };
  }

  const uploadedImages: ProductImageFromSupabase[] = [];
  if (imageFilesWithHints && imageFilesWithHints.length > 0) {
    for (let i = 0; i < imageFilesWithHints.length; i++) {
      const { file, hint, order } = imageFilesWithHints[i];
      const { publicUrl, error: uploadError } = await uploadProductImage(storeId, newProduct.id, file);
      if (uploadError || !publicUrl) {
        console.warn(`[productService.createProduct] Failed to upload image ${i + 1}:`, uploadError?.message);
        continue;
      }
      const { data: newDbImage, error: dbImageError } = await supabase
        .from('product_images')
        .insert({
          product_id: newProduct.id,
          image_url: publicUrl,
          data_ai_hint: hint,
          order: order,
        })
        .select('*')
        .single();
      
      if (dbImageError || !newDbImage) {
        console.warn(`[productService.createProduct] Failed to save image ${i + 1} record to DB:`, dbImageError?.message);
      } else {
        uploadedImages.push(newDbImage as ProductImageFromSupabase);
      }
    }
  }
  
  const finalProductData: ProductFromSupabase = {
    ...newProduct,
    product_images: uploadedImages.sort((a, b) => a.order - b.order),
  };

  console.log('[productService.createProduct] Successfully created product:', finalProductData.id);
  return { data: finalProductData, error: null };
}


export async function updateProduct(
  productId: string,
  userId: string, 
  storeId: string, 
  productData: ProductPayload, 
  imagesToSet: { file?: File; hint: string; existingUrl?: string; id?: string; order: number }[] 
): Promise<{ data: ProductFromSupabase | null; error: Error | null }> {
  console.log(`[productService.updateProduct] Updating product ID: ${productId} for store ID: ${storeId}`);

  const productUpdateData = {
    name: productData.name,
    category: productData.category,
    price: productData.price,
    order_price: productData.order_price,
    stock: productData.stock,
    status: productData.status,
    description: productData.description,
    full_description: productData.full_description,
    sku: productData.sku,
    tags: productData.tags,
    weight_kg: productData.weight_kg,
    dimensions_cm: productData.dimensions_cm,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedCoreProduct, error: coreUpdateError } = await supabase
    .from('products')
    .update(productUpdateData)
    .eq('id', productId)
    .eq('store_id', storeId) 
    .select(COMMON_PRODUCT_SELECT.replace('product_images(*)', 'product_images!left(*)')) 
    .single();

  if (coreUpdateError || !updatedCoreProduct) {
    let message = 'Failed to update product details.';
    if (coreUpdateError) {
        message = coreUpdateError.message || message;
        console.error('[productService.updateProduct] Error updating core product details:', JSON.stringify(coreUpdateError, null, 2));
    } else {
        console.error('[productService.updateProduct] Error: updatedCoreProduct is null after update. Check RLS SELECT policies on products table.');
         message = 'Failed to retrieve product after update. Check RLS SELECT policies on products table.';
    }
    return { data: null, error: new Error(message) };
  }
  
  const { data: oldDbImages, error: fetchOldImagesError } = await supabase
    .from('product_images')
    .select('id, image_url')
    .eq('product_id', productId);

  if (fetchOldImagesError) {
    console.warn('[productService.updateProduct] Error fetching old images for deletion:', fetchOldImagesError.message);
  }
  
  if (oldDbImages && oldDbImages.length > 0) {
    const oldImagePaths = oldDbImages
      .map(img => getPathFromStorageUrl(img.image_url, 'product-images'))
      .filter(path => path !== null) as string[];
    
    if (oldImagePaths.length > 0) {
      console.log('[productService.updateProduct] Deleting old images from storage:', oldImagePaths);
      const { error: storageDeleteError } = await supabase.storage.from('product-images').remove(oldImagePaths);
      if (storageDeleteError) {
        console.warn('[productService.updateProduct] Error deleting old images from storage:', storageDeleteError.message);
      }
    }
  }
  
  const { error: deleteOldDbImagesError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId);

  if (deleteOldDbImagesError) {
    console.warn('[productService.updateProduct] Error deleting old image records from DB:', deleteOldDbImagesError.message);
  }
    
  const newProductImageRecords: ProductImageFromSupabase[] = [];
  for (const imgData of imagesToSet) {
    let imageUrl = imgData.existingUrl; 

    if (imgData.file) { 
      const { publicUrl, error: uploadError } = await uploadProductImage(storeId, productId, imgData.file);
      if (uploadError || !publicUrl) {
        console.warn(`[productService.updateProduct] Failed to upload new image for order ${imgData.order}:`, uploadError?.message);
        if (!imgData.existingUrl) continue; 
        imageUrl = imgData.existingUrl; 
      } else {
        imageUrl = publicUrl; 
      }
    }

    if (imageUrl) { 
      const { data: insertedImage, error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: imageUrl,
          data_ai_hint: imgData.hint,
          order: imgData.order,
        })
        .select('*')
        .single();
      
      if (insertError || !insertedImage) {
        console.warn(`[productService.updateProduct] Failed to insert image record for URL ${imageUrl}:`, insertError?.message);
      } else {
        newProductImageRecords.push(insertedImage as ProductImageFromSupabase);
      }
    }
  }
  
  const finalProductData: ProductFromSupabase = {
    ...updatedCoreProduct,
    product_images: newProductImageRecords.sort((a,b) => a.order - b.order),
  };

  console.log(`[productService.updateProduct] Successfully updated product ID: ${productId}`);
  return { data: finalProductData, error: null };
}


export async function deleteProduct(
  productId: string,
  userId: string, 
  storeId: string 
): Promise<{ error: Error | null }> {
  console.log(`[productService.deleteProduct] Attempting to delete product ID: ${productId} from store ID: ${storeId}`);

  const { data: images, error: fetchImagesError } = await supabase
    .from('product_images')
    .select('image_url')
    .eq('product_id', productId);

  if (fetchImagesError) {
    console.warn('[productService.deleteProduct] Error fetching product images for deletion:', fetchImagesError.message);
  }

  if (images && images.length > 0) {
    const imagePaths = images
      .map(img => getPathFromStorageUrl(img.image_url, 'product-images'))
      .filter(path => path !== null) as string[]; 
    
    if (imagePaths.length > 0) {
      console.log('[productService.deleteProduct] Deleting images from storage:', imagePaths);
      const { error: storageDeleteError } = await supabase.storage.from('product-images').remove(imagePaths);
      if (storageDeleteError) {
        console.warn('[productService.deleteProduct] Error deleting images from storage:', storageDeleteError.message);
      }
    }
  }

  const { error: deleteProductError } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('store_id', storeId); 

  if (deleteProductError) {
    console.error('[productService.deleteProduct] Error deleting product from database:', JSON.stringify(deleteProductError, null, 2));
    return { error: new Error(deleteProductError.message || 'Failed to delete product. Check RLS.') };
  }

  console.log(`[productService.deleteProduct] Successfully deleted product ID: ${productId}`);
  return { error: null };
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
    let message = productError.message || 'Failed to fetch product.';
    if (productError.code === 'PGRST116') { 
        message = 'Product not found or access denied.';
    }
    return { data: null, error: new Error(message) };
  }
  
  if (productData && productData.product_images) {
    productData.product_images.sort((a: any, b: any) => (a.order as number) - (b.order as number));
  }

  console.log('[productService.getProductById] Fetched product:', productData?.id);
  return { data: productData as ProductFromSupabase | null, error: null };
}

// --- Dashboard Specific Functions ---
export async function getStoreProductsSimple(
  storeId: string,
  limit: number = 3,
  orderBy: keyof ProductFromSupabase = 'created_at', 
  ascending: boolean = false
): Promise<{ data: ProductFromSupabase[] | null; error: Error | null }> {
  console.log(`[productService.getStoreProductsSimple] Fetching ${limit} products for store ${storeId}, ordered by ${String(orderBy)}`);
  if (!storeId) return { data: null, error: new Error("Store ID is required.") };

  const { data, error } = await supabase
    .from('products')
    .select(COMMON_PRODUCT_SELECT)
    .eq('store_id', storeId)
    .order(String(orderBy), { ascending: ascending }) 
    .limit(limit);

  if (error) {
    console.error(`[productService.getStoreProductsSimple] Error fetching products:`, error.message);
    return { data: null, error: new Error(error.message) };
  }
   if (data) {
    data.forEach(p => {
        if (p.product_images) {
            p.product_images.sort((a,b) => a.order - b.order);
        }
    });
  }
  return { data, error: null };
}

export async function getStoreTopSellingProductsRPC(
  storeId: string,
  limit: number,
  daysPeriod?: number 
): Promise<{ data: TopSellingProductFromRPC[] | null; error: Error | null }> {
  console.log(`[productService.getStoreTopSellingProductsRPC] Fetching top ${limit} selling products for store ${storeId}` + (daysPeriod ? `, period: ${daysPeriod} days.` : ', all time.'));
  if (!storeId) {
    return { data: null, error: new Error("Store ID is required.") };
  }

  const rpcParams = { 
    p_store_id: storeId,
    p_limit: limit,
    p_days_period: daysPeriod === undefined ? null : daysPeriod, 
  };

  const { data, error } = await supabase.rpc('get_top_selling_products', rpcParams);

  if (error) {
    let detailedErrorMessage = error.message || 'Failed to fetch top selling products from RPC.';
    if (error.message.includes("function get_top_selling_products") && error.message.includes("does not exist")) {
        detailedErrorMessage = `RPC Error: ${error.message}. Ensure the 'get_top_selling_products(UUID, INTEGER, INTEGER)' function is correctly defined in your Supabase SQL Editor and that the 'authenticated' role has EXECUTE permission on it. The function should accept p_store_id (uuid), p_limit (integer), and p_days_period (integer, can be null).`;
    } else if (error.message.includes("permission denied for function")) {
         detailedErrorMessage = `RPC Error: ${error.message}. The 'authenticated' role (or the role your user is using) lacks EXECUTE permission on the 'get_top_selling_products' function. Please grant permission using: GRANT EXECUTE ON FUNCTION get_top_selling_products(UUID, INTEGER, INTEGER) TO authenticated;`;
    }
    console.error('[productService.getStoreTopSellingProductsRPC] Error calling RPC:', detailedErrorMessage, 'Original Supabase Error:', JSON.stringify(error, null, 2));
    return { data: null, error: new Error(detailedErrorMessage) };
  }

  console.log('[productService.getStoreTopSellingProductsRPC] Data from RPC:', data);
  return { data: data as TopSellingProductFromRPC[] | null, error: null };
}

