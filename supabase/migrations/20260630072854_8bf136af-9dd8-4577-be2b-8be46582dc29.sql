DROP POLICY IF EXISTS "Partners can insert own data" ON public.partners;

CREATE POLICY "Partners can insert own data"
  ON public.partners
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());