
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
  categories: string[];
  status: 'Active' | 'Inactive' | 'Maintenance';
  location?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_website?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  logo_url?: string | null;
  banner_url?: string | null;
  social_links?: SocialLinkPayload[];
  slug?: string | null;
  settings?: Record<string, any>;
}

export interface StoreFromSupabase {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  status: 'Active' | 'Inactive' | 'Maintenance';
  categories: string[]; // Now natively array in DB
  location: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_website: string | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  created_at: string;
  updated_at: string;
  slug: string | null;
  settings: Record<string, any>;
  is_verified: boolean;
  commission_rate: number | null;
  average_rating: number;
  review_count: number;
  social_links: {
    platform: string;
    url: string;
  }[];
}

const STORE_COLUMNS_TO_SELECT = 'id, vendor_id, name, description, logo_url, banner_url, status, categories, location, contact_phone, contact_email, contact_website, pickup_latitude, pickup_longitude, created_at, updated_at, slug, settings, is_verified, commission_rate, average_rating, review_count';


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
      console.warn(`[storeService.getPathFromStorageUrl] URL does not match expected prefix for bucket ${bucketName}: ${url}`);
      return null;
    }
    return pathWithinBucket;

  } catch (e) {
    console.error(`[storeService.getPathFromStorageUrl] Invalid URL: ${url}`, e);
    return null;
  }
}


