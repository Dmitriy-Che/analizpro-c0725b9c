import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

const FLAG_KEY = 'analizpro_tg_miniapp_signed_in';

export function useTelegramAutoAuth() {
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const initData = window.Telegram?.WebApp?.initData;
    return !!initData && !sessionStorage.getItem(FLAG_KEY);
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const initData = tg?.initData;
        if (!initData) {
          setLoading(false);
          return;
        }

        tg?.ready?.();
        tg?.expand?.();

        if (sessionStorage.getItem(FLAG_KEY)) {
          setLoading(false);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          sessionStorage.setItem(FLAG_KEY, '1');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('telegram-miniapp-auth', {
          body: { initData },
        });

        if (cancelled) return;

        if (error || !data?.session) {
          console.error('Telegram auto-auth failed:', error, data);
          setLoading(false);
          return;
        }

        const { error: setErr } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (setErr) {
          console.error('setSession failed:', setErr);
        } else {
          sessionStorage.setItem(FLAG_KEY, '1');
        }
      } catch (e) {
        console.error('Telegram auto-auth exception:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading };
}
