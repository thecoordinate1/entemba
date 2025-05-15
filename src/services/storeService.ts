
// src/services/storeService.ts
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const supabase = createClient();

export interface SocialLinkPayload {
  platform: string;
  url: string;
}

export interface StorePayload {
  name: string;
  description: string;
  category: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
  location?: string | null;
  logo_url?: string | null; // Can be data URI for new uploads or existing URL
  data_ai_hint?: string | null;
  social_links?: SocialLinkPayload[];
}

export interface StoreFromSupabase {
  id: string;
  user_id: string;
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
    id?: string;
    store_id?: string;
    platform: string;
    url: string;
    created_at?: string;
  }[];
}

// Helper to upload store logo
async function uploadStoreLogo(userId: string, storeId: string, file: File): Promise<{ publicUrl: string | null, error: any }> {
  const filePath = `store-logos/${userId}/${storeId}/${Date.now()}_${file.name}`;
  console.log(`[storeService.uploadStoreLogo] Uploading to: ${filePath}`);
  const { error: uploadError } = await supabase.storage
    .from('store-logos') 
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false, 
    });

  if (uploadError) {
    console.error('[storeService.uploadStoreLogo] Error uploading store logo:', uploadError);
    return { publicUrl: null, error: uploadError };
  }

  const { data } = supabase.storage.from('store-logos').getPublicUrl(filePath);
  if (!data?.publicUrl) {
    console.error('[storeService.uploadStoreLogo] Failed to get public URL for logo.');
    return { publicUrl: null, error: { message: 'Failed to get public URL for logo.'} };
  }
  console.log(`[storeService.uploadStoreLogo] Successfully uploaded. Public URL: ${data.publicUrl}`);
  return { publicUrl: data.publicUrl, error: null };
}

export async function getStoresByUserId(userId: string): Promise<{ data: StoreFromSupabase[] | null, error: any }> {
  const { data: storesData, error: storesError } = await supabase
    .from('stores')
    .select(`
      id,
      user_id,
      name,
      description,
      logo_url,
      data_ai_hint,
      status,
      category,
      location,
      created_at,
      updated_at,
      social_links (
        platform,
        url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (storesError) {
    console.error('[storeService.getStoresByUserId] Error fetching stores:', storesError);
    return { data: null, error: storesError };
  }
  
  return { data: (storesData as StoreFromSupabase[]) || [], error: null };
}

export async function createStore(
  userId: string,
  storeData: StorePayload,
  logoFile?: File | null
): Promise<{ data: StoreFromSupabase | null, error: any }> {
  console.log(`[storeService.createStore] Attempting to insert store for user ID: ${userId}`, { storeData, hasLogoFile: !!logoFile });

  // 1. Create the store record (without logo_url initially if file is provided, will update later)
  const initialStoreInsertData = {
    user_id: userId,
    name: storeData.name,
    description: storeData.description,
    category: storeData.category,
    status: storeData.status,
    location: storeData.location,
    logo_url: logoFile ? null : storeData.logo_url, // Only set if no file is to be uploaded
    data_ai_hint: logoFile ? null : storeData.data_ai_hint,
  };

  const { data: newStore, error: createStoreError } = await supabase
    .from('stores')
    .insert(initialStoreInsertData)
    .select() 
    .single(); 

  console.log("[storeService.createStore] Supabase insert response:", { newStore, createStoreError });

  if (createStoreError) {
    console.error('[storeService.createStore] Error creating store record:', createStoreError);
    const errorMessage = createStoreError.message || 'Failed to create store. Possible RLS issue or invalid data.';
    if (Object.keys(createStoreError).length === 0) { // Check if error is an empty object
        return { data: null, error: { message: 'Store creation failed. This might be due to Row Level Security policies or data constraints. Please check console for details and Supabase logs.' } };
    }
    return { data: null, error: { ...createStoreError, message: errorMessage } };
  }
  if (!newStore) {
    console.error('[storeService.createStore] Error creating store record: No data returned from insert, but no Supabase error object. Check RLS.');
    return { data: null, error: { message: 'Failed to create store record or retrieve it after insert. This often indicates a Row Level Security policy is preventing the read-back of the inserted row.' } };
  }

  let currentStoreData: StoreFromSupabase = { ...newStore, social_links: [] } as StoreFromSupabase;
  let logoUrlToSave = newStore.logo_url;
  let finalDataAiHint = newStore.data_ai_hint;

  // 2. Upload logo if provided, now that we have newStore.id
  if (logoFile) {
    console.log(`[storeService.createStore] Uploading logo for new store ID: ${newStore.id}`);
    const { publicUrl: uploadedLogoUrl, error: logoUploadError } = await uploadStoreLogo(userId, newStore.id, logoFile);
    
    if (logoUploadError) {
      console.error('[storeService.createStore] Logo upload failed for new store:', logoUploadError);
      // Store created, but logo upload failed. We will proceed, and the store will not have this new logo.
      // User will need to edit the store to try uploading logo again.
    } else if (uploadedLogoUrl) {
      logoUrlToSave = uploadedLogoUrl;
      finalDataAiHint = storeData.data_ai_hint; // Use the hint associated with the uploaded file
      
      console.log(`[storeService.createStore] Updating store ${newStore.id} with new logo_url: ${logoUrlToSave}`);
      const { data: updatedStoreWithLogo, error: updateLogoError } = await supabase
        .from('stores')
        .update({ logo_url: logoUrlToSave, data_ai_hint: finalDataAiHint })
        .eq('id', newStore.id)
        .select()
        .single();

      if (updateLogoError || !updatedStoreWithLogo) {
        console.error('[storeService.createStore] Error updating store with new logo URL and hint:', updateLogoError);
        // Store created, logo might be in storage, but DB record not updated with new URL.
      } else {
        console.log(`[storeService.createStore] Store ${newStore.id} successfully updated with logo info.`);
        currentStoreData = { ...updatedStoreWithLogo, social_links: [] } as StoreFromSupabase; // Update current view of store data
      }
    }
  } else if (storeData.logo_url !== newStore.logo_url || storeData.data_ai_hint !== newStore.data_ai_hint) {
      // This case handles if the user *removed* an existing logo_url (set it to null) or changed only the hint without a new file.
      console.log(`[storeService.createStore] Updating store ${newStore.id} with provided logo_url/hint (no new file).`);
      const { data: updatedStoreData, error: updateExistingError } = await supabase
        .from('stores')
        .update({ logo_url: storeData.logo_url, data_ai_hint: storeData.data_ai_hint })
        .eq('id', newStore.id)
        .select()
        .single();
      if (updateExistingError || !updatedStoreData) {
        console.error('[storeService.createStore] Error updating store with existing logo_url/hint:', updateExistingError);
      } else {
        currentStoreData = { ...updatedStoreData, social_links: [] } as StoreFromSupabase;
      }
  }

  // 3. Insert social links
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
      console.error('[storeService.createStore] Error inserting social links:', socialLinksError);
      // Log error, but proceed to return the store data gathered so far.
    }
  }
  
  // 4. Re-fetch the store with its social links to ensure data consistency
  console.log(`[storeService.createStore] Re-fetching store ${newStore.id} with all data including social links.`);
  const { data: finalStoreData, error: fetchError } = await supabase
    .from('stores')
    .select(`
      id, user_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at,
      social_links ( platform, url )
    `)
    .eq('id', newStore.id)
    .single();

  if (fetchError) {
    console.error('[storeService.createStore] Error re-fetching store with social links:', fetchError);
    // Return the store data as it was after logo update, but social links might not be accurate.
    return { data: currentStoreData, error: fetchError }; 
  }

  console.log('[storeService.createStore] Successfully created and fetched store:', finalStoreData);
  return { data: finalStoreData as StoreFromSupabase, error: null };
}

export async function updateStore(
  storeId: string,
  userId: string, 
  storeData: StorePayload,
  logoFile?: File | null
): Promise<{ data: StoreFromSupabase | null, error: any }> {
  console.log(`[storeService.updateStore] Attempting to update store ID: ${storeId} for user ID: ${userId}`, { storeData, hasLogoFile: !!logoFile });
  
  let newLogoUrl = storeData.logo_url; 
  let newAiHint = storeData.data_ai_hint;

  if (logoFile) {
    console.log(`[storeService.updateStore] New logo file provided for store ${storeId}, attempting to upload.`);
    const { publicUrl, error: uploadError } = await uploadStoreLogo(userId, storeId, logoFile);
    if (uploadError) {
      console.error('[storeService.updateStore] Error updating store logo:', uploadError);
      // Potentially return error or proceed with other updates
      return { data: null, error: { message: "Failed to upload new logo. Store details not updated.", cause: uploadError } };
    }
    if (publicUrl) {
      newLogoUrl = publicUrl;
      newAiHint = storeData.data_ai_hint; // Use hint from payload as it's for the new file
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
  };

  console.log(`[storeService.updateStore] Updating store ${storeId} details in DB:`, storeUpdates);
  const { data: updatedStore, error: updateStoreError } = await supabase
    .from('stores')
    .update(storeUpdates)
    .eq('id', storeId)
    .eq('user_id', userId) 
    .select()
    .single();

  if (updateStoreError) {
    console.error('[storeService.updateStore] Error updating store details:', updateStoreError);
    const errorMessage = updateStoreError.message || 'Failed to update store. Possible RLS issue or invalid data.';
     if (Object.keys(updateStoreError).length === 0) {
        return { data: null, error: { message: 'Store update failed. This might be due to Row Level Security policies or data constraints.' } };
    }
    return { data: null, error: { ...updateStoreError, message: errorMessage } };
  }
   if (!updatedStore) {
    console.error('[storeService.updateStore] Error updating store: No data returned from update. Check RLS or if store exists for user.');
    return { data: null, error: { message: 'Failed to update store or retrieve it after update. Ensure store exists and RLS allows operation.' } };
  }


  console.log(`[storeService.updateStore] Store ${storeId} details updated. Managing social links.`);
  const { error: deleteSocialLinksError } = await supabase
    .from('social_links')
    .delete()
    .eq('store_id', storeId);

  if (deleteSocialLinksError) {
    console.error('[storeService.updateStore] Error deleting existing social links:', deleteSocialLinksError);
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
      console.error('[storeService.updateStore] Error inserting new social links:', insertSocialLinksError);
    }
  }

  console.log(`[storeService.updateStore] Re-fetching store ${storeId} with updated social links.`);
  const { data: finalStoreData, error: fetchError } = await supabase
    .from('stores')
    .select(`
       id, user_id, name, description, logo_url, data_ai_hint, status, category, location, created_at, updated_at,
      social_links ( platform, url )
    `)
    .eq('id', storeId)
    .single();
  
  if (fetchError) {
    console.error('[storeService.updateStore] Error re-fetching updated store with social links:', fetchError);
    return { data: (updatedStore as StoreFromSupabase), error: fetchError }; // Return partially updated data if final fetch fails
  }
  
  console.log(`[storeService.updateStore] Store ${storeId} successfully updated and re-fetched:`, finalStoreData);
  return { data: finalStoreData as StoreFromSupabase, error: null };
}

export async function deleteStore(storeId: string, userId: string): Promise<{ error: any }> {
  console.log(`[storeService.deleteStore] Attempting to delete store ID: ${storeId} for user ID: ${userId}`);
  // Note: RLS should enforce that only the owner can delete.
  // Supabase Storage RLS policies for `store-logos` should allow deletion by owner based on path.
  // Manually deleting storage objects here can be complex if you don't know exact file names or if multiple files exist.
  // It's often simpler to rely on RLS for storage objects or handle orphaned file cleanup periodically.

  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', storeId)
    .eq('user_id', userId); 

  if (error) {
    console.error('[storeService.deleteStore] Error deleting store:', error);
    const errorMessage = error.message || 'Failed to delete store. Possible RLS issue or store not found.';
     if (Object.keys(error).length === 0) {
        return { error: { message: 'Store deletion failed. This might be due to Row Level Security policies.' } };
    }
    return { error: { ...error, message: errorMessage } };
  }
  console.log(`[storeService.deleteStore] Store ${storeId} successfully deleted from DB.`);
  return { error: null };
}
