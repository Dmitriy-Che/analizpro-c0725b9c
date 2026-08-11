CREATE OR REPLACE FUNCTION public.get_analysis_stats(p_days integer DEFAULT NULL)
RETURNS TABLE(total_analyses bigint, today_analyses bigint, normal_count bigint, warning_count bigint, critical_count bigint, avg_age numeric, total_visits bigint, visits_last_30_days bigint, male_count bigint, female_count bigint, top_cities jsonb)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE p_days IS NULL OR created_at >= CURRENT_DATE - (p_days || ' days')::interval) as total_analyses,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE created_at::date = CURRENT_DATE) as today_analyses,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE status = 'normal' AND (p_days IS NULL OR created_at >= CURRENT_DATE - (p_days || ' days')::interval)) as normal_count,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE status = 'warning' AND (p_days IS NULL OR created_at >= CURRENT_DATE - (p_days || ' days')::interval)) as warning_count,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE status = 'critical' AND (p_days IS NULL OR created_at >= CURRENT_DATE - (p_days || ' days')::interval)) as critical_count,
    (SELECT ROUND(AVG(age), 1) FROM public.analysis_logs WHERE p_days IS NULL OR created_at >= CURRENT_DATE - (p_days || ' days')::interval) as avg_age,
    (SELECT COUNT(*)::BIGINT FROM public.visits) as total_visits,
    (SELECT COUNT(*)::BIGINT FROM public.visits WHERE p_days IS NULL OR created_at >= CURRENT_DATE - (p_days || ' days')::interval) as visits_last_30_days,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE gender = 'male' AND (p_days IS NULL OR created_at >= CURRENT_DATE - (p_days || ' days')::interval)) as male_count,
    (SELECT COUNT(*)::BIGINT FROM public.analysis_logs WHERE gender = 'female' AND (p_days IS NULL OR created_at >= CURRENT_DATE - (p_days || ' days')::interval)) as female_count,
    (SELECT COALESCE(jsonb_agg(city_data), '[]'::jsonb) FROM (
      SELECT jsonb_build_object('city', city, 'count', COUNT(*)) as city_data
      FROM public.visits
      WHERE city IS NOT NULL AND city != ''
      AND (p_days IS NULL OR created_at >= CURRENT_DATE - (p_days || ' days')::interval)
      GROUP BY city
      ORDER BY COUNT(*) DESC
      LIMIT 5
    ) subq) as top_cities;
$function$;

CREATE OR REPLACE FUNCTION public.get_visits_by_day(p_days integer DEFAULT 30)
RETURNS TABLE(visit_date date, visit_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    d::date as visit_date,
    COALESCE(v.cnt, 0)::BIGINT as visit_count
  FROM generate_series(
    CURRENT_DATE - ((COALESCE(p_days, 365) - 1) || ' days')::interval,
    CURRENT_DATE,
    INTERVAL '1 day'
  ) d
  LEFT JOIN (
    SELECT created_at::date as dt, COUNT(*) as cnt
    FROM public.visits
    WHERE p_days IS NULL OR created_at >= CURRENT_DATE - (p_days || ' days')::interval
    GROUP BY created_at::date
  ) v ON d::date = v.dt
  ORDER BY visit_date;
$function$;