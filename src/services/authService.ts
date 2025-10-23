
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        display_name: displayName,
      }
    },
  });

  if (signUpError) {
    return { data: authData, error: signUpError };
  }

  // If signUp is successful but user is null (e.g., email confirmation required), handle it.
  if (!authData.user) {
    // This case happens when email confirmation is enabled. The user object is in authData.user
    // but the session is null. We can proceed to create the vendor profile.
    // If authData.user is truly null, something is wrong, but Supabase usually returns the user object here.
    if(authData.user === null) {
      return { data: authData, error: new Error("Sign up succeeded but no user object was returned.") };
    }
  }
  
  // Create a corresponding public vendor profile
  const { error: profileError } = await supabase
    .from('vendors')
    .insert({
      id: authData.user.id,
      display_name: displayName,
      email: email,
    });
  
  if (profileError) {
    // This is a tricky situation. The auth user exists, but their public profile failed.
    // For now, we'll log it and return the original sign-up error if any, or this new one.
    console.error("Error creating vendor profile after sign up:", profileError);
    // You might want to have a cleanup process for auth users without profiles
    return { data: authData, error: profileError };
  }


  return { data: authData, error: signUpError };
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
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
    redirectTo: `${window.location.origin}/update-password`,
  });
  return { data, error };
}

export async function resendConfirmationEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup', 
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    }
  });
  return { data, error };
}
