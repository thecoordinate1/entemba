
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
  vendor_id: string; // Changed from user_id
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
    // id?: string; // Supabase might not return id for nested selects unless specified
    // store_id?: string;
    platform: string;
    url: string;
    // created_at?: string;
  }[];
}

// Helper to upload store logo
async function uploadStoreLogo(userId: string, storeId: string, file: File): Promise<{ publicUrl: string | null, error: Error | null }> {
  const filePath = `store-logos/${userId}/${storeId}/${Date.now()}_${file.name}`;
  console.log(`[storeService.uploadStoreLogo] Uploading to: ${filePath}`);
  const { error: uploadError } = await supabase.storage
    .from('store-logos')
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
  console.log('[storeService.getStoresByUserId] Fetching stores for vendor_id:', userId); // Logging the userId

  const { data: storesData, error: storesError } = await supabase
    .from('stores')
    .select('id, vendor_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at, social_links(platform, url)')
    .eq('vendor_id', userId) // Ensure this matches your column name 'vendor_id'
    .order('created_at', { ascending: false });

  if (storesError) {
    console.error('[storeService.getStoresByUserId] Supabase fetch error:', storesError);
    let message = 'Failed to fetch stores.';
    if (storesError.message) {
        message = storesError.message;
    } else if (Object.keys(storesError).length === 0) {
        message = 'Failed to fetch stores. This might be due to Row Level Security policies or network issues.';
    }
    return { data: null, error: new Error(message) };
  }
  
  console.log('[storeService.getStoresByUserId] Fetched stores data:', storesData);
  return { data: (storesData as StoreFromSupabase[]) || [], error: null };
}

export async function createStore(
  userId: string, // This userId is auth.uid() and will be vendor_id
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
    .select()
    .single();

  console.log("[storeService.createStore] Supabase insert response:", { newStore, createStoreError });

  if (createStoreError || !newStore) {
    let message = 'Failed to create store record.';
    if (createStoreError) {
        if (createStoreError.message && typeof createStoreError.message === 'string' && createStoreError.message.trim() !== '') {
            message = createStoreError.message;
        } else if (Object.keys(createStoreError).length === 0) {
            message = 'Store creation failed. This usually indicates a Row Level Security policy or data constraint is preventing the operation or read-back. Ensure RLS SELECT policy for `auth.uid() = vendor_id` exists.';
        } else {
            message = `Supabase error during store insert: ${JSON.stringify(createStoreError)}`;
        }
    } else if (!newStore) {
        message = 'Failed to create store record or retrieve it after insert. This strongly suggests an RLS SELECT policy is missing or incorrect for the `stores` table (e.g., `auth.uid() = vendor_id`).';
    }
    console.error('[storeService.createStore] Error creating store. Message:', message, 'Original Supabase Error:', createStoreError || 'No specific Supabase error object returned.');
    return { data: null, error: new Error(message) };
  }
  

  let currentStoreData: StoreFromSupabase = { ...newStore, social_links: [] } as StoreFromSupabase;
  let logoUrlToSave = newStore.logo_url;
  let finalDataAiHint = newStore.data_ai_hint;

  if (logoFile) {
    console.log(`[storeService.createStore] Uploading logo for new store ID: ${newStore.id}`);
    const { publicUrl: uploadedLogoUrl, error: logoUploadError } = await uploadStoreLogo(userId, newStore.id, logoFile);
    
    if (logoUploadError) {
      console.warn('[storeService.createStore] Logo upload failed for new store:', logoUploadError.message, 'Store created, but logo not uploaded.');
    } else if (uploadedLogoUrl) {
      logoUrlToSave = uploadedLogoUrl;
      finalDataAiHint = storeData.data_ai_hint;
    }
  } else if (storeData.logo_url) { 
      logoUrlToSave = storeData.logo_url;
      finalDataAiHint = storeData.data_ai_hint;
  }

  if (logoUrlToSave !== newStore.logo_url || finalDataAiHint !== newStore.data_ai_hint) {
      console.log(`[storeService.createStore] Updating store ${newStore.id} with logo_url: ${logoUrlToSave} and hint: ${finalDataAiHint}`);
      const { data: updatedStoreWithLogo, error: updateLogoError } = await supabase
        .from('stores')
        .update({ logo_url: logoUrlToSave, data_ai_hint: finalDataAiHint })
        .eq('id', newStore.id)
        .select()
        .single();

      if (updateLogoError || !updatedStoreWithLogo) {
        console.warn('[storeService.createStore] Error updating store with logo URL and hint:', updateLogoError, 'Logo might be in storage, but DB record not updated.');
      } else {
        console.log(`[storeService.createStore] Store ${newStore.id} successfully updated with logo info.`);
        currentStoreData = { ...updatedStoreWithLogo, social_links: currentStoreData.social_links } as StoreFromSupabase;
      }
  }

  if (storeData.social_links && storeData.social_links.length > 0) {
    const socialLinksToInsert = storeData.social_links.map(link => ({
      store_id: newStore.id,
      platform: link.platform,
      url: link.url,
    }));

    console.log('[storeService.createStore] Inserting social links:', socialLinksToInsert);
    const { error: socialLinksError } = await supabase
      .from('social_links')
      .insert(socialLinksToInsert);

    if (socialLinksError) {
      console.warn('[storeService.createStore] Error inserting social links:', socialLinksError.message);
    }
  }
  
  console.log(`[storeService.createStore] Re-fetching store ${newStore.id} with all data including social links.`);
  const { data: finalStoreData, error: fetchError } = await supabase
    .from('stores')
    .select('id, vendor_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at, social_links(platform, url)')
    .eq('id', newStore.id)
    .single();

  if (fetchError) {
    console.error('[storeService.createStore] Error re-fetching store with social links:', fetchError.message);
    return { data: currentStoreData, error: new Error(fetchError.message || 'Store created/updated, but failed to re-fetch full details.') };
  }

  console.log('[storeService.createStore] Successfully created and fetched store:', finalStoreData);
  return { data: finalStoreData as StoreFromSupabase, error: null };
}

