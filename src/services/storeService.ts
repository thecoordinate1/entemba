
// src/services/storeService.ts
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const supabase = createClient();

export interface SocialLinkPayload { // For creating/updating
  platform: string;
  url: string;
}

export interface StorePayload { // For creating/updating store data
  name: string;
  description: string;
  category: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
  location?: string | null;
  logo_url?: string | null;
  data_ai_hint?: string | null;
  social_links?: SocialLinkPayload[];
}

export interface StoreFromSupabase {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  logo_url: string | null;
  data_ai_hint: string | null;
  status: 'Active' | 'Inactive' | 'Maintenance';
  category: string;
  location: string | null;
  created_at: string;
  updated_at: string;
  social_links: {
    platform: string;
    url: string;
  }[];
}

// Helper to upload store logo
async function uploadStoreLogo(userId: string, storeId: string, file: File): Promise<{ publicUrl: string | null, error: Error | null }> {
  const pathWithinBucket = `${userId}/${storeId}/${Date.now()}_${file.name}`;
  console.log(`[storeService.uploadStoreLogo] Uploading to: store-logos/${pathWithinBucket}`);
  const { error: uploadError } = await supabase.storage
    .from('store-logos')
    .upload(pathWithinBucket, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('[storeService.uploadStoreLogo] Raw Supabase upload error object:', JSON.stringify(uploadError, null, 2));
    let message = 'Failed to upload store logo.';
    if (uploadError.message && typeof uploadError.message === 'string' && uploadError.message.trim() !== '') {
        message = uploadError.message;
    } else if (Object.keys(uploadError).length === 0) {
        message = 'Store logo upload failed. This might be due to bucket RLS policies or storage configuration issues. Ensure the store-logos bucket exists and policies allow uploads for the authenticated user for the path: ' + pathWithinBucket;
    } else {
        message = `Supabase storage error during logo upload. Details: ${JSON.stringify(uploadError)}`;
    }
    const constructedError = new Error(message);
    console.error('[storeService.uploadStoreLogo] Constructed error to be returned:', constructedError);
    return { publicUrl: null, error: constructedError };
  }

  const { data } = supabase.storage.from('store-logos').getPublicUrl(pathWithinBucket);
  if (!data?.publicUrl) {
    console.error('[storeService.uploadStoreLogo] Failed to get public URL for logo.');
    return { publicUrl: null, error: new Error('Failed to get public URL for logo.') };
  }
  console.log(`[storeService.uploadStoreLogo] Successfully uploaded. Public URL: ${data.publicUrl}`);
  return { publicUrl: data.publicUrl, error: null };
}

// Helper function to extract path from Supabase Storage URL
function getPathFromStorageUrl(url: string, bucketName: string): string | null {
  try {
    const urlObj = new URL(url);
    // Pathname is like /storage/v1/object/public/bucket-name/path/to/file.png
    // We need to remove the initial parts to get the path within the bucket.
    const pathPrefix = `/storage/v1/object/public/${bucketName}/`;
    if (urlObj.pathname.startsWith(pathPrefix)) {
      return urlObj.pathname.substring(pathPrefix.length);
    }
    console.warn(`[storeService.getPathFromStorageUrl] URL does not match expected prefix for bucket ${bucketName}: ${url}`);
    return null;
  } catch (e) {
    console.error(`[storeService.getPathFromStorageUrl] Invalid URL: ${url}`, e);
    return null;
  }
}


