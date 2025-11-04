-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create analysis_logs table to track all analyses
CREATE TABLE public.analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  age INTEGER,
  gender TEXT,
  status TEXT CHECK (status IN ('normal', 'warning', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on analysis_logs
ALTER TABLE public.analysis_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view all logs
CREATE POLICY "Admins can view all analysis logs"
ON public.analysis_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert (for logging purposes)
CREATE POLICY "Allow insert for logging"
ON public.analysis_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to get analysis statistics
CREATE OR REPLACE FUNCTION public.get_analysis_stats()
RETURNS TABLE (
  total_analyses BIGINT,
  today_analyses BIGINT,
  normal_count BIGINT,
  warning_count BIGINT,
  critical_count BIGINT,
  avg_age NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::BIGINT as total_analyses,
    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::BIGINT as today_analyses,
    COUNT(*) FILTER (WHERE status = 'normal')::BIGINT as normal_count,
    COUNT(*) FILTER (WHERE status = 'warning')::BIGINT as warning_count,
    COUNT(*) FILTER (WHERE status = 'critical')::BIGINT as critical_count,
    ROUND(AVG(age), 1) as avg_age
  FROM public.analysis_logs;
$$;