-- Create analysis counter table
CREATE TABLE IF NOT EXISTS public.analysis_counter (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial counter
INSERT INTO public.analysis_counter (count) VALUES (1369);

-- Create function to increment counter
CREATE OR REPLACE FUNCTION public.increment_analysis_counter()
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.analysis_counter
  SET count = count + 1, updated_at = now()
  WHERE id = (SELECT id FROM public.analysis_counter ORDER BY created_at ASC LIMIT 1)
  RETURNING count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.analysis_counter ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view counter"
ON public.analysis_counter
FOR SELECT
USING (true);

-- Create policy for increment function (only through function)
CREATE POLICY "Only function can update counter"
ON public.analysis_counter
FOR UPDATE
USING (false)
WITH CHECK (false);