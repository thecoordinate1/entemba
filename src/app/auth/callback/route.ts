
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful email confirmation
      // You might want to redirect to a specific "welcome" page or profile setup
      return NextResponse.redirect(`${origin}/dashboard`);
    }
    console.error('Error exchanging code for session:', error.message);
  } else {
    console.error('No code found in auth callback URL.');
  }

  // If there's an error or no code, redirect to an error page or login page with an error message
  // It's often better to redirect to a page that can display a user-friendly error message.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&message=${encodeURIComponent(requestUrl.searchParams.get('error_description') || 'Email confirmation failed. Please try again or contact support.')}`);
}
