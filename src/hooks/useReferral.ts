import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

const REF_PENDING_KEY = 'analizpro_ref_pending'; // код, который надо зарегистрировать
const REF_REGISTERED_KEY = 'analizpro_ref_registered'; // признак, что уже зарегистрировали

export interface ReferralStats {
  code: string | null;
  qualified: number;
  pending: number;
  next_milestone: number | null;
}

/**
 * Считывает ?ref=... из URL и регистрирует приглашение (один раз на устройство).
 * Должен вызываться один раз на верхнем уровне.
 */
export function useReferralCapture() {
  const { deviceId, loading } = useCurrentUser();

  useEffect(() => {
    if (loading || !deviceId) return;
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get('ref');
      if (ref) {
        localStorage.setItem(REF_PENDING_KEY, ref);
        // Чистим URL, чтобы не мозолил
        url.searchParams.delete('ref');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}

    const pending = localStorage.getItem(REF_PENDING_KEY);
    const alreadyDone = localStorage.getItem(REF_REGISTERED_KEY);
    if (!pending || alreadyDone) return;

    (async () => {
      const { data, error } = await supabase.rpc('register_referral', {
        p_ref_code: pending,
        p_device_id: deviceId,
        p_ip: null,
      });
      if (!error) {
        localStorage.setItem(REF_REGISTERED_KEY, '1');
        localStorage.removeItem(REF_PENDING_KEY);
        // Сообщаем компонентам, что есть подарок
        const ok = (data as any)?.ok && (data as any)?.gift;
        if (ok) {
          localStorage.setItem('analizpro_ref_gift_shown', '0');
        }
      }
    })();
  }, [deviceId, loading]);
}

/**
 * Статистика рефералов + способ получить свой код + ссылку для шеринга.
 */
export function useReferralStats() {
  const { deviceId, user, loading: userLoading } = useCurrentUser();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    const { data } = await supabase.rpc('get_my_referral_stats', { p_device_id: deviceId });
    if (data) setStats(data as unknown as ReferralStats);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    if (!userLoading) refresh();
  }, [refresh, userLoading, user?.id]);

  const ensureCode = useCallback(async (): Promise<string | null> => {
    if (stats?.code) return stats.code;
    const { data } = await supabase.rpc('get_or_create_referral_code', { p_device_id: deviceId });
    const code = (data as string) || null;
    if (code) {
      setStats((s) => ({
        code,
        qualified: s?.qualified ?? 0,
        pending: s?.pending ?? 0,
        next_milestone: s?.next_milestone ?? 1,
      }));
    }
    return code;
  }, [deviceId, stats?.code]);

  return { stats, loading, refresh, ensureCode };
}

export function hasReferralGiftPending(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('analizpro_ref_gift_shown') === '0';
}

export function markReferralGiftShown() {
  localStorage.setItem('analizpro_ref_gift_shown', '1');
}

export function buildReferralLink(code: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://analizpro.lovable.app';
  return `${origin}/?ref=${encodeURIComponent(code)}`;
}