export async function getStoresByUserId(userId: string): Promise<{ data: StoreFromSupabase[] | null, error: Error | null }> {
  console.log('[storeService.getStoresByUserId] Fetching stores for vendor_id:', userId);

  const { data: storesData, error: storesError } = await supabase
    .from('stores')
    .select('id, vendor_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at')
    .eq('vendor_id', userId)
    .order('created_at', { ascending: false });

  if (storesError) {
    console.error('[storeService.getStoresByUserId] Supabase fetch stores error:', storesError);
    let message = 'Failed to fetch stores.';
    if (storesError.message && typeof storesError.message === 'string' && storesError.message.trim() !== '') {
        message = storesError.message;
    } else if (Object.keys(storesError).length === 0) {
        message = 'Failed to fetch stores. This might be due to Row Level Security policies or network issues.';
    }
    return { data: null, error: new Error(message) };
  }

  if (!storesData) {
    console.log('[storeService.getStoresByUserId] No stores found for vendor_id:', userId);
    return { data: [], error: null };
  }

  // Fetch social links separately for each store
  const storesWithSocialLinks = await Promise.all(
    storesData.map(async (store) => {
      const { data: socialLinksData, error: socialLinksError } = await supabase
        .from('social_links')
        .select('platform, url')
        .eq('store_id', store.id);

      if (socialLinksError) {
        console.warn(`[storeService.getStoresByUserId] Error fetching social links for store ${store.id}:`, socialLinksError.message);
        return { ...store, social_links: [] };
      }
      return { ...store, social_links: socialLinksData || [] };
    })
  );

  console.log('[storeService.getStoresByUserId] Fetched stores with social links:', storesWithSocialLinks);
  return { data: storesWithSocialLinks as StoreFromSupabase[], error: null };
}


