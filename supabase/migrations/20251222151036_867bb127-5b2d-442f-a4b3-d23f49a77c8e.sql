-- Create telegram_users table
CREATE TABLE public.telegram_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id text UNIQUE NOT NULL,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view own data"
ON public.telegram_users
FOR SELECT
USING (true);

-- Allow insert from edge function (service role)
CREATE POLICY "Service role can insert users"
ON public.telegram_users
FOR INSERT
WITH CHECK (true);

-- Allow update from edge function (service role)
CREATE POLICY "Service role can update users"
ON public.telegram_users
FOR UPDATE
USING (true);

-- Create user_analyses table
CREATE TABLE public.user_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id text NOT NULL REFERENCES public.telegram_users(telegram_id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  study_type text,
  age integer,
  gender text,
  result_summary text,
  full_result text
);

-- Enable RLS
ALTER TABLE public.user_analyses ENABLE ROW LEVEL SECURITY;

-- Users can view analyses
CREATE POLICY "Users can view analyses"
ON public.user_analyses
FOR SELECT
USING (true);

-- Allow insert from edge function
CREATE POLICY "Service role can insert analyses"
ON public.user_analyses
FOR INSERT
WITH CHECK (true);

-- Admins can view all analyses
CREATE POLICY "Admins can view all analyses"
ON public.user_analyses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));