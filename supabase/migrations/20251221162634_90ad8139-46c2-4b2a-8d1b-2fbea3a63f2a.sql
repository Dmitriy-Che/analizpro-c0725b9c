-- Create visits table for tracking page visits
CREATE TABLE public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  ip_address text,
  city text,
  country text
);

-- Enable RLS on visits table
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Allow edge function to insert visits (public insert)
CREATE POLICY "Anyone can insert visits" ON public.visits
  FOR INSERT WITH CHECK (true);

-- Only admins can view visits
CREATE POLICY "Admins can view visits" ON public.visits
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add city column to analysis_logs
ALTER TABLE public.analysis_logs ADD COLUMN IF NOT EXISTS city text;

-- Drop and recreate the get_analysis_stats function with extended stats
DROP FUNCTION IF EXISTS public.get_analysis_stats();

CREATE OR REPLACE FUNCTION public.get_analysis_stats()
RETURNS TABLE(
  total_analyses bigint,
  today_analyses bigint,
  normal_count bigint,
  warning_count bigint,
  critical_count bigint,
  avg_age numeric,
  total_visits bigint,
  visits_last_30_days bigint,
  male_count bigint,
  female_count bigint,
  top_cities jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs) as total_analyses,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE created_at::date = CURRENT_DATE) as today_analyses,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE status = 'normal') as normal_count,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE status = 'warning') as warning_count,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE status = 'critical') as critical_count,
    (SELECT ROUND(AVG(age), 1) FROM public.analysis_logs) as avg_age,
    (SELECT COUNT(*)::BIGINT FROM public.visits) as total_visits,
    (SELECT COUNT(*)::BIGINT FROM public.visits WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as visits_last_30_days,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE gender = 'male') as male_count,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE gender = 'female') as female_count,
    (SELECT COALESCE(jsonb_agg(city_data), '[]'::jsonb) FROM (
      SELECT jsonb_build_object('city', city, 'count', COUNT(*)) as city_data
      FROM public.visits
      WHERE city IS NOT NULL AND city != ''
      GROUP BY city
      ORDER BY COUNT(*) DESC
      LIMIT 5
    ) subq) as top_cities;
$$;

-- Create function to get visits by day for last 30 days
CREATE OR REPLACE FUNCTION public.get_visits_by_day()
RETURNS TABLE(
  visit_date date,
  visit_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY created_at::date
  ) v ON d::date = v.dt
  ORDER BY visit_date;
$$;