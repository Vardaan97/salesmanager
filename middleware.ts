/**
 * Next.js Middleware for Koenig Sales Portal
 *
 * Handles security headers and Supabase session refresh.
 * Client-side AuthContext handles actual authentication redirects.
 *
 * This simplified middleware:
 * - Adds security headers to all responses
 * - Refreshes Supabase session cookies when present
 * - Does NOT block routes - client-side handles redirects
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Check if Supabase is properly configured
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const IS_SUPABASE_CONFIGURED = !!(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== 'your-project-url' &&
  !SUPABASE_URL.includes('example') &&
  SUPABASE_URL.includes('.supabase.co')
);

// Static paths that should skip all processing
const STATIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/manifest.json',
];

/**
 * Check if path is a static asset
 */
function isStaticPath(pathname: string): boolean {
  return STATIC_PATHS.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets entirely
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  // Create response with security headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add security headers to all responses
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // If Supabase is not configured, just return with security headers
  if (!IS_SUPABASE_CONFIGURED) {
    return response;
  }

  // Create Supabase client for session refresh
  const supabase = createServerClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          // Re-add security headers after creating new response
          response.headers.set('X-Frame-Options', 'DENY');
          response.headers.set('X-Content-Type-Options', 'nosniff');
          response.headers.set('X-XSS-Protection', '1; mode=block');
          response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh the session
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      response.headers.set('x-user-id', session.user.id);
      response.headers.set('x-user-email', session.user.email || '');
    }
  } catch (error) {
    console.error('[Middleware] Session refresh error:', error);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
