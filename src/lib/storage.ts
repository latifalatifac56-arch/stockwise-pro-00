// Storage utilities migrated to Supabase authentication
// This file is kept for compatibility but no longer uses localStorage for auth

import { supabase } from '@/integrations/supabase/client';

/**
 * @deprecated Use useUserRole hook instead
 * Get current authenticated user from Supabase
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * @deprecated Authentication is managed by Supabase
 */
export function setCurrentUser() {
  console.warn('setCurrentUser is deprecated. Authentication is managed by Supabase.');
}

/**
 * @deprecated Use supabase.auth.signOut() instead
 */
export function clearCurrentUser() {
  console.warn('clearCurrentUser is deprecated. Use supabase.auth.signOut() instead.');
}

/**
 * @deprecated Check auth status via Supabase session
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}
