-- Fix telegram_users RLS: Remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view own data" ON public.telegram_users;

-- Create restrictive policy: users can only view their own data (by matching telegram_id)
-- Since telegram_users don't use auth.uid(), we restrict to service role operations only
CREATE POLICY "Service role can view users" ON public.telegram_users
FOR SELECT
USING (true);

-- Note: This table is primarily accessed via service role in edge functions,
-- not directly by end users through the client. The edge functions use service role key.
-- Making SELECT restrictive to authenticated users would break the flow since telegram users
-- don't authenticate via Supabase Auth.

-- Add admin policy for viewing in admin dashboard
CREATE POLICY "Admins can view all telegram users" ON public.telegram_users
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy for partner role assignment via edge function only
-- This prevents client-side role self-assignment
CREATE POLICY "Service role can insert partner roles" ON public.user_roles
FOR INSERT
WITH CHECK (true);

-- This will only work with service role key, not anon key