
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
  logo_url?: string | null;
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
    id?: string; // Supabase might return id for existing links
    store_id?: string;
    platform: string;
    url: string;
    created_at?: string;
  }[];
}

// Helper to upload store logo
async function uploadStoreLogo(userId: string, storeId: string, file: File): Promise<{ publicUrl: string | null, error: any }> {
  const filePath = `store-logos/${userId}/${storeId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('store-logos') // Ensure this bucket name is correct
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false, 
    });

  if (uploadError) {
    console.error('Error uploading store logo:', uploadError);
    return { publicUrl: null, error: uploadError };
  }

  const { data } = supabase.storage.from('store-logos').getPublicUrl(filePath);
  if (!data?.publicUrl) {
    return { publicUrl: null, error: { message: 'Failed to get public URL for logo.'} };
  }
  return { publicUrl: data.publicUrl, error: null };
}

export async function getStoresByUserId(userId: string): Promise<{ data: StoreFromSupabase[] | null, error: any }> {
  const { data: storesData, error: storesError } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (storesError) {
    console.error('Error fetching stores:', storesError);
    return { data: null, error: storesError };
  }
  if (!storesData) {
    return { data: [], error: null };
  }

  // For each store, fetch its social links
  const storesWithSocialLinks = await Promise.all(
    storesData.map(async (store) => {
      const { data: socialLinksData, error: socialLinksError } = await supabase
        .from('social_links')
        .select('*')
        .eq('store_id', store.id);

      if (socialLinksError) {
        console.error(`Error fetching social links for store ${store.id}:`, socialLinksError);
        // Continue with the store even if social links fail, or handle error differently
        return { ...store, social_links: [] };
      }
      return { ...store, social_links: socialLinksData || [] };
    })
  );

  return { data: storesWithSocialLinks, error: null };
}

export async function createStore(
  userId: string,
  storeData: StorePayload,
  logoFile?: File | null
): Promise<{ data: StoreFromSupabase | null, error: any }> {
  // 1. Create the store record to get an ID
  const { data: newStore, error: createStoreError } = await supabase
    .from('stores')
    .insert({
      user_id: userId,
      name: storeData.name,
      description: storeData.description,
      category: storeData.category,
      status: storeData.status,
      location: storeData.location,
      // logo_url and data_ai_hint will be updated after logo upload
      data_ai_hint: storeData.data_ai_hint, // Pass initial hint if available
    })
    .select()
    .single();

  if (createStoreError || !newStore) {
    console.error('Error creating store record:', createStoreError);
    return { data: null, error: createStoreError || new Error('Failed to create store record or receive data.') };
  }

  let logoUrlToSave = storeData.logo_url; // Use provided URL if no file
  let finalDataAiHint = storeData.data_ai_hint;

  // 2. Upload logo if provided
  if (logoFile) {
    const { publicUrl: uploadedLogoUrl, error: logoUploadError } = await uploadStoreLogo(userId, newStore.id, logoFile);
    if (logoUploadError) {
      // Decide on error handling: delete the created store? Or proceed without logo?
      // For now, we'll log and proceed, but the logo_url might be null or outdated.
      console.error('Logo upload failed, proceeding without new logo:', logoUploadError);
      // Potentially, you could set a default placeholder or leave it as null
    } else if (uploadedLogoUrl) {
      logoUrlToSave = uploadedLogoUrl;
      // If the user provided a hint for the uploaded file, use that.
      // If storeData.data_ai_hint was for a URL and a new file is uploaded,
      // it might be better to prioritize the hint for the new file,
      // or clear it if not relevant. For now, we use what's passed in storeData.
      finalDataAiHint = storeData.data_ai_hint; 
    }
  }
  
  // 3. Update store with logo URL and final AI hint if they changed
  if (logoUrlToSave !== newStore.logo_url || finalDataAiHint !== newStore.data_ai_hint) {
      const { data: updatedStoreWithLogo, error: updateLogoError } = await supabase
        .from('stores')
        .update({ logo_url: logoUrlToSave, data_ai_hint: finalDataAiHint })
        .eq('id', newStore.id)
        .select()
        .single();

      if (updateLogoError || !updatedStoreWithLogo) {
        console.error('Error updating store with logo URL:', updateLogoError);
        // Store created, but logo URL might not be saved.
        // Return newStore which doesn't have the logo URL from this step
      } else {
        newStore.logo_url = updatedStoreWithLogo.logo_url;
        newStore.data_ai_hint = updatedStoreWithLogo.data_ai_hint;
      }
  }


  // 4. Insert social links
  if (storeData.social_links && storeData.social_links.length > 0) {
    const socialLinksToInsert = storeData.social_links.map(link => ({
      store_id: newStore.id,
      platform: link.platform,
      url: link.url,
    }));

    const { error: socialLinksError } = await supabase
      .from('social_links')
      .insert(socialLinksToInsert);

    if (socialLinksError) {
      console.error('Error inserting social links:', socialLinksError);
      // Store and logo might be created, but social links failed.
      // Depending on requirements, might need to roll back or inform user.
    }
  }
  
  // Re-fetch the store with its social links to return the complete object
  // This is because the initial 'newStore' doesn't have them joined.
  const { data: finalStoreData, error: fetchError } = await supabase
    .from('stores')
    .select(`
      *,
      social_links (
        platform,
        url
      )
    `)
    .eq('id', newStore.id)
    .single();

  if (fetchError) {
    console.error('Error re-fetching store with social links:', fetchError);
    return { data: newStore as StoreFromSupabase, error: fetchError }; // return the store without links if fetch fails
  }

  return { data: finalStoreData as StoreFromSupabase, error: null };
}

// TODO: Implement updateStore
export async function updateStore(
  storeId: string,
  userId: string, // For permission checks / logo path
  storeData: StorePayload,
  logoFile?: File | null
): Promise<{ data: StoreFromSupabase | null, error: any }> {
  // 1. Handle logo upload/update first if a new file is provided
  let newLogoUrl = storeData.logo_url; // Assume current URL unless new file uploaded
  let newAiHint = storeData.data_ai_hint;

  if (logoFile) {
    const { publicUrl, error: uploadError } = await uploadStoreLogo(userId, storeId, logoFile);
    if (uploadError) {
      console.error('Error updating store logo:', uploadError);
      // Decide if this is a critical error. For now, we'll proceed with other updates.
    } else if (publicUrl) {
      newLogoUrl = publicUrl;
      // Prioritize hint from payload if logo file is new, otherwise keep existing
      newAiHint = storeData.data_ai_hint; 
    }
  }

  // 2. Update the store basic details
  const { data: updatedStore, error: updateStoreError } = await supabase
    .from('stores')
    .update({
      name: storeData.name,
      description: storeData.description,
      category: storeData.category,
      status: storeData.status,
      location: storeData.location,
      logo_url: newLogoUrl,
      data_ai_hint: newAiHint,
    })
    .eq('id', storeId)
    .eq('user_id', userId) // Ensure user owns the store
    .select()
    .single();

  if (updateStoreError || !updatedStore) {
    console.error('Error updating store details:', updateStoreError);
    return { data: null, error: updateStoreError || new Error('Failed to update store or retrieve updated record.') };
  }

  // 3. Manage social links (delete existing, then insert new ones)
  // This is a common strategy to handle updates to related one-to-many records.
  const { error: deleteSocialLinksError } = await supabase
    .from('social_links')
    .delete()
    .eq('store_id', storeId);

  if (deleteSocialLinksError) {
    console.error('Error deleting existing social links:', deleteSocialLinksError);
    // Non-critical for store update itself, but links will be inconsistent.
  }

  if (storeData.social_links && storeData.social_links.length > 0) {
    const socialLinksToInsert = storeData.social_links.map(link => ({
      store_id: storeId,
      platform: link.platform,
      url: link.url,
    }));
    const { error: insertSocialLinksError } = await supabase
      .from('social_links')
      .insert(socialLinksToInsert);

    if (insertSocialLinksError) {
      console.error('Error inserting new social links:', insertSocialLinksError);
    }
  }

  // Re-fetch the store with updated social links
  const { data: finalStoreData, error: fetchError } = await supabase
    .from('stores')
    .select(`
      *,
      social_links (
        platform,
        url
      )
    `)
    .eq('id', storeId)
    .single();
  
  if (fetchError) {
    console.error('Error re-fetching updated store with social links:', fetchError);
    return { data: updatedStore as StoreFromSupabase, error: fetchError };
  }
  
  return { data: finalStoreData as StoreFromSupabase, error: null };
}


// TODO: Implement deleteStore
export async function deleteStore(storeId: string, userId: string): Promise<{ error: any }> {
  // Ensure user owns the store before deleting (or use RLS)
  // First, potentially delete associated storage files (e.g., logo)
  // This part is complex as you need to list files in the store's logo directory.
  // For simplicity, RLS on storage should prevent unauthorized deletion,
  // but orphaned files might remain if not handled here.

  // Example: Deleting store record (RLS should enforce ownership)
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', storeId)
    .eq('user_id', userId); // Crucial for security if RLS isn't fully restrictive on this alone

  if (error) {
    console.error('Error deleting store:', error);
  }
  return { error };
}

    