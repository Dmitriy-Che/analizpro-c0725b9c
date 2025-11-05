-- Remove the insecure INSERT policy that allows anyone to insert
DROP POLICY IF EXISTS "Allow insert for logging" ON public.analysis_logs;

-- Logging will now only work through edge functions using service role key
-- which bypasses RLS automatically, providing better security