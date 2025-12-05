import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id?: string;
  user_id: string;
  username: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: string | null;
  timestamp?: string;
}

/**
 * Log an action to the audit trail using Supabase
 */
export async function logAction(
  action: string,
  entity: string,
  entityId?: number | string,
  details?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Cannot log action: No authenticated user');
      return;
    }

    // Get user profile for full name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const username = profile?.full_name || user.email || 'Unknown User';

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        username,
        action,
        entity,
        entity_id: entityId?.toString(),
        details,
      });

    if (error) {
      console.error('Error logging audit action:', error);
    }
  } catch (error) {
    console.error('Error in logAction:', error);
  }
}

/**
 * @deprecated Use Supabase query directly
 */
export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
}

/**
 * @deprecated Use Supabase query directly
 */
export async function getEntityAuditLogs(
  entity: string,
  entityId: string
): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity', entity)
    .eq('entity_id', entityId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching entity audit logs:', error);
    return [];
  }

  return data || [];
}
