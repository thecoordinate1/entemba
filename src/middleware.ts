
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request cookies and response.
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request cookies and response.
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - important to do before checking for user
  const { data: { user } } = await supabase.auth.getUser()

  // Define public paths that don't require authentication
  const authRelatedPublicPaths = ['/login', '/signup', '/auth/callback']; // Paths related to auth flow

  const currentPath = request.nextUrl.pathname;

  // Check if the current path is one of the designated public paths
  const isPublicPath = currentPath === '/' || 
                       currentPath === '/about' ||
                       authRelatedPublicPaths.some(path => currentPath.startsWith(path));

  // If user is not signed in and the current path is not public, redirect to /login
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If user is signed in and tries to access /login or /signup, redirect to dashboard
  if (user && (currentPath.startsWith('/login') || currentPath.startsWith('/signup'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth routes like /auth/callback - this ensures middleware doesn't run for /auth/*)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth).*)',
  ],
}
