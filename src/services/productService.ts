
// src/services/productService.ts
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const supabase = createClient();

// Helper to extract path from Supabase Storage URL
function getPathFromStorageUrl(url: string, bucketName: string): string | null {
  try {
    const urlObj = new URL(url);
    // Path for public URLs: /storage/v1/object/public/{bucket_name}/{actual_path_in_bucket}
    // Path for signed URLs (less common for display, but good to be aware): /storage/v1/object/sign/{bucket_name}/{actual_path_in_bucket}
    const publicPathPrefix = `/storage/v1/object/public/${bucketName}/`;
    const signedPathPrefix = `/storage/v1/object/sign/${bucketName}/`;

    if (urlObj.pathname.startsWith(publicPathPrefix)) {
      return urlObj.pathname.substring(publicPathPrefix.length);
    } else if (urlObj.pathname.startsWith(signedPathPrefix)) {
      // For signed URLs, the actual path might be followed by query params for the signature.
      // We only need the path part.
      const pathWithoutQuery = urlObj.pathname.substring(signedPathPrefix.length);
      return pathWithoutQuery.split('?')[0];
    }
    console.warn(`[productService.getPathFromStorageUrl] URL does not match expected prefix for bucket ${bucketName}: ${url}`);
    return null;
  } catch (e) {
    console.error(`[productService.getPathFromStorageUrl] Invalid URL: ${url}`, e);
    return null;
  }
}


export interface ProductImagePayload { // For creating/updating product images
  image_url: string;
  data_ai_hint?: string | null;
  order: number;
}

export interface ProductPayload { // For creating/updating product data
  name: string;
  category: string;
  price: number;
  orderPrice?: number | null;
  stock: number;
  status: 'Active' | 'Draft' | 'Archived';
  description?: string | null;
  fullDescription: string;
  sku?: string | null;
  tags?: string[] | null;
  weight_kg?: number | null; // Ensure consistency with schema
  dimensions_cm?: { length: number; width: number; height: number } | null; // Ensure consistency
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
  orderPrice?: number | null;
  stock: number;
  status: 'Active' | 'Draft' | 'Archived';
  description?: string | null;
  fullDescription: string;
  sku?: string | null;
  tags?: string[] | null;
  weight_kg?: number | null;
  dimensions_cm?: { length: number; width: number; height: number } | null;
  created_at: string;
  updated_at: string;
  product_images: ProductImageFromSupabase[];
}

// Helper to upload a single product image
async function uploadProductImage(
  storeId: string,
  productId: string,
  imageFile: File
): Promise<{ publicUrl: string | null; error: Error | null }> {
  const pathWithinBucket = `${storeId}/${productId}/${Date.now()}_${imageFile.name}`;
  console.log(`[productService.uploadProductImage] Uploading to: product-images/${pathWithinBucket}`);

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(pathWithinBucket, imageFile, {
      cacheControl: '3600',
      upsert: true, // true to overwrite if file with same path exists (e.g. re-upload)
    });

  if (uploadError) {
    console.error('[productService.uploadProductImage] Supabase upload error:', JSON.stringify(uploadError, null, 2));
    const message = uploadError.message || 'Failed to upload product image.';
    return { publicUrl: null, error: new Error(message) };
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(pathWithinBucket);
  if (!data?.publicUrl) {
    console.error('[productService.uploadProductImage] Failed to get public URL for image.');
    return { publicUrl: null, error: new Error('Failed to get public URL for image after upload.') };
  }
  console.log(`[productService.uploadProductImage] Successfully uploaded. Public URL: ${data.publicUrl}`);
  return { publicUrl: data.publicUrl, error: null };
}

export async function getProductsByStoreId(storeId: string): Promise<{ data: ProductFromSupabase[] | null; error: Error | null }> {
  console.log('[productService.getProductsByStoreId] Fetching products for store_id:', storeId);

  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*, product_images(*)') // Nested select for images
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('[productService.getProductsByStoreId] Supabase fetch products error:', productsError);
    return { data: null, error: new Error(productsError.message || 'Failed to fetch products.') };
  }

  console.log('[productService.getProductsByStoreId] Fetched products:', productsData?.length);
  return { data: productsData as ProductFromSupabase[] | null, error: null };
}


