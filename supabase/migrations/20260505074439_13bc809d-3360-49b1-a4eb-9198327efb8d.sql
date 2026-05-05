-- 1. Harden has_role to prevent cross-user role enumeration
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() = _user_id THEN
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
    ELSE false
  END;
$$;

-- 2. Restrict permissive INSERT/UPDATE policies to service_role only
-- visits: still allow anonymous inserts via edge function (uses service role), block direct client inserts
DROP POLICY IF EXISTS "Anyone can insert visits" ON public.visits;
CREATE POLICY "Service role can insert visits"
ON public.visits FOR INSERT
TO service_role
WITH CHECK (true);

-- telegram_users: lock down to service role
DROP POLICY IF EXISTS "Service role can insert users" ON public.telegram_users;
DROP POLICY IF EXISTS "Service role can update users" ON public.telegram_users;
DROP POLICY IF EXISTS "Service role can view users" ON public.telegram_users;
CREATE POLICY "Service role manages telegram users insert"
ON public.telegram_users FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role manages telegram users update"
ON public.telegram_users FOR UPDATE TO service_role USING (true);
CREATE POLICY "Service role views telegram users"
ON public.telegram_users FOR SELECT TO service_role USING (true);

-- user_analyses
DROP POLICY IF EXISTS "Service role can insert analyses" ON public.user_analyses;
CREATE POLICY "Service role can insert analyses"
ON public.user_analyses FOR INSERT TO service_role WITH CHECK (true);

-- user_roles
DROP POLICY IF EXISTS "Service role can insert partner roles" ON public.user_roles;
CREATE POLICY "Service role can insert partner roles"
ON public.user_roles FOR INSERT TO service_role WITH CHECK (true);
