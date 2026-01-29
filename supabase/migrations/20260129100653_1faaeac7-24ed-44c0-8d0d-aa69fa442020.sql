-- Step 1: Add 'partner' role to existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';

-- Step 2: Create partners table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Add partner_id column to analysis_logs
ALTER TABLE public.analysis_logs 
ADD COLUMN partner_id UUID REFERENCES public.partners(id);

-- Create index for faster filtering
CREATE INDEX idx_analysis_logs_partner_id ON public.analysis_logs(partner_id);

-- Step 4: Add partner_id column to visits
ALTER TABLE public.visits 
ADD COLUMN partner_id UUID REFERENCES public.partners(id);

CREATE INDEX idx_visits_partner_id ON public.visits(partner_id);

-- Step 5: Enable RLS on partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for partners table

-- Partners can view their own data
CREATE POLICY "Partners can view own data" ON public.partners
  FOR SELECT USING (user_id = auth.uid());

-- Partners can update their own data
CREATE POLICY "Partners can update own data" ON public.partners
  FOR UPDATE USING (user_id = auth.uid());

-- Partners can insert their own data (for registration)
CREATE POLICY "Partners can insert own data" ON public.partners
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all partners
CREATE POLICY "Admins can view all partners" ON public.partners
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can view active partners by slug (for public clinic pages)
CREATE POLICY "Anyone can view active partners" ON public.partners
  FOR SELECT USING (is_active = true);

-- Step 7: Update RLS policies for analysis_logs to allow partners to view their own stats
CREATE POLICY "Partners can view own analysis logs" ON public.analysis_logs
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );

-- Step 8: Update RLS policies for visits to allow partners to view their own stats
CREATE POLICY "Partners can view own visits" ON public.visits
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );

-- Step 9: Create function to get partner statistics
CREATE OR REPLACE FUNCTION public.get_partner_stats(p_partner_id UUID)
RETURNS TABLE(
  total_analyses BIGINT,
  today_analyses BIGINT,
  normal_count BIGINT,
  warning_count BIGINT,
  critical_count BIGINT,
  avg_age NUMERIC,
  total_visits BIGINT,
  visits_last_30_days BIGINT,
  male_count BIGINT,
  female_count BIGINT,
  top_cities JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE partner_id = p_partner_id) as total_analyses,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE partner_id = p_partner_id AND created_at::date = CURRENT_DATE) as today_analyses,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE partner_id = p_partner_id AND status = 'normal') as normal_count,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE partner_id = p_partner_id AND status = 'warning') as warning_count,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE partner_id = p_partner_id AND status = 'critical') as critical_count,
    (SELECT ROUND(AVG(age), 1) FROM public.analysis_logs WHERE partner_id = p_partner_id) as avg_age,
    (SELECT COUNT(*)::BIGINT FROM public.visits WHERE partner_id = p_partner_id) as total_visits,
    (SELECT COUNT(*)::BIGINT FROM public.visits WHERE partner_id = p_partner_id AND created_at >= CURRENT_DATE - INTERVAL '30 days') as visits_last_30_days,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE partner_id = p_partner_id AND gender = 'male') as male_count,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE partner_id = p_partner_id AND gender = 'female') as female_count,
    (SELECT COALESCE(jsonb_agg(city_data), '[]'::jsonb) FROM (
      SELECT jsonb_build_object('city', city, 'count', COUNT(*)) as city_data
      FROM public.visits
      WHERE partner_id = p_partner_id AND city IS NOT NULL AND city != ''
      GROUP BY city
      ORDER BY COUNT(*) DESC
      LIMIT 5
    ) subq) as top_cities;
$$;

-- Step 10: Create function to get visits by day for partner
CREATE OR REPLACE FUNCTION public.get_partner_visits_by_day(p_partner_id UUID)
RETURNS TABLE(visit_date DATE, visit_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d::date as visit_date,
    COALESCE(v.cnt, 0)::BIGINT as visit_count
  FROM generate_series(
    CURRENT_DATE - INTERVAL '29 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) d
  LEFT JOIN (
    SELECT created_at::date as dt, COUNT(*) as cnt
    FROM public.visits
    WHERE partner_id = p_partner_id AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY created_at::date
  ) v ON d::date = v.dt
  ORDER BY visit_date;
$$;