
-- Lock down SECURITY DEFINER functions: revoke EXECUTE from PUBLIC/anon/authenticated
-- where not intentionally public. Re-grant only where needed.

-- Admin-only functions: only authenticated admins call these (function self-checks role).
REVOKE EXECUTE ON FUNCTION public.admin_list_orders() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_order(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_change_order_tariff(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_process_order(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_subscription_plan(text) FROM PUBLIC, anon;

-- Internal/maintenance functions: should not be called by clients at all.
REVOKE EXECUTE ON FUNCTION public.purge_expired_reports() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_order_paid_by_tron(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_partner_usage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_partner_limit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_analysis_counter() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- Partner/admin analytics: only authenticated users (partner dashboards / admin).
REVOKE EXECUTE ON FUNCTION public.get_visits_by_day() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_partner_visits_by_day(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_partner_stats(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_analysis_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_partner_subscription(uuid) FROM PUBLIC, anon;

-- Anon-callable RPCs already validate ownership via auth.uid() or device_id.
-- Keep EXECUTE for anon + authenticated on these (no change needed; default is PUBLIC).
-- Functions intentionally public: grant_free_trial, get_my_entitlements, get_my_reports,
-- get_my_order, create_order, mark_order_paid_by_user, consume_entitlement,
-- claim_guest_data, get_public_payment_settings.

-- Tighten anon enumeration risk on user_analyses / user_entitlements / user_orders:
-- The scanner warns anon could call the RPCs with an arbitrary device_id. The RPCs
-- already require device_id to match exactly; device_id is a client-generated random
-- UUID, so enumeration is infeasible. We additionally enforce a minimum length and
-- non-empty value at the RPC layer below.

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
     AND (
       (auth.uid() IS NOT NULL AND a.user_id = auth.uid())
       OR (auth.uid() IS NULL AND p_device_id IS NOT NULL AND length(p_device_id) >= 16 AND a.device_id = p_device_id)
     )
   ORDER BY a.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_entitlements(p_device_id text)
 RETURNS TABLE(id uuid, source text, tariff_code text, reports_total integer, reports_used integer, expires_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, source, tariff_code, reports_total, reports_used, expires_at
    FROM public.user_entitlements
   WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid())
      OR (auth.uid() IS NULL AND p_device_id IS NOT NULL AND length(p_device_id) >= 16 AND device_id = p_device_id)
   ORDER BY created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_order(p_order_id uuid, p_device_id text)
 RETURNS TABLE(id uuid, tariff_code text, price_usd numeric, status text, created_at timestamp with time zone, paid_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, tariff_code, price_usd, status, created_at, paid_at
    FROM public.user_orders
   WHERE id = p_order_id
     AND (
       (auth.uid() IS NOT NULL AND user_id = auth.uid())
       OR (auth.uid() IS NULL AND p_device_id IS NOT NULL AND length(p_device_id) >= 16 AND device_id = p_device_id)
       OR public.has_role(auth.uid(),'admin')
     );
$function$;
