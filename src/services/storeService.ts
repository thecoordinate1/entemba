
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
  const filePath = `store-logos/${userId}/${storeId}/${Date.now()}_${file.name}`;
  console.log(`[storeService.uploadStoreLogo] Uploading to: ${filePath}`);
  const { error: uploadError } = await supabase.storage
    .from('store-logos') // Ensure this bucket name is correct and RLS is set up
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('[storeService.uploadStoreLogo] Error uploading store logo:', uploadError);
    return { publicUrl: null, error: new Error(uploadError.message || 'Failed to upload store logo.') };
  }

  const { data } = supabase.storage.from('store-logos').getPublicUrl(filePath);
  if (!data?.publicUrl) {
    console.error('[storeService.uploadStoreLogo] Failed to get public URL for logo.');
    return { publicUrl: null, error: new Error('Failed to get public URL for logo.') };
  }
  console.log(`[storeService.uploadStoreLogo] Successfully uploaded. Public URL: ${data.publicUrl}`);
  return { publicUrl: data.publicUrl, error: null };
}

export async function getStoresByUserId(userId: string): Promise<{ data: StoreFromSupabase[] | null, error: Error | null }> {
  console.log('[storeService.getStoresByUserId] Fetching stores for vendor_id:', userId);

  // **IMPORTANT**: If you see "cannot find a relationship between 'stores' and 'social_links'"
  // **FIRST TRY REFRESHING YOUR SUPABASE SCHEMA CACHE** in the Supabase dashboard (API section).
  // The below is a workaround if that fails. The preferred method is a nested select.

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

  // Fetch social links for each store separately
  const storesWithSocialLinks = await Promise.all(
    storesData.map(async (store) => {
      const { data: socialLinksData, error: socialLinksError } = await supabase
        .from('social_links')
        .select('platform, url')
        .eq('store_id', store.id);

      if (socialLinksError) {
        console.warn(`[storeService.getStoresByUserId] Error fetching social links for store ${store.id}:`, socialLinksError.message);
        return { ...store, social_links: [] }; // Return store even if social links fail
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
    logo_url: null,
    data_ai_hint: null,
  };

  const { data: newStore, error: createStoreError } = await supabase
    .from('stores')
    .insert(initialStoreInsertData)
    .select('id, vendor_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at') // Select basic fields first
    .single();

  console.log("[storeService.createStore] Supabase insert response:", { newStore, createStoreError });

  if (createStoreError || !newStore) {
    let message = 'Failed to create store record.';
    if (createStoreError) {
      if (createStoreError.message && typeof createStoreError.message === 'string' && createStoreError.message.trim() !== '') {
        message = createStoreError.message;
      } else if (Object.keys(createStoreError).length === 0) {
        message = 'Store creation failed. This usually indicates a Row Level Security policy is preventing the operation or the read-back of the inserted row. Ensure RLS SELECT policy for `vendor_id = auth.uid()` exists on `stores` table.';
      } else {
        message = `Supabase error during store insert: ${JSON.stringify(createStoreError)}`;
      }
    } else if (!newStore) {
      message = 'Failed to create store record or retrieve it after insert. This strongly suggests an RLS SELECT policy is missing or incorrect for the `stores` table (e.g., `vendor_id = auth.uid()`).';
    }
    console.error('[storeService.createStore] Error creating store. Message:', message, 'Original Supabase Error:', createStoreError || 'No specific Supabase error object returned.');
    return { data: null, error: new Error(message) };
  }

  let currentStoreData = { ...newStore, social_links: [] } as StoreFromSupabase; // Initialize with empty social_links
  let logoUrlToSave = newStore.logo_url;
  let finalDataAiHint = newStore.data_ai_hint;

  if (logoFile) {
    console.log(`[storeService.createStore] Uploading logo for new store ID: ${newStore.id}`);
    const { publicUrl: uploadedLogoUrl, error: logoUploadError } = await uploadStoreLogo(userId, newStore.id, logoFile);

    if (logoUploadError) {
      console.warn('[storeService.createStore] Logo upload failed for new store:', logoUploadError.message, 'Store created, but logo not uploaded.');
      // Optionally, you might want to return an error or proceed without the logo
    } else if (uploadedLogoUrl) {
      logoUrlToSave = uploadedLogoUrl;
      finalDataAiHint = storeData.data_ai_hint; // Use hint from form if logo uploaded
    }
  } else if (storeData.logo_url) { // If a URL was provided directly (e.g. placeholder, or existing URL if this becomes an update)
      logoUrlToSave = storeData.logo_url;
      finalDataAiHint = storeData.data_ai_hint;
  }


  // Update store with logo URL and AI hint if they changed
  if (logoUrlToSave !== newStore.logo_url || finalDataAiHint !== newStore.data_ai_hint) {
      console.log(`[storeService.createStore] Updating store ${newStore.id} with logo_url: ${logoUrlToSave} and hint: ${finalDataAiHint}`);
      const { data: updatedStoreWithLogo, error: updateLogoError } = await supabase
        .from('stores')
        .update({ logo_url: logoUrlToSave, data_ai_hint: finalDataAiHint })
        .eq('id', newStore.id)
        .select('id, vendor_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at')
        .single();

      if (updateLogoError || !updatedStoreWithLogo) {
        console.warn('[storeService.createStore] Error updating store with logo URL and hint:', updateLogoError, 'Logo might be in storage, but DB record not updated.');
        // Decide if this is a critical error. For now, we'll use what we have.
        // currentStoreData remains the initially inserted store if this update fails
      } else {
        console.log(`[storeService.createStore] Store ${newStore.id} successfully updated with logo info.`);
        currentStoreData = { ...updatedStoreWithLogo, social_links: [] }; // Reset social_links as we're about to add them
      }
  }


  // Insert social links
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
      // Store created, but social links might have failed.
    } else {
      currentStoreData.social_links = insertedSocialLinks || [];
    }
  }

  console.log('[storeService.createStore] Successfully created store:', currentStoreData);
  return { data: currentStoreData, error: null };
}

export async function updateStore(
  storeId: string,
  userId: string,
  storeData: StorePayload,
  logoFile?: File | null
): Promise<{ data: StoreFromSupabase | null, error: Error | null }> {
  console.log(`[storeService.updateStore] Attempting to update store ID: ${storeId} for vendor ID: ${userId}`, { storeData, hasLogoFile: !!logoFile });

  let newLogoUrl = storeData.logo_url;
  let newAiHint = storeData.data_ai_hint;

  if (logoFile) {
    console.log(`[storeService.updateStore] New logo file provided for store ${storeId}, attempting to upload.`);
    const { publicUrl, error: uploadError } = await uploadStoreLogo(userId, storeId, logoFile);
    if (uploadError) {
      console.error('[storeService.updateStore] Error updating store logo:', uploadError.message);
      return { data: null, error: new Error(uploadError.message || "Failed to upload new logo. Store details not updated.") };
    }
    if (publicUrl) {
      newLogoUrl = publicUrl;
      newAiHint = storeData.data_ai_hint;
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
    .eq('vendor_id', userId)
    .select('id, vendor_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at')
    .single();

  if (updateStoreError || !updatedStoreCore) {
    let message = 'Failed to update store details.';
     if (updateStoreError) {
        if (updateStoreError.message && typeof updateStoreError.message === 'string' && updateStoreError.message.trim() !== '') {
            message = updateStoreError.message;
        } else if (Object.keys(updateStoreError).length === 0) {
            message = 'Store update failed. This might be due to Row Level Security policies or data constraints preventing the operation or read-back.';
        } else {
            message = `Supabase error during store update: ${JSON.stringify(updateStoreError)}`;
        }
    } else if (!updatedStoreCore) {
        message = 'Failed to update store or retrieve it after update. Ensure store exists and RLS allows operation for vendor.';
    }
    console.error('[storeService.updateStore] Error updating store details:', message, 'Original Supabase Error:', updateStoreError);
    return { data: null, error: new Error(message) };
  }

  console.log(`[storeService.updateStore] Store ${storeId} details updated. Managing social links.`);
  // Delete existing social links for the store
  const { error: deleteSocialLinksError } = await supabase
    .from('social_links')
    .delete()
    .eq('store_id', storeId);

  if (deleteSocialLinksError) {
    console.warn('[storeService.updateStore] Error deleting existing social links:', deleteSocialLinksError.message);
    // Not necessarily a fatal error for the whole update, but good to log.
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

  // Social links will be deleted by CASCADE constraint on the database if defined.
  // If not, you'd delete them first:
  // const { error: deleteSocialLinksError } = await supabase
  //   .from('social_links')
  //   .delete()
  //   .eq('store_id', storeId);
  // if (deleteSocialLinksError) { /* handle or log */ }

  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', storeId)
    .eq('vendor_id', userId);

  if (error) {
    let message = 'Failed to delete store.';
    if (error.message && typeof error.message === 'string' && error.message.trim() !== '') {
        message = error.message;
    } else if (Object.keys(error).length === 0) {
        message = 'Store deletion failed. This might be due to Row Level Security policies or data constraints.';
    } else {
        message = `Supabase error during store delete: ${JSON.stringify(error)}`;
    }
    console.error('[storeService.deleteStore] Error deleting store:', message, 'Original Supabase Error:', error);
    return { error: new Error(message) };
  }
  console.log(`[storeService.deleteStore] Store ${storeId} successfully deleted from DB.`);
  return { error: null };
}
