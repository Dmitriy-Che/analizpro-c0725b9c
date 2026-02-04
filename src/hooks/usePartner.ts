import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Partner {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

interface PartnerStats {
  total_analyses: number;
  today_analyses: number;
  normal_count: number;
  warning_count: number;
  critical_count: number;
  avg_age: number | null;
  total_visits: number;
  visits_last_30_days: number;
  male_count: number;
  female_count: number;
  top_cities: { city: string; count: number }[];
}

interface PartnerSubscription {
  plan_type: string;
  analyses_limit: number;
  analyses_used: number;
  price: number;
  is_active: boolean;
  activated_at: string;
}

interface VisitByDay {
  visit_date: string;
  visit_count: number;
}

export function usePartner() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // Not found is OK
            setError(error.message);
          }
        } else {
          setPartner(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setPartner(null);
        navigate('/partner/login');
      } else if (session?.user) {
        fetchPartner();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchStats = async (): Promise<PartnerStats | null> => {
    if (!partner) return null;

    const { data, error } = await supabase.rpc('get_partner_stats', {
      p_partner_id: partner.id
    });

    if (error) {
      console.error('Error fetching partner stats:', error);
      return null;
    }

    if (!data?.[0]) return null;

    const rawStats = data[0];
    return {
      ...rawStats,
      top_cities: (rawStats.top_cities as unknown as { city: string; count: number }[]) || []
    };
  };

  const fetchVisitsByDay = async (): Promise<VisitByDay[]> => {
    if (!partner) return [];

    const { data, error } = await supabase.rpc('get_partner_visits_by_day', {
      p_partner_id: partner.id
    });

    if (error) {
      console.error('Error fetching visits by day:', error);
      return [];
    }

    return data || [];
  };

  const fetchSubscription = async (): Promise<PartnerSubscription | null> => {
    if (!partner) return null;

    const { data, error } = await supabase.rpc('get_partner_subscription', {
      p_partner_id: partner.id
    });

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    if (!data || data.length === 0) return null;
    
    return data[0] as PartnerSubscription;
  };

  const updatePartner = async (updates: Partial<Partner>) => {
    if (!partner) return { error: 'No partner' };

    const { error } = await supabase
      .from('partners')
      .update(updates)
      .eq('id', partner.id);

    if (!error) {
      setPartner({ ...partner, ...updates });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setPartner(null);
    navigate('/partner/login');
  };

  return {
    partner,
    loading,
    error,
    fetchStats,
    fetchVisitsByDay,
    fetchSubscription,
    updatePartner,
    signOut
  };
}

export function usePartnerBySlug(slug: string | undefined) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartner = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (error) {
          setError('Клиника не найдена');
        } else {
          setPartner(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [slug]);

  return { partner, loading, error };
}

export function generateSlug(name: string): string {
  // Transliteration map for Cyrillic
  const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  return name
    .toLowerCase()
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
    .replace(/^-|-$/g, '');
}
