
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
  bank_account_holder: string | null;
  bank_account_number: string | null;
  bank_branch_name: string | null;
  mobile_money_provider: string | null;
  mobile_money_number: string | null;
  mobile_money_name: string | null;
}

export interface VendorProfileUpdatePayload {
  display_name?: string;
  email?: string; 
  avatar_url?: string;
  bank_name?: string;
  bank_account_holder?: string;
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
    return { profile: currentProfile.profile, error: {message: "No fields to update."}};
  }

  const { data, error } = await supabase
    .from('vendors')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[userService.updateCurrentVendorProfile] Error updating vendor profile:', JSON.stringify(error, null, 2));
    return { profile: null, error };
  }
  console.log("[userService.updateCurrentVendorProfile] Profile updated successfully:", data);
  return { profile: data as VendorProfile, error: null };
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
    return { publicUrl: null, error: { message: 'Failed to get public URL for avatar.'} };
  }
  console.log(`[userService.uploadAvatar] Avatar uploaded successfully. Public URL: ${data.publicUrl}`);
  return { publicUrl: data.publicUrl, error: null };
}
