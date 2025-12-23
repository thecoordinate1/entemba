import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface VendorSignUpData {
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_branch_name?: string | null;
  mobile_money_provider?: string | null;
  mobile_money_number?: string | null;
  mobile_money_name?: string | null;
}

const getRedirectUrl = (path: string = '/auth/callback') => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    : typeof window !== 'undefined' ? window.location.origin : '';

  return `${baseUrl}${path}`;
};

/**
 * Sign up a new user and simultaneously create a vendor profile.
 * Optional vendor details are stored in the `vendors` table.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  vendorDetails?: VendorSignUpData
) {
  // combine displayName and optional vendor details into metadata
  const metaData = {
    display_name: displayName,
    ...vendorDetails,
  };

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectUrl(),
      data: metaData, // Pass all details here for the Trigger to pick up
    },
  });

  if (signUpError) {
    return { data: authData, error: signUpError };
  }

  // The database trigger 'on_auth_user_created' now handles the creation 
  // of the 'vendors' profile row using the metadata provided above.

  return { data: authData, error: null };
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("Supabase signInWithPassword error:", error);
    }
    return { data, error };
  } catch (err) {
    console.error("Unexpected error in signInWithEmail:", err);
    return { data: { user: null, session: null }, error: err as any };
  }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl(),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { user: null, error: sessionError };
  if (!session) return { user: null, error: null };

  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function resetPasswordForEmail(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl('/update-password'),
  });
  return { data, error };
}

export async function resendConfirmationEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: getRedirectUrl(),
    }
  });
  return { data, error };
}
