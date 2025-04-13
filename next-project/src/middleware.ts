import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Check if we have a session
  const { data: { session } } = await supabase.auth.getSession();

  // If no session or trying to access admin routes, redirect to login
  if (!session && request.nextUrl.pathname.startsWith('/admin')) {
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // For admin routes, check if user has admin role
  if (session && request.nextUrl.pathname.startsWith('/admin')) {
    // Get the user's profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // If not admin, redirect to homepage
    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return res;
}

// Configure the middleware to run only on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};