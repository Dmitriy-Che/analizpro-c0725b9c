
-- Check if policy already exists from partial earlier migration attempt, drop if so
DROP POLICY IF EXISTS "Partners can request plan" ON public.partner_subscriptions;

CREATE POLICY "Partners can request plan"
ON public.partner_subscriptions
FOR UPDATE
TO authenticated
USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

DROP FUNCTION IF EXISTS public.get_partner_subscription(uuid);

CREATE FUNCTION public.get_partner_subscription(p_partner_id uuid)
 RETURNS TABLE(plan_type text, analyses_limit integer, analyses_used integer, price integer, is_active boolean, activated_at timestamp with time zone, requested_plan text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT plan_type, analyses_limit, analyses_used, price, is_active, activated_at, requested_plan
  FROM public.partner_subscriptions
  WHERE partner_id = p_partner_id AND is_active = true
  LIMIT 1;
$$;