export async function createProduct(
  userId: string, // For RLS checks if needed, though store_id is primary for products
  storeId: string,
  productData: ProductPayload,
  imageFilesWithHints: { file: File; hint: string }[]
): Promise<{ data: ProductFromSupabase | null; error: Error | null }> {
  console.log(`[productService.createProduct] Attempting for store ID: ${storeId}`, { productData, imageCount: imageFilesWithHints.length });

  const { data: newProduct, error: createProductError } = await supabase
    .from('products')
    .insert({
      store_id: storeId,
      ...productData,
    })
    .select('*, product_images!left(*)') // Select product and attempt to join images (will be empty initially)
    .single();

  if (createProductError || !newProduct) {
    console.error('[productService.createProduct] Error creating product record:', JSON.stringify(createProductError, null, 2));
    const message = createProductError?.message || 'Failed to create product record or retrieve it. Check RLS on products table.';
    return { data: null, error: new Error(message) };
  }

  const uploadedImages: ProductImageFromSupabase[] = [];
  if (imageFilesWithHints && imageFilesWithHints.length > 0) {
    for (let i = 0; i < imageFilesWithHints.length; i++) {
      const { file, hint } = imageFilesWithHints[i];
      const { publicUrl, error: uploadError } = await uploadProductImage(storeId, newProduct.id, file);
      if (uploadError || !publicUrl) {
        console.warn(`[productService.createProduct] Failed to upload image ${i + 1}:`, uploadError?.message);
        // Decide if you want to stop or continue. For now, we continue and log.
        continue;
      }
      const { data: newDbImage, error: dbImageError } = await supabase
        .from('product_images')
        .insert({
          product_id: newProduct.id,
          image_url: publicUrl,
          data_ai_hint: hint,
          order: i,
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
    product_images: uploadedImages.sort((a, b) => a.order - b.order), // Ensure correct order
  };

  console.log('[productService.createProduct] Successfully created product:', finalProductData.id);
  return { data: finalProductData, error: null };
}


export async function updateProduct(
  productId: string,
  userId: string, // For RLS checks
  storeId: string, // For RLS checks and image path
  productData: ProductPayload,
  imagesToSet: { file?: File; hint: string; existingUrl?: string; id?: string }[] // Represents the desired final state of images
): Promise<{ data: ProductFromSupabase | null; error: Error | null }> {
  console.log(`[productService.updateProduct] Updating product ID: ${productId} for store ID: ${storeId}`);

  // 1. Update core product details
  const { data: updatedCoreProduct, error: coreUpdateError } = await supabase
    .from('products')
    .update(productData)
    .eq('id', productId)
    .eq('store_id', storeId) // Ensure user owns the store this product belongs to (via RLS on products table)
    .select('*')
    .single();

  if (coreUpdateError || !updatedCoreProduct) {
    console.error('[productService.updateProduct] Error updating core product details:', JSON.stringify(coreUpdateError, null, 2));
    return { data: null, error: new Error(coreUpdateError?.message || 'Failed to update product details. Check RLS.') };
  }

  // 2. Fetch current product images for deletion from storage
  const { data: oldDbImages, error: fetchOldImagesError } = await supabase
    .from('product_images')
    .select('id, image_url')
    .eq('product_id', productId);

  if (fetchOldImagesError) {
    console.warn('[productService.updateProduct] Error fetching old images for deletion:', fetchOldImagesError.message);
    // Continue, but storage might not be cleaned up
  }

  // 3. Delete old images from Supabase Storage
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

  // 4. Delete all existing rows from product_images for this product
  // (Cascade delete should handle this if ON DELETE CASCADE is set on product_images.product_id FK,
  // but explicit deletion ensures it if not, or if for some reason cascade is not desired here)
  // For a "replace all" strategy, direct deletion is cleaner.
  const { error: deleteOldDbImagesError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId);

  if (deleteOldDbImagesError) {
    console.warn('[productService.updateProduct] Error deleting old image records from DB:', deleteOldDbImagesError.message);
    // Potentially problematic if new images can't be inserted due to old ones still existing on a unique constraint.
    // However, we are re-inserting, so this is mainly for cleanup.
  }
  
  // 5. Upload new images and prepare records for all images to set
  const newProductImageRecords: ProductImagePayload[] = [];
  for (let i = 0; i < imagesToSet.length; i++) {
    const imgData = imagesToSet[i];
    let imageUrl = imgData.existingUrl;

    if (imgData.file) { // New file to upload
      const { publicUrl, error: uploadError } = await uploadProductImage(storeId, productId, imgData.file);
      if (uploadError || !publicUrl) {
        console.warn(`[productService.updateProduct] Failed to upload new image ${i + 1}:`, uploadError?.message);
        // If an upload fails, you might want to skip this image or handle the error more gracefully
        // For now, we'll skip it if it's a new file and upload failed.
        // If it was meant to replace an existingUrl, and upload failed, existingUrl won't be used.
        if (!imgData.existingUrl) continue; // Skip if it was purely a new image that failed
        imageUrl = imgData.existingUrl; // Fallback to existing if it was a replacement attempt that failed
      } else {
        imageUrl = publicUrl;
      }
    }

    if (imageUrl) { // Only add if we have a URL (either existing or newly uploaded)
      newProductImageRecords.push({
        image_url: imageUrl,
        data_ai_hint: imgData.hint,
        order: i,
      });
    }
  }

  // 6. Insert new product_images records
  if (newProductImageRecords.length > 0) {
    const imageRecordsToInsert = newProductImageRecords.map(imgRec => ({
      product_id: productId,
      ...imgRec,
    }));

    const { data: insertedImages, error: insertNewImagesError } = await supabase
      .from('product_images')
      .insert(imageRecordsToInsert)
      .select('*');

    if (insertNewImagesError) {
      console.error('[productService.updateProduct] Error inserting new image records:', insertNewImagesError.message);
      // Return the core product data but indicate image update might have failed partially
      return { data: { ...updatedCoreProduct, product_images: [] } as ProductFromSupabase, error: new Error(`Core product updated, but image processing failed: ${insertNewImagesError.message}`) };
    }
    updatedCoreProduct.product_images = insertedImages || [];
  } else {
    updatedCoreProduct.product_images = []; // No images to set
  }

  // Sort images by order before returning
  if (updatedCoreProduct.product_images) {
    updatedCoreProduct.product_images.sort((a: any, b: any) => (a.order as number) - (b.order as number));
  }


  console.log(`[productService.updateProduct] Successfully updated product ID: ${productId}`);
  return { data: updatedCoreProduct as ProductFromSupabase, error: null };
}


export async function deleteProduct(
  productId: string,
  userId: string, // For RLS check on product ownership (via store)
  storeId: string // For RLS check and image path
): Promise<{ error: Error | null }> {
  console.log(`[productService.deleteProduct] Attempting to delete product ID: ${productId} from store ID: ${storeId}`);

  // 1. Fetch all product images for this product to delete from storage
  const { data: images, error: fetchImagesError } = await supabase
    .from('product_images')
    .select('image_url')
    .eq('product_id', productId);

  if (fetchImagesError) {
    console.warn('[productService.deleteProduct] Error fetching product images for deletion:', fetchImagesError.message);
    // Proceed with deleting the product record anyway, storage cleanup might be incomplete.
  }

  // 2. Delete images from Supabase Storage
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

  // 3. Delete the product from the 'products' table.
  // RLS policies on 'products' should ensure user owns the store.
  // ON DELETE CASCADE on 'product_images.product_id' FK should delete associated DB image records.
  const { error: deleteProductError } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('store_id', storeId); // Ensure correct store context for deletion

  if (deleteProductError) {
    console.error('[productService.deleteProduct] Error deleting product from database:', JSON.stringify(deleteProductError, null, 2));
    return { error: new Error(deleteProductError.message || 'Failed to delete product. Check RLS.') };
  }

  console.log(`[productService.deleteProduct] Successfully deleted product ID: ${productId}`);
  return { error: null };
}

// Get a single product by ID (useful for product detail page)
export async function getProductById(productId: string): Promise<{ data: ProductFromSupabase | null; error: Error | null }> {
  console.log('[productService.getProductById] Fetching product by ID:', productId);

  const { data: productData, error: productError } = await supabase
    .from('products')
    .select('*, product_images(*, id, image_url, data_ai_hint, order)') // Ensure product_images include id
    .eq('id', productId)
    .order('order', { foreignTable: 'product_images', ascending: true }) // Order images
    .single();

  if (productError) {
    console.error('[productService.getProductById] Supabase fetch product error:', productError);
    let message = productError.message || 'Failed to fetch product.';
    if (productError.code === 'PGRST116') { // Not found
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

