import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

export interface Entitlement {
  id: string;
  source: 'free_trial' | 'order' | 'admin_grant';
  tariff_code: string | null;
  reports_total: number;
  reports_used: number;
  expires_at: string | null;
}

export function useEntitlements() {
  const { deviceId, user, loading: userLoading } = useCurrentUser();
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_my_entitlements', { p_device_id: deviceId });
    if (!error && data) setEntitlements(data as Entitlement[]);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    if (!userLoading) refresh();
  }, [refresh, userLoading, user?.id]);

  const remaining = entitlements.reduce((sum, e) => {
    const now = Date.now();
    const valid = !e.expires_at || new Date(e.expires_at).getTime() > now;
    if (!valid) return sum;
    return sum + Math.max(0, e.reports_total - e.reports_used);
  }, 0);

  const hasAvailable = remaining > 0;

  const claimFreeTrial = useCallback(async () => {
    await supabase.rpc('grant_free_trial', {
      p_user_id: user?.id ?? null,
      p_device_id: deviceId,
    });
    await refresh();
  }, [user?.id, deviceId, refresh]);

  return { entitlements, remaining, hasAvailable, loading, refresh, claimFreeTrial };
}
