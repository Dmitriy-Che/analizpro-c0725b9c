
-- 1. PARTNERS: hide sensitive contact fields from anonymous users
DROP POLICY IF EXISTS "Anyone can view active partners" ON public.partners;

CREATE OR REPLACE VIEW public.partners_public
WITH (security_invoker = on) AS
SELECT id, name, slug, logo_url, is_active, created_at
FROM public.partners
WHERE is_active = true;

GRANT SELECT ON public.partners_public TO anon, authenticated;

-- 2. USER_ANALYSES: remove world-readable policy
DROP POLICY IF EXISTS "Users can view analyses" ON public.user_analyses;

-- 3. VISITS: stop exposing raw IP addresses to partners.
-- Remove direct partner SELECT (they get aggregated stats via RPCs instead).
DROP POLICY IF EXISTS "Partners can view own visits" ON public.visits;

-- 4. PARTNER_SUBSCRIPTIONS: replace open partner UPDATE with column-restricted RPC.
DROP POLICY IF EXISTS "Partners can request plan" ON public.partner_subscriptions;

CREATE OR REPLACE FUNCTION public.request_subscription_plan(p_plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
BEGIN
  IF p_plan IS NOT NULL AND p_plan NOT IN ('standard','business','premium') THEN
    RAISE EXCEPTION 'Недопустимый тариф';
  END IF;

  SELECT id INTO v_partner_id
  FROM public.partners
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'Партнёр не найден';
  END IF;

  UPDATE public.partner_subscriptions
  SET requested_plan = p_plan
  WHERE partner_id = v_partner_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_subscription_plan(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_subscription_plan(text) TO authenticated;