export async function updateStore(
  storeId: string,
  userId: string, // This userId is auth.uid() and should match stores.vendor_id
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
  const { data: updatedStore, error: updateStoreError } = await supabase
    .from('stores')
    .update(storeUpdates)
    .eq('id', storeId)
    .eq('vendor_id', userId) 
    .select()
    .single();

  if (updateStoreError) {
    let message = 'Failed to update store details.';
     if (updateStoreError.message && typeof updateStoreError.message === 'string' && updateStoreError.message.trim() !== '') {
        message = updateStoreError.message;
    } else if (Object.keys(updateStoreError).length === 0) {
        message = 'Store update failed. This might be due to Row Level Security policies or data constraints.';
    } else {
        message = `Supabase error during store update: ${JSON.stringify(updateStoreError)}`;
    }
    console.error('[storeService.updateStore] Error updating store details:', message, 'Original Supabase Error:', updateStoreError);
    return { data: null, error: new Error(message) };
  }
   if (!updatedStore) {
    const errorMessage = 'Failed to update store or retrieve it after update. Ensure store exists and RLS allows operation for vendor.';
    console.error('[storeService.updateStore] Error updating store:', errorMessage);
    return { data: null, error: new Error(errorMessage) };
  }

  console.log(`[storeService.updateStore] Store ${storeId} details updated. Managing social links.`);
  const { error: deleteSocialLinksError } = await supabase
    .from('social_links')
    .delete()
    .eq('store_id', storeId);

  if (deleteSocialLinksError) {
    console.warn('[storeService.updateStore] Error deleting existing social links:', deleteSocialLinksError.message);
  }

  if (storeData.social_links && storeData.social_links.length > 0) {
    const socialLinksToInsert = storeData.social_links.map(link => ({
      store_id: storeId,
      platform: link.platform,
      url: link.url,
    }));
    console.log('[storeService.updateStore] Inserting new social links:', socialLinksToInsert);
    const { error: insertSocialLinksError } = await supabase
      .from('social_links')
      .insert(socialLinksToInsert);

    if (insertSocialLinksError) {
      console.warn('[storeService.updateStore] Error inserting new social links:', insertSocialLinksError.message);
    }
  }

  console.log(`[storeService.updateStore] Re-fetching store ${storeId} with updated social links.`);
  const { data: finalStoreData, error: fetchError } = await supabase
    .from('stores')
    .select('id, vendor_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at, social_links(platform, url)')
    .eq('id', storeId)
    .single();
  
  if (fetchError) {
    console.error('[storeService.updateStore] Error re-fetching updated store with social links:', fetchError.message);
    return { data: (updatedStore as StoreFromSupabase), error: new Error(fetchError.message || 'Store updated, but failed to re-fetch full details.') };
  }
  
  console.log(`[storeService.updateStore] Store ${storeId} successfully updated and re-fetched:`, finalStoreData);
  return { data: finalStoreData as StoreFromSupabase, error: null };
}

export async function deleteStore(storeId: string, userId: string): Promise<{ error: Error | null }> { // userId is auth.uid()
  console.log(`[storeService.deleteStore] Attempting to delete store ID: ${storeId} for vendor ID: ${userId}`);
  
  // First, delete associated social links (optional, but good practice if not using ON DELETE CASCADE for social_links table itself)
  const { error: deleteSocialLinksError } = await supabase
    .from('social_links')
    .delete()
    .eq('store_id', storeId);

  if (deleteSocialLinksError) {
    console.warn(`[storeService.deleteStore] Could not delete social links for store ${storeId}:`, deleteSocialLinksError.message);
    // Depending on requirements, you might choose to stop here or continue deleting the store
  }
  
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

    