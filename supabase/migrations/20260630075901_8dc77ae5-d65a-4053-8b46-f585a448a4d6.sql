DROP FUNCTION IF EXISTS public.get_my_reports(text);
CREATE OR REPLACE FUNCTION public.get_my_reports(p_device_id text)
 RETURNS TABLE(id uuid, title text, study_type text, age integer, gender text, language_detected text, result_json jsonb, full_result text, created_at timestamp with time zone, expires_at timestamp with time zone, tariff_code text, tariff_title text, order_number bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT a.id, a.title, a.study_type, a.age, a.gender, a.language_detected, a.result_json, a.full_result, a.created_at, a.expires_at,
         e.tariff_code,
         t.title AS tariff_title,
         o.order_number
    FROM public.user_analyses a
    LEFT JOIN public.user_entitlements e ON e.id = a.entitlement_id
    LEFT JOIN public.tariffs t ON t.code = e.tariff_code
    LEFT JOIN public.user_orders o ON o.id = e.order_id
   WHERE a.expires_at > now()
     AND ((auth.uid() IS NOT NULL AND a.user_id = auth.uid())
       OR (p_device_id IS NOT NULL AND p_device_id <> '' AND a.device_id = p_device_id))
   ORDER BY a.created_at DESC;
$function$;
REVOKE EXECUTE ON FUNCTION public.get_my_reports(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_reports(text) TO anon, authenticated, service_role;