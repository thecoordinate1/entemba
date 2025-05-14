
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
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
    type: 'signup', // Or 'email_change' if you implement that later
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    }
  });
  return { data, error };
}

// You might add more functions here, e.g., for OAuth sign-in, password updates, etc.