export async function createStore(
  userId: string,
  storeData: StorePayload,
  logoFile?: File | null
): Promise<{ data: StoreFromSupabase | null, error: Error | null }> {
  console.log(`[storeService.createStore] Attempting to insert store for vendor ID: ${userId}`, { storeData, hasLogoFile: !!logoFile });

  const initialStoreInsertData = {
    vendor_id: userId,
    name: storeData.name,
    description: storeData.description,
    category: storeData.category,
    status: storeData.status,
    location: storeData.location,
    logo_url: null, // Will be updated after upload if successful
    data_ai_hint: storeData.data_ai_hint, // Save hint regardless of immediate upload
  };

  const { data: newStore, error: createStoreError } = await supabase
    .from('stores')
    .insert(initialStoreInsertData)
    .select('id, vendor_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at')
    .single();

  console.log("[storeService.createStore] Supabase insert response:", { newStore, createStoreError: JSON.stringify(createStoreError, null, 2) });

  if (createStoreError || !newStore) {
    let message = 'Failed to create store record.';
    let details: any = createStoreError;

    if (createStoreError) {
      if (createStoreError.message && typeof createStoreError.message === 'string' && createStoreError.message.trim() !== '') {
        message = createStoreError.message;
      } else if (Object.keys(createStoreError).length === 0) {
        message = 'Store creation failed. This likely indicates a Row Level Security policy is preventing the operation or the read-back of the inserted row. Ensure RLS SELECT policy for `vendor_id = auth.uid()` exists on `stores` table.';
        details = { reason: "RLS or data constraint issue", supabaseError: createStoreError };
      } else {
        message = `Supabase error during store insert. Details: ${JSON.stringify(createStoreError)}`;
      }
    } else if (!newStore) {
      message = 'Failed to create store record or retrieve it after insert. This strongly suggests an RLS SELECT policy on the `stores` table (e.g., `vendor_id = auth.uid()`) is missing or incorrect, or the insert itself failed silently.';
      details = { reason: "Failed to retrieve after insert, likely RLS SELECT policy missing/incorrect" };
    }
    console.error('[storeService.createStore] Error creating store. Message:', message, "Original Supabase Error:", JSON.stringify(createStoreError, null, 2) || 'No specific Supabase error object returned.');
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = details;
    return { data: null, error: errorToReturn };
  }

  let currentStoreData = { ...newStore, social_links: [] } as StoreFromSupabase;
  let logoUrlToSave = newStore.logo_url; // This will be null from initial insert
  let finalDataAiHint = storeData.data_ai_hint || newStore.data_ai_hint;

  if (logoFile) {
    console.log(`[storeService.createStore] Uploading logo for new store ID: ${newStore.id}`);
    const { publicUrl: uploadedLogoUrl, error: logoUploadError } = await uploadStoreLogo(userId, newStore.id, logoFile);

    if (logoUploadError) {
      console.error('[storeService.createStore] Logo upload failed for new store:', logoUploadError.message);
      const errorToReturn = new Error(`Store created, but logo upload failed: ${logoUploadError.message}`);
      (errorToReturn as any).details = logoUploadError;
      return { data: currentStoreData, error: errorToReturn };
    }
    if (uploadedLogoUrl) {
      logoUrlToSave = uploadedLogoUrl;
      // data_ai_hint is already part of storeData and initialStoreInsertData
    }
  } else if (storeData.logo_url) { // For cases where a URL might be provided directly (though less common with file uploads)
    logoUrlToSave = storeData.logo_url;
  }

  // Update the store with the logo_url if it was successfully uploaded or provided
  if (logoUrlToSave) {
    console.log(`[storeService.createStore] Updating store ${newStore.id} with logo_url: ${logoUrlToSave}`);
    const { data: updatedStoreWithLogo, error: updateLogoError } = await supabase
      .from('stores')
      .update({ logo_url: logoUrlToSave, data_ai_hint: finalDataAiHint })
      .eq('id', newStore.id)
      .select('id, vendor_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at')
      .single();

    if (updateLogoError || !updatedStoreWithLogo) {
      console.warn('[storeService.createStore] Error updating store with logo URL and hint:', updateLogoError?.message || 'No error message. Could be RLS on update or select.');
       // Non-fatal error: store record was created, but logo URL update failed.
    } else {
      console.log(`[storeService.createStore] Store ${newStore.id} successfully updated with logo info.`);
      currentStoreData = { ...updatedStoreWithLogo, social_links: currentStoreData.social_links };
    }
  }


  if (storeData.social_links && storeData.social_links.length > 0) {
    const socialLinksToInsert = storeData.social_links.map(link => ({
      store_id: newStore.id,
      platform: link.platform,
      url: link.url,
    }));
    console.log('[storeService.createStore] Inserting social links:', socialLinksToInsert);
    const { data: insertedSocialLinks, error: socialLinksError } = await supabase
      .from('social_links')
      .insert(socialLinksToInsert)
      .select('platform, url');

    if (socialLinksError) {
      console.warn('[storeService.createStore] Error inserting social links:', socialLinksError.message);
      // Non-fatal error: store record and logo might be fine, but social links failed.
    } else {
      currentStoreData.social_links = insertedSocialLinks || [];
    }
  }

  console.log('[storeService.createStore] Successfully created/updated store parts:', currentStoreData);
  return { data: currentStoreData, error: null };
}


