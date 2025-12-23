import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing!");
    throw new Error("Missing Supabase environment variables. Please check your .env file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.");
  }

  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== 'https:') {
      throw new Error(`Invalid Supabase URL protocol: ${url.protocol}. Must be https:`);
    }
  } catch (e) {
    console.error("Invalid Supabase URL:", supabaseUrl);
    throw new Error(`Invalid Supabase URL configuration: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
};
