
-- 1) Simplify has_role: only check calling user's own roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 2) payment_settings: restrict reads to authenticated
DROP POLICY IF EXISTS "Payment settings public read" ON public.payment_settings;
CREATE POLICY "Payment settings authenticated read"
ON public.payment_settings
FOR SELECT
TO authenticated
USING (true);

-- 3) partners admin policy: scope to authenticated role
DROP POLICY IF EXISTS "Admins can view all partners" ON public.partners;
CREATE POLICY "Admins can view all partners"
ON public.partners
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4) Revoke EXECUTE on SECURITY DEFINER admin/partner functions from anon/public
REVOKE EXECUTE ON FUNCTION public.admin_list_orders() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_process_order(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.purge_expired_reports() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_analysis_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_visits_by_day() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_partner_stats(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_partner_visits_by_day(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_partner_subscription(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_subscription_plan(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_partner_usage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_partner_limit(uuid) FROM PUBLIC, anon, authenticated;

-- Ensure authenticated still can call admin/partner functions (admin checks happen inside)
GRANT EXECUTE ON FUNCTION public.admin_list_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_process_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analysis_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_visits_by_day() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_visits_by_day(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_subscription_plan(text) TO authenticated;

-- service_role retains all privileges by default; edge functions use service role for usage/limit/purge
