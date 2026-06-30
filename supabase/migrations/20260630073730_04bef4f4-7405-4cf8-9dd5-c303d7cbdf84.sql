-- Tighten EXECUTE privileges on SECURITY DEFINER functions that should not be
-- callable directly from clients. Public RPCs used by the app retain their grants.

REVOKE EXECUTE ON FUNCTION public.consume_entitlement(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_partner_usage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_analysis_counter() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_order_paid_by_tron(uuid, text) FROM PUBLIC, anon, authenticated;

-- Ensure service_role still has access for edge functions
GRANT EXECUTE ON FUNCTION public.consume_entitlement(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_partner_usage(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_analysis_counter() TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_order_paid_by_tron(uuid, text) TO service_role;