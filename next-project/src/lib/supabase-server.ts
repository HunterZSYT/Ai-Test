import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Database } from './supabase';

/**
 * Creates a Supabase client for Server Components
 */
export function createServerClient() {
  return createServerComponentClient<Database>({ cookies });
}

/**
 * Verifies if user is authenticated, redirects to login if not
 * @returns User session if authenticated
 */
export async function requireAuth() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  return session;
}

/**
 * Verifies if authenticated user has admin role
 * @returns User session if admin
 */
export async function requireAdmin() {
  const session = await requireAuth();
  const supabase = createServerClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
    
  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }
  
  return session;
}