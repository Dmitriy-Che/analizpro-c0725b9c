CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform settings public read"
ON public.platform_settings FOR SELECT
USING (true);

CREATE POLICY "Admins insert platform settings"
ON public.platform_settings FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update platform settings"
ON public.platform_settings FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.platform_settings (key, value) VALUES ('platform_mode', 'both');