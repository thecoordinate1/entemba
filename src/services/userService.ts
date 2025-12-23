
// src/services/userService.ts
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const supabase = createClient();

export interface VendorProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
  // Payout Information
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch_name: string | null;
  mobile_money_provider: string | null;
  mobile_money_number: string | null;
  mobile_money_name: string | null;
  is_supplier: boolean;
}

export interface VendorProfileUpdatePayload {
  display_name?: string;
  email?: string;
  avatar_url?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_branch_name?: string;
  mobile_money_provider?: string;
  mobile_money_number?: string;
  mobile_money_name?: string;
}

export async function getCurrentVendorProfile(userId: string): Promise<{ profile: VendorProfile | null, error: any }> {
  console.log("[userService.getCurrentVendorProfile] Fetching profile for userId:", userId);
  if (!userId) {
    console.error("[userService.getCurrentVendorProfile] User ID is required.");
    return { profile: null, error: { message: "User ID is required." } };
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[userService.getCurrentVendorProfile] Error fetching vendor profile:', JSON.stringify(error, null, 2));
    return { profile: null, error };
  }

  if (!data) {
    console.log('[userService.getCurrentVendorProfile] No vendor profile found for user ID:', userId);
    // Fallback for newly created users who may not have a profile record yet
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      console.log('[userService.getCurrentVendorProfile] Falling back to auth user data.');
      return {
        profile: {
          id: user.id,
          display_name: user.user_metadata.display_name || user.email,
          email: user.email,
          avatar_url: user.user_metadata.avatar_url,
          bank_name: null,
          bank_account_name: null,
          bank_account_number: null,
          bank_branch_name: null,
          mobile_money_provider: null,
          mobile_money_number: null,
          mobile_money_name: null,
        } as VendorProfile,
        error: null,
      }
    }
    return { profile: null, error: null };
  }
  console.log("[userService.getCurrentVendorProfile] Profile fetched:", data);
  return { profile: data as VendorProfile, error: null };
}

export async function updateCurrentVendorProfile(
  userId: string,
  updates: VendorProfileUpdatePayload
): Promise<{ profile: VendorProfile | null, error: any }> {
  console.log("[userService.updateCurrentVendorProfile] Updating profile for userId:", userId, "with updates:", updates);
  if (!userId) {
    console.error("[userService.updateCurrentVendorProfile] User ID is required.");
    return { profile: null, error: { message: "User ID is required for update." } };
  }

  if (Object.keys(updates).length === 0) {
    console.warn("[userService.updateCurrentVendorProfile] No fields to update.");
    const currentProfile = await getCurrentVendorProfile(userId);
    return { profile: currentProfile.profile, error: { message: "No fields to update." } };
  }

  // First, update the public vendors table
  const { data: profileData, error: profileError } = await supabase
    .from('vendors')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (profileError) {
    console.error('[userService.updateCurrentVendorProfile] Error updating vendor profile:', JSON.stringify(profileError, null, 2));
    return { profile: null, error: profileError };
  }

  // If the profile update was successful and included display_name or avatar_url,
  // also update the user's metadata in the auth.users table.
  if (updates.display_name || updates.avatar_url) {
    const authUpdates: { data?: { display_name?: string; avatar_url?: string } } = { data: {} };
    if (updates.display_name) authUpdates.data!.display_name = updates.display_name;
    if (updates.avatar_url) authUpdates.data!.avatar_url = updates.avatar_url;

    console.log("[userService.updateCurrentVendorProfile] Updating auth user metadata:", authUpdates.data);
    const { error: authError } = await supabase.auth.updateUser(authUpdates);

    if (authError) {
      // This is not a critical failure; the main profile is updated. Log it as a warning.
      console.warn('[userService.updateCurrentVendorProfile] Could not update auth.users metadata:', authError.message);
    }
  }

  console.log("[userService.updateCurrentVendorProfile] Profile updated successfully:", profileData);
  return { profile: profileData as VendorProfile, error: null };
}


export async function uploadAvatar(userId: string, file: File): Promise<{ publicUrl: string | null, error: any }> {
  if (!userId || !file) {
    return { publicUrl: null, error: { message: "User ID and file are required for avatar upload." } };
  }

  const pathWithinBucket = `${userId}/${file.name}-${Date.now()}`;
  console.log(`[userService.uploadAvatar] Uploading avatar to: user-avatars/${pathWithinBucket}`);

  const { error: uploadError } = await supabase.storage
    .from('user-avatars')
    .upload(pathWithinBucket, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('[userService.uploadAvatar] Raw Supabase upload error:', JSON.stringify(uploadError, null, 2));
    let message = 'Failed to upload avatar.';
    if (uploadError.message && typeof uploadError.message === 'string' && uploadError.message.trim() !== '') {
      message = uploadError.message;
    } else if (Object.keys(uploadError).length === 0) {
      message = 'Avatar upload failed. This might be due to bucket RLS policies or storage configuration issues. Ensure the user-avatars bucket exists and policies allow uploads for the authenticated user for the path: ' + pathWithinBucket;
    } else {
      message = `Supabase storage error during avatar upload. Details: ${JSON.stringify(uploadError)}`;
    }
    return { publicUrl: null, error: new Error(message) };
  }

  const { data } = supabase.storage
    .from('user-avatars')
    .getPublicUrl(pathWithinBucket);

  if (!data?.publicUrl) {
    console.error('[userService.uploadAvatar] Failed to get public URL for uploaded avatar.');
    return { publicUrl: null, error: { message: 'Failed to get public URL for avatar.' } };
  }
  console.log(`[userService.uploadAvatar] Avatar uploaded successfully. Public URL: ${data.publicUrl}`);
  return { publicUrl: data.publicUrl, error: null };
}




export async function updateVendorStatus(userId: string, isSupplier: boolean): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('vendors')
      .update({ is_supplier: isSupplier })
      .eq('id', userId);

    if (error) {
      console.error('[userService.updateVendorStatus] Error updating vendor status:', error);
      return { error };
    }
    return { error: null };
  } catch (err) {
    console.error('[userService.updateVendorStatus] Unexpected error:', err);
    return { error: err };
  }
}
