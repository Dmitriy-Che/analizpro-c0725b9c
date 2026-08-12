import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useIsAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ['is_admin'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return false;
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!role;
    },
    staleTime: 60_000,
  });

  return { isAdmin: !!data, isLoading };
}