export async function updateStore(
  storeId: string,
  userId: string,
  storeData: StorePayload,
  logoFile?: File | null
): Promise<{ data: StoreFromSupabase | null, error: Error | null }> {
  console.log(`[storeService.updateStore] Attempting to update store ID: ${storeId} for vendor ID: ${userId}`, { storeData, hasLogoFile: !!logoFile });

  let newLogoUrl = storeData.logo_url; // Start with existing or provided URL
  let newAiHint = storeData.data_ai_hint;

  if (logoFile) {
    console.log(`[storeService.updateStore] New logo file provided for store ${storeId}, attempting to upload.`);
    const { publicUrl, error: uploadError } = await uploadStoreLogo(userId, storeId, logoFile);
    if (uploadError) {
      console.error('[storeService.updateStore] Error updating store logo:', uploadError.message);
      return { data: null, error: new Error(`Logo upload failed: ${uploadError.message}`) };
    }
    if (publicUrl) {
      newLogoUrl = publicUrl;
      // Use new hint from form if new logo uploaded, otherwise keep existing from storeData
      newAiHint = storeData.data_ai_hint || ''; 
    }
  }

  const storeUpdates = {
    name: storeData.name,
    description: storeData.description,
    category: storeData.category,
    status: storeData.status,
    location: storeData.location,
    logo_url: newLogoUrl,
    data_ai_hint: newAiHint,
    updated_at: new Date().toISOString(),
  };

  console.log(`[storeService.updateStore] Updating store ${storeId} details in DB:`, storeUpdates);
  const { data: updatedStoreCore, error: updateStoreError } = await supabase
    .from('stores')
    .update(storeUpdates)
    .eq('id', storeId)
    .eq('vendor_id', userId) // Ensure user owns the store
    .select('id, vendor_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at')
    .single();

  if (updateStoreError || !updatedStoreCore) {
    let message = 'Failed to update store details.';
    if (updateStoreError) {
        if (updateStoreError.message && typeof updateStoreError.message === 'string' && updateStoreError.message.trim() !== '') {
            message = updateStoreError.message;
        } else if (Object.keys(updateStoreError).length === 0) {
            message = 'Store update failed. This might be due to RLS policies or data constraints preventing read-back.';
        } else {
            message = `Supabase error during store update. Details: ${JSON.stringify(updateStoreError)}`;
        }
    } else if (!updatedStoreCore) {
        message = 'Failed to update store or retrieve it after update. Ensure store exists and RLS allows operation for this vendor.';
    }
    console.error('[storeService.updateStore] Error updating store details:', message, 'Original Supabase Error:', JSON.stringify(updateStoreError, null, 2));
    return { data: null, error: new Error(message) };
  }

  console.log(`[storeService.updateStore] Store ${storeId} details updated. Managing social links.`);
  
  const { error: deleteSocialLinksError } = await supabase
    .from('social_links')
    .delete()
    .eq('store_id', storeId);

  if (deleteSocialLinksError) {
    console.warn('[storeService.updateStore] Error deleting existing social links:', deleteSocialLinksError.message);
  }

  let insertedSocialLinksData: { platform: string, url: string }[] = [];
  if (storeData.social_links && storeData.social_links.length > 0) {
    const socialLinksToInsert = storeData.social_links.map(link => ({
      store_id: storeId,
      platform: link.platform,
      url: link.url,
    }));
    console.log('[storeService.updateStore] Inserting new social links:', socialLinksToInsert);
    const { data: newLinks, error: insertSocialLinksError } = await supabase
      .from('social_links')
      .insert(socialLinksToInsert)
      .select('platform, url');

    if (insertSocialLinksError) {
      console.warn('[storeService.updateStore] Error inserting new social links:', insertSocialLinksError.message);
    } else {
      insertedSocialLinksData = newLinks || [];
    }
  }

  const finalStoreData: StoreFromSupabase = {
    ...updatedStoreCore,
    social_links: insertedSocialLinksData
  };

  console.log(`[storeService.updateStore] Store ${storeId} successfully updated and social links managed:`, finalStoreData);
  return { data: finalStoreData, error: null };
}


