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
}

export async function getCurrentVendorProfile(userId: string): Promise<{ profile: VendorProfile | null, error: any }> {
  if (!userId) {
    console.error("getCurrentVendorProfile: User ID is required.");
    return { profile: null, error: { message: "User ID is required." } };
  }

  const { data, error } = await supabase
    .from('vendors') // Ensure this table name matches your Supabase schema
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: No rows found, not necessarily an error for a profile check
    console.error('Error fetching vendor profile:', error);
    return { profile: null, error };
  }
  
  if (!data) {
    // console.log('No vendor profile found for user ID:', userId);
    return { profile: null, error: null }; // Or error: { message: 'Profile not found' } if that's preferred
  }

  return { profile: data as VendorProfile, error: null };
}

export async function updateCurrentVendorProfile(
  userId: string,
  updates: {
    display_name?: string;
    email?: string; // Ensure email is part of updates if it's meant to be updatable here
    avatar_url?: string;
  }
): Promise<{ profile: VendorProfile | null, error: any }> {
  if (!userId) {
    console.error("updateCurrentVendorProfile: User ID is required.");
    return { profile: null, error: { message: "User ID is required for update." } };
  }

  // Prevent updating primary key or other restricted fields if 'updates' could contain them
  const allowedUpdates: Partial<VendorProfile> = {};
  if (updates.display_name !== undefined) allowedUpdates.display_name = updates.display_name;
  if (updates.email !== undefined) allowedUpdates.email = updates.email; // Add email if updatable
  if (updates.avatar_url !== undefined) allowedUpdates.avatar_url = updates.avatar_url;
  
  if (Object.keys(allowedUpdates).length === 0) {
    console.warn("updateCurrentVendorProfile: No valid fields to update.");
    // Optionally fetch and return current profile if no updates are made
    // return getCurrentVendorProfile(userId); 
    return { profile: null, error: {message: "No valid fields to update."}};
  }


  const { data, error } = await supabase
    .from('vendors')
    .update(allowedUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating vendor profile:', error);
    return { profile: null, error };
  }

  return { profile: data as VendorProfile, error: null };
}

export async function uploadAvatar(userId: string, file: File): Promise<{ publicUrl: string | null, error: any }> {
  if (!userId || !file) {
    return { publicUrl: null, error: { message: "User ID and file are required for avatar upload." } };
  }

  const filePath = `user-avatars/${userId}/${file.name}-${Date.now()}`; // Add timestamp to avoid overwriting with same name
  
  const { error: uploadError } = await supabase.storage
    .from('user-avatars') // Ensure this bucket name is correct ('user-avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Using upsert: true is fine if you want to overwrite
    });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    return { publicUrl: null, error: uploadError };
  }

  const { data } = supabase.storage
    .from('user-avatars')
    .getPublicUrl(filePath);

  if (!data?.publicUrl) {
    console.error('Failed to get public URL for uploaded avatar.');
    return { publicUrl: null, error: { message: 'Failed to get public URL for avatar.'} };
  }
  
  return { publicUrl: data.publicUrl, error: null };
}
