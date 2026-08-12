import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PlatformMode = 'b2c' | 'b2b' | 'both';

export const PLATFORM_MODE_QUERY_KEY = ['platform_mode'];

async function fetchPlatformMode(): Promise<PlatformMode> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_mode')
    .maybeSingle();

  if (error || !data?.value) return 'both';
  const value = data.value as PlatformMode;
  return value === 'b2c' || value === 'b2b' || value === 'both' ? value : 'both';
}

export function usePlatformMode() {
  const { data, isLoading } = useQuery({
    queryKey: PLATFORM_MODE_QUERY_KEY,
    queryFn: fetchPlatformMode,
    staleTime: 60_000,
  });

  const mode: PlatformMode = data ?? 'both';

  return {
    mode,
    isLoading,
    // Пока настройка грузится — ничего не блокируем (безопасный дефолт "both")
    b2cEnabled: mode === 'b2c' || mode === 'both',
    b2bEnabled: mode === 'b2b' || mode === 'both',
  };
}

export function useInvalidatePlatformMode() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: PLATFORM_MODE_QUERY_KEY });
}