export async function deleteStore(storeId: string, userId: string): Promise<{ error: Error | null }> {
  console.log(`[storeService.deleteStore] Attempting to delete store ID: ${storeId} for vendor ID: ${userId}`);

  try {
    // 1. Fetch store details to get logo URL and verify ownership
    const { data: storeDetails, error: fetchError } = await supabase
      .from('stores')
      .select('logo_url, vendor_id')
      .eq('id', storeId)
      .single();

    if (fetchError) {
      console.error('[storeService.deleteStore] Error fetching store details for deletion:', fetchError);
      // If store not found, it might have already been deleted or RLS prevents access.
      // Consider it success if the goal is deletion and it's already gone or inaccessible by this user.
      if (fetchError.code === 'PGRST116') { // PGRST116: "Query response is empty"
        console.warn(`[storeService.deleteStore] Store ${storeId} not found (or access denied), assuming already deleted or not owned.`);
        return { error: null }; // Or treat as error if you expect it to always exist
      }
      return { error: new Error(`Failed to fetch store details before deletion: ${fetchError.message}`) };
    }
    if (!storeDetails) {
      console.warn(`[storeService.deleteStore] Store not found (no data): ${storeId}`);
      return { error: null }; // Store doesn't exist, deletion is effectively complete.
    }
    if (storeDetails.vendor_id !== userId) {
        console.warn(`[storeService.deleteStore] User ${userId} does not own store ${storeId}. Deletion aborted by service.`);
        return { error: new Error('Access denied: You do not own this store.') };
    }

    // 2. Delete Store Logo from Storage
    if (storeDetails.logo_url) {
      const logoPath = getPathFromStorageUrl(storeDetails.logo_url, 'store-logos');
      if (logoPath) {
        console.log(`[storeService.deleteStore] Deleting store logo from path: store-logos/${logoPath}`);
        const { error: logoDeleteError } = await supabase.storage
          .from('store-logos')
          .remove([logoPath]);
        if (logoDeleteError) {
          console.warn('[storeService.deleteStore] Error deleting store logo from storage:', logoDeleteError.message);
          // Non-fatal, proceed with deleting other data
        }
      }
    }

    // 3. Fetch all products of the store to get their images
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId);

    if (productsError) {
      console.warn('[storeService.deleteStore] Error fetching products for store during delete:', productsError.message);
      // Non-fatal, proceed with deleting store record
    }

    if (products && products.length > 0) {
      const productIds = products.map(p => p.id);

      // 4. Fetch all product images for these products
      const { data: productImages, error: productImagesError } = await supabase
        .from('product_images')
        .select('image_url')
        .in('product_id', productIds);

      if (productImagesError) {
        console.warn('[storeService.deleteStore] Error fetching product images during delete:', productImagesError.message);
        // Non-fatal
      }

      if (productImages && productImages.length > 0) {
        const imagePathsToDelete = productImages
          .map(img => getPathFromStorageUrl(img.image_url, 'product-images'))
          .filter(path => path !== null) as string[];

        if (imagePathsToDelete.length > 0) {
          console.log(`[storeService.deleteStore] Deleting product images from bucket 'product-images':`, imagePathsToDelete);
          const { error: bulkImageDeleteError } = await supabase.storage
            .from('product-images') 
            .remove(imagePathsToDelete);
          if (bulkImageDeleteError) {
            console.warn('[storeService.deleteStore] Error deleting product images from storage:', bulkImageDeleteError.message);
            // Non-fatal
          }
        }
      }
    }

    // 5. Delete the store record from the database
    // (Products, orders, social_links should be deleted by CASCADE constraints)
    console.log(`[storeService.deleteStore] Deleting store record ${storeId} from database.`);
    const { error: deleteStoreDbError } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId)
      .eq('vendor_id', userId); // Ensure user owns the store (redundant due to RLS but good for safety)

    if (deleteStoreDbError) {
      let message = 'Failed to delete store from database.';
       if (deleteStoreDbError.message) {
        message = deleteStoreDbError.message;
      } else if (Object.keys(deleteStoreDbError).length === 0) {
        message = 'Store deletion failed. This might be due to Row Level Security policies or data constraints.';
      }
      console.error('[storeService.deleteStore] Error deleting store from database:', message, 'Original Supabase Error:', JSON.stringify(deleteStoreDbError, null, 2));
      return { error: new Error(message) };
    }

    console.log(`[storeService.deleteStore] Store ${storeId} and its associated data successfully processed for deletion.`);
    return { error: null };

  } catch (error) {
    console.error('[storeService.deleteStore] Unexpected error during store deletion:', error);
    if (error instanceof Error) {
      return { error };
    }
    return { error: new Error('An unexpected error occurred during store deletion.') };
  }
}

    