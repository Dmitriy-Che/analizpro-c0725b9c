
-- =========================================================
-- Tighten EXECUTE privileges on SECURITY DEFINER functions
-- =========================================================

-- 1) Server-/edge-function-only helpers: revoke from anon + authenticated.
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'public.purge_expired_reports()',
    'public.mark_order_paid_by_tron(uuid, text)',
    'public.increment_partner_usage(uuid)',
    'public.check_partner_limit(uuid)',
    'public.consume_entitlement(uuid, text)',
    'public.increment_analysis_counter()',
    'public.set_ads_updated_at()'
  ])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;

-- 2) Admin- / authenticated-only helpers: revoke from anon, keep authenticated.
--    Internal has_role()/auth.uid() checks inside the function enforce admin role.
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'public.admin_list_orders()',
    'public.admin_delete_order(uuid)',
    'public.admin_change_order_tariff(uuid, text)',
    'public.admin_process_order(uuid)',
    'public.get_analysis_stats()',
    'public.get_visits_by_day()',
    'public.get_partner_stats(uuid)',
    'public.get_partner_visits_by_day(uuid)',
    'public.get_partner_subscription(uuid)',
    'public.request_subscription_plan(text)'
  ])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END $$;

-- 3) has_role() — used by RLS policies; keep callable by anon + authenticated.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- 4) User-facing RPCs intentionally callable by guests + signed-in users.
--    Internal device_id length checks (>=16) + auth.uid() scoping prevent cross-tenant access.
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'public.get_my_entitlements(text)',
    'public.get_my_order(uuid, text)',
    'public.get_my_reports(text)',
    'public.grant_free_trial(uuid, text)',
    'public.create_order(text, text)',
    'public.mark_order_paid_by_user(uuid, text)',
    'public.claim_guest_data(text)',
    'public.get_public_payment_settings()'
  ])
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', fn);
  END LOOP;
END $$;