// Helper to upload store logo
async function uploadStoreLogo(userId: string, storeId: string, file: File): Promise<{ publicUrl: string | null, error: Error | null }> {
  const pathWithinBucket = `${userId}/${storeId}/${Date.now()}_${file.name}`; // Path within the bucket
  console.log(`[storeService.uploadStoreLogo] Uploading to: store-logos/${pathWithinBucket}`);

  const { error: uploadError } = await supabase.storage
    .from('store-logos') // Bucket name
    .upload(pathWithinBucket, file, { // Path within bucket
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('[storeService.uploadStoreLogo] Raw Supabase upload error object:', JSON.stringify(uploadError, null, 2));
    let message = 'Failed to upload store logo.';
    if (uploadError.message && typeof uploadError.message === 'string' && uploadError.message.trim() !== '') {
      message = uploadError.message;
    } else if (Object.keys(uploadError).length === 0) { // Check if error object is empty
      message = `Store logo upload failed due to an empty error object from Supabase. This often indicates an RLS policy issue on the 'store-logos' bucket or misconfiguration. Path: ${pathWithinBucket}`;
    } else {
      message = `Supabase storage error during logo upload. Details: ${JSON.stringify(uploadError)}`;
    }
    const constructedError = new Error(message);
    console.error('[storeService.uploadStoreLogo] Constructed error to be returned:', constructedError.message, "Original Supabase Error (again):", uploadError);
    return { publicUrl: null, error: constructedError };
  }

  const { data } = supabase.storage.from('store-logos').getPublicUrl(pathWithinBucket);
  if (!data?.publicUrl) {
    console.error('[storeService.uploadStoreLogo] Failed to get public URL for logo.');
    return { publicUrl: null, error: new Error('Failed to get public URL for logo after upload.') };
  }
  console.log(`[storeService.uploadStoreLogo] Successfully uploaded. Public URL: ${data.publicUrl}`);
  return { publicUrl: data.publicUrl, error: null };
}

// Helper to upload store banner
async function uploadStoreBanner(userId: string, storeId: string, file: File): Promise<{ publicUrl: string | null, error: Error | null }> {
  const pathWithinBucket = `${userId}/${storeId}/banner_${Date.now()}_${file.name}`;
  console.log(`[storeService.uploadStoreBanner] Uploading to: store-logos/${pathWithinBucket}`); // Reusing store-logos bucket for banners too, or could separate. Using logic consistent with logo.

  const { error: uploadError } = await supabase.storage
    .from('store-logos')
    .upload(pathWithinBucket, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('[storeService.uploadStoreBanner] Raw Supabase upload error:', JSON.stringify(uploadError, null, 2));
    return { publicUrl: null, error: new Error(uploadError.message || 'Failed to upload store banner.') };
  }

  const { data } = supabase.storage.from('store-logos').getPublicUrl(pathWithinBucket);
  if (!data?.publicUrl) {
    return { publicUrl: null, error: new Error('Failed to get public URL for banner after upload.') };
  }
  return { publicUrl: data.publicUrl, error: null };
}


export async function getStoresByUserId(userId: string): Promise<{ data: StoreFromSupabase[] | null, error: Error | null }> {
  console.log('[storeService.getStoresByUserId] Fetching stores for vendor_id:', userId);

  const { data: storesData, error: storesError } = await supabase
    .from('stores')
    .select(STORE_COLUMNS_TO_SELECT)
    .eq('vendor_id', userId)
    .order('created_at', { ascending: false });

  if (storesError) {
    console.error('[storeService.getStoresByUserId] Supabase fetch stores error:', storesError);
    return { data: null, error: new Error(storesError.message || 'Failed to fetch stores.') };
  }

  if (!storesData) {
    console.log('[storeService.getStoresByUserId] No stores found for vendor_id:', userId);
    return { data: [], error: null };
  }

  // Fetch social links separately for each store
  const storesWithSocialLinks = await Promise.all(
    storesData.map(async (store) => {
      // Categories are now natively arrays
      const categoriesArray = store.categories || [];

      const { data: socialLinksData, error: socialLinksError } = await supabase
        .from('social_links')
        .select('platform, url')
        .eq('store_id', store.id);

      if (socialLinksError) {
        console.warn(`[storeService.getStoresByUserId] Error fetching social links for store ${store.id}:`, socialLinksError.message);
        return { ...store, categories: categoriesArray, social_links: [] };
      }
      return { ...store, categories: categoriesArray, social_links: socialLinksData || [] };
    })
  );

  console.log('[storeService.getStoresByUserId] Fetched stores with social links:', storesWithSocialLinks.length);
  return { data: storesWithSocialLinks as StoreFromSupabase[], error: null };
}

export async function getStoreById(storeId: string, userId: string): Promise<{ data: StoreFromSupabase | null, error: Error | null }> {
  console.log(`[storeService.getStoreById] Fetching store ${storeId} for user ${userId}`);
  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select(STORE_COLUMNS_TO_SELECT)
    .eq('id', storeId)
    .eq('vendor_id', userId) // Ensure ownership
    .single();

  if (storeError) {
    let message = `Failed to fetch store ${storeId}.`;
    if (storeError.message && typeof storeError.message === 'string' && storeError.message.trim() !== '') {
      message = storeError.message;
    } else if (Object.keys(storeError).length === 0) { // Check if error object is empty
      message = `Error fetching store ${storeId}. This strongly indicates an RLS SELECT policy issue on the 'stores' table preventing access, or the store does not exist/match vendor_id. Please verify RLS.`;
    } else {
      message = `Supabase error fetching store ${storeId}. Details: ${JSON.stringify(storeError)}`;
    }
    console.error(`[storeService.getStoreById] Error fetching store ${storeId}:`, message, 'Original Supabase Error:', JSON.stringify(storeError, null, 2));
    return { data: null, error: new Error(message) };
  }

  if (!storeData) {
    // This case implies storeError was null, but storeData is also null.
    // .single() should return an error (PGRST116) if no rows, or multiple rows are found.
    // If it's null without an error, it's unusual but could still point to an RLS issue
    // where the query is technically valid but RLS filters out the result.
    console.warn(`[storeService.getStoreById] No store data returned for store ${storeId} and user ${userId}, despite no explicit Supabase error. This is highly indicative of an RLS SELECT policy issue on the 'stores' table, or the store does not exist / not owned by user.`);
    return { data: null, error: new Error('Store not found or access denied. Please verify RLS SELECT policies on the "stores" table and ensure the store exists and is owned by the user.') };
  }

  // Categories are now natively arrays
  const categoriesArray = storeData.categories || [];

  // Fetch social links separately
  const { data: socialLinksData, error: socialLinksError } = await supabase
    .from('social_links')
    .select('platform, url')
    .eq('store_id', storeId);

  if (socialLinksError) {
    console.warn(`[storeService.getStoreById] Error fetching social links for store ${storeId}:`, socialLinksError.message);
    // Return store data even if social links fail, but log the warning.
    return { data: { ...storeData, categories: categoriesArray, social_links: [] } as StoreFromSupabase, error: null };
  }

  return { data: { ...storeData, categories: categoriesArray, social_links: socialLinksData || [] } as StoreFromSupabase, error: null };
}


export async function createStore(
  userId: string,
  storeData: StorePayload,
  logoFile?: File | null,
  bannerFile?: File | null
): Promise<{ data: StoreFromSupabase | null, error: Error | null }> {
  console.log(`[storeService.createStore] Attempting to insert store for vendor ID: ${userId}`, { storeData, hasLogoFile: !!logoFile });

  const initialStoreInsertData = {
    vendor_id: userId,
    name: storeData.name,
    description: storeData.description,
    categories: storeData.categories,
    status: storeData.status,
    location: storeData.location,
    contact_phone: storeData.contact_phone,
    contact_email: storeData.contact_email,
    contact_website: storeData.contact_website,
    pickup_latitude: storeData.pickup_latitude,
    pickup_longitude: storeData.pickup_longitude,
    slug: storeData.slug,
    settings: storeData.settings || {},
    logo_url: null,
    banner_url: null,
  };

  const { data: newStore, error: createStoreError } = await supabase
    .from('stores')
    .insert(initialStoreInsertData)
    .select(STORE_COLUMNS_TO_SELECT)
    .single();

  console.log("[storeService.createStore] Supabase insert response:", { newStore: JSON.stringify(newStore), createStoreError: JSON.stringify(createStoreError, null, 2) });

  if (createStoreError || !newStore) {
    let message = 'Failed to create store record.';
    let details: any = createStoreError;

    if (createStoreError) {
      if (createStoreError.message && typeof createStoreError.message === 'string' && createStoreError.message.trim() !== '') {
        message = createStoreError.message;
      } else if (Object.keys(createStoreError).length === 0) {
        message = 'Store creation failed. This likely indicates a Row Level Security policy is preventing the operation or the read-back of the inserted row. Ensure RLS INSERT and SELECT policies for `vendor_id = auth.uid()` exist on `stores` table.';
        details = { reason: "RLS or data constraint issue, empty error object from Supabase", supabaseError: createStoreError };
      } else {
        message = `Supabase error during store insert. Details: ${JSON.stringify(createStoreError)}`;
      }
    } else if (!newStore) { // createStoreError is null/undefined but newStore is also null
      message = 'Failed to create store record or retrieve it after insert. This strongly suggests an RLS SELECT policy on the `stores` table (e.g., `vendor_id = auth.uid()`) is missing or incorrect, preventing read-back of the newly inserted row.';
      details = { reason: "Failed to retrieve after insert, likely RLS SELECT policy missing/incorrect" };
    }
    console.error('[storeService.createStore] Error creating store. Message:', message, "Original Supabase Error:", JSON.stringify(createStoreError, null, 2) || 'No specific Supabase error object returned.');
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = details;
    return { data: null, error: errorToReturn };
  }

  let currentStoreData = { ...newStore, social_links: [] } as StoreFromSupabase;
  let logoUrlToSave = newStore.logo_url;
  let bannerUrlToSave = newStore.banner_url;

  if (logoFile) {
    console.log(`[storeService.createStore] Uploading logo for new store ID: ${newStore.id}`);
    const { publicUrl: uploadedLogoUrl, error: logoUploadError } = await uploadStoreLogo(userId, newStore.id, logoFile);

    if (logoUploadError) {
      console.warn('[storeService.createStore] Store created, but logo upload failed:', logoUploadError.message);
      const errorToReturn = new Error(`Store created, but logo upload failed: ${logoUploadError.message}`);
      (errorToReturn as any).details = logoUploadError;
      return { data: currentStoreData, error: errorToReturn };
    }
    if (uploadedLogoUrl) {
      logoUrlToSave = uploadedLogoUrl;
    }
  } else if (storeData.logo_url) {
    logoUrlToSave = storeData.logo_url;
  }

  if (bannerFile) {
    console.log(`[storeService.createStore] Uploading banner for new store ID: ${newStore.id}`);
    const { publicUrl, error: bannerUploadError } = await uploadStoreBanner(userId, newStore.id, bannerFile);
    if (bannerUploadError) {
      console.warn('Banner upload failed:', bannerUploadError.message);
    } else if (publicUrl) {
      bannerUrlToSave = publicUrl;
    }
  } else if (storeData.banner_url) {
    bannerUrlToSave = storeData.banner_url;
  }

  if (logoUrlToSave !== newStore.logo_url || bannerUrlToSave !== newStore.banner_url) {
    console.log(`[storeService.createStore] Updating store ${newStore.id} with logo/banner.`);
    const { data: updatedStoreWithImages, error: updateImagesError } = await supabase
      .from('stores')
      .update({ logo_url: logoUrlToSave, banner_url: bannerUrlToSave })
      .eq('id', newStore.id)
      .select(STORE_COLUMNS_TO_SELECT)
      .single();

    if (updateImagesError || !updatedStoreWithImages) {
      console.warn('[storeService.createStore] Error updating store with images:', updateImagesError?.message);
    } else {
      currentStoreData = { ...updatedStoreWithImages, social_links: currentStoreData.social_links };
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
    } else {
      currentStoreData.social_links = insertedSocialLinks || [];
    }
  }

  console.log('[storeService.createStore] Successfully created/updated store parts:', currentStoreData);
  return { data: currentStoreData, error: null };
}


export async function updateStore(
  storeId: string,
  userId: string, // This is authUser.id, maps to vendor_id
  storeData: StorePayload,
  logoFile?: File | null,
  bannerFile?: File | null
): Promise<{ data: StoreFromSupabase | null, error: Error | null }> {
  console.log(`[storeService.updateStore] Attempting to update store ID: ${storeId}`, { storeData, hasLogo: !!logoFile, hasBanner: !!bannerFile });

  let newLogoUrl = storeData.logo_url;
  let newBannerUrl = storeData.banner_url;

  if (logoFile) {
    console.log(`[storeService.updateStore] New logo file provided for store ${storeId}, attempting to upload.`);
    const { publicUrl, error: uploadError } = await uploadStoreLogo(userId, storeId, logoFile);
    if (uploadError) {
      console.error('[storeService.updateStore] Error updating store logo:', uploadError.message, uploadError);
      return { data: null, error: new Error(`Logo upload failed: ${uploadError.message}`) };
    }
    newLogoUrl = publicUrl;
  }

  if (bannerFile) {
    const { publicUrl, error: uploadError } = await uploadStoreBanner(userId, storeId, bannerFile);
    if (uploadError) {
      console.error('[storeService.updateStore] Error uploading banner:', uploadError);
      // We can decide to abort or continue. Let's return error.
      return { data: null, error: new Error(`Banner upload failed: ${uploadError.message}`) };
    }
    newBannerUrl = publicUrl;
  }


  const storeUpdates = {
    name: storeData.name,
    description: storeData.description,
    categories: storeData.categories,
    status: storeData.status,
    location: storeData.location,
    contact_phone: storeData.contact_phone,
    contact_email: storeData.contact_email,
    contact_website: storeData.contact_website,
    pickup_latitude: storeData.pickup_latitude,
    pickup_longitude: storeData.pickup_longitude,
    slug: storeData.slug,
    settings: storeData.settings,
    logo_url: newLogoUrl,
    banner_url: newBannerUrl,
    updated_at: new Date().toISOString(),
  };

  console.log(`[storeService.updateStore] Updating store ${storeId} details in DB:`, storeUpdates);
  const { data: updatedStoreCore, error: updateStoreError } = await supabase
    .from('stores')
    .update(storeUpdates)
    .eq('id', storeId)
    .eq('vendor_id', userId)
    .select(STORE_COLUMNS_TO_SELECT)
    .single();

  if (updateStoreError || !updatedStoreCore) {
    let message = 'Failed to update store details.';
    if (updateStoreError) {
      if (updateStoreError.message && typeof updateStoreError.message === 'string' && updateStoreError.message.trim() !== '') {
        message = updateStoreError.message;
      } else if (Object.keys(updateStoreError).length === 0) {
        message = `Store update failed (empty error object). This strongly suggests an RLS policy issue on the 'stores' table preventing update or read-back. Store ID: ${storeId}`;
      } else {
        message = `Supabase error during store update. Store ID: ${storeId}. Details: ${JSON.stringify(updateStoreError)}`;
      }
    } else if (!updatedStoreCore) {
      message = `Failed to update store or retrieve it after update (no data returned). Ensure store exists, RLS allows operation for this vendor, and you have SELECT permissions. Store ID: ${storeId}`;
    }
    console.error('[storeService.updateStore] Error updating store details. Message:', message, 'Original Supabase Error:', JSON.stringify(updateStoreError, null, 2));
    const errorToReturn = new Error(message);
    (errorToReturn as any).details = updateStoreError;
    return { data: null, error: errorToReturn };
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
    const { data: storeDetails, error: fetchError } = await supabase
      .from('stores')
      .select('logo_url, vendor_id')
      .eq('id', storeId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[storeService.deleteStore] Error fetching store details for deletion:', fetchError);
      return { error: new Error(`Failed to fetch store details before deletion: ${fetchError.message}`) };
    }
    if (!storeDetails) {
      console.warn(`[storeService.deleteStore] Store ${storeId} not found, access denied, or already deleted. No further action taken for this store ID.`);
      return { error: null };
    }
    if (storeDetails.vendor_id !== userId) {
      console.warn(`[storeService.deleteStore] User ${userId} does not own store ${storeId}. Deletion aborted by service.`);
      return { error: new Error('Access denied: You do not own this store.') };
    }

    if (storeDetails.logo_url) {
      const logoPath = getPathFromStorageUrl(storeDetails.logo_url, 'store-logos');
      if (logoPath) {
        console.log(`[storeService.deleteStore] Deleting store logo from path: store-logos/${logoPath}`);
        const { error: logoDeleteError } = await supabase.storage
          .from('store-logos')
          .remove([logoPath]);
        if (logoDeleteError) {
          console.warn('[storeService.deleteStore] Error deleting store logo from storage:', logoDeleteError.message);
        }
      }
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId);

    if (productsError) {
      console.warn('[storeService.deleteStore] Error fetching products for store during delete:', productsError.message);
    }

    if (products && products.length > 0) {
      const productIds = products.map(p => p.id);
      const { data: productImages, error: productImagesError } = await supabase
        .from('product_images')
        .select('image_url')
        .in('product_id', productIds);

      if (productImagesError) {
        console.warn('[storeService.deleteStore] Error fetching product images during delete:', productImagesError.message);
      }

      if (productImages && productImages.length > 0) {
        const imagePathsToDelete = productImages
          .map(img => getPathFromStorageUrl(img.image_url, 'product-images'))
          .filter(path => path !== null) as string[];

        if (imagePathsToDelete.length > 0) {
          console.log(`[storeService.deleteStore] Deleting ${imagePathsToDelete.length} product images from bucket 'product-images'.`);
          const { error: bulkImageDeleteError } = await supabase.storage
            .from('product-images')
            .remove(imagePathsToDelete);
          if (bulkImageDeleteError) {
            console.warn('[storeService.deleteStore] Error deleting product images from storage:', bulkImageDeleteError.message);
          }
        }
      }
    }

    console.log(`[storeService.deleteStore] Deleting store record ${storeId} from database.`);
    const { error: deleteStoreDbError } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId)
      .eq('vendor_id', userId);

    if (deleteStoreDbError) {
      let message = 'Failed to delete store from database.';
      if (deleteStoreDbError.message && typeof deleteStoreDbError.message === 'string' && deleteStoreDbError.message.trim() !== '') {
        message = deleteStoreDbError.message;
      } else if (Object.keys(deleteStoreDbError).length === 0) {
        message = 'Store deletion from database failed (empty error object). This might be due to RLS policies or data constraints.';
      } else {
        message = `Supabase error deleting store from database. Details: ${JSON.stringify(deleteStoreDbError)}`;
      }
      console.error('[storeService.deleteStore] Error deleting store from database. Message:', message, 'Original Supabase Error:', JSON.stringify(deleteStoreDbError, null, 2));
      const errorToReturn = new Error(message);
      (errorToReturn as any).details = deleteStoreDbError;
      return { error: errorToReturn };
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
