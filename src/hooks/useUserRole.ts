import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'manager' | 'cashier' | 'driver' | null;

export function useUserRole() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows gracefully

      if (error) {
        console.error('Error fetching user role:', error);
        // If no role exists, try to create one (first user becomes admin)
        await assignDefaultRole(userId);
      } else if (data) {
        setRole(data.role as AppRole);
      } else {
        // No role found, assign one
        await assignDefaultRole(userId);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }

  async function assignDefaultRole(userId: string) {
    try {
      // Check if any admin exists
      const { data: adminCheck } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      const roleToAssign: AppRole = (!adminCheck || adminCheck.length === 0) ? 'admin' : 'manager';

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: roleToAssign });

      if (!error) {
        setRole(roleToAssign);
      } else {
        console.error('Error assigning role:', error);
        // If we can't assign, default to treating as manager for basic access
        setRole('manager');
      }
    } catch (error) {
      console.error('Error in assignDefaultRole:', error);
      setRole('manager');
    }
  }

  return { user, role, loading };
}
