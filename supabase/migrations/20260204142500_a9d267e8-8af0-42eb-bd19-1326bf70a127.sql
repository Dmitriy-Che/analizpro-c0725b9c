-- Таблица подписок партнёров
CREATE TABLE public.partner_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'standard' CHECK (plan_type IN ('standard', 'business', 'premium')),
  analyses_limit INTEGER NOT NULL DEFAULT 500,
  analyses_used INTEGER NOT NULL DEFAULT 0,
  price INTEGER NOT NULL DEFAULT 30000,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(partner_id)
);

-- История подписок
CREATE TABLE public.subscription_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  analyses_limit INTEGER NOT NULL,
  price INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('activated', 'limit_changed', 'renewed')),
  admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS для partner_subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.partner_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can view own subscription"
  ON public.partner_subscriptions FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins can insert subscriptions"
  ON public.partner_subscriptions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscriptions"
  ON public.partner_subscriptions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS для subscription_history
CREATE POLICY "Admins can view all history"
  ON public.subscription_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can view own history"
  ON public.subscription_history FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

-- Функция проверки лимита (SECURITY DEFINER для вызова из edge function)
CREATE OR REPLACE FUNCTION public.check_partner_limit(p_partner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
  v_active BOOLEAN;
BEGIN
  SELECT analyses_used, analyses_limit, is_active
  INTO v_used, v_limit, v_active
  FROM public.partner_subscriptions
  WHERE partner_id = p_partner_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF NOT v_active THEN
    RETURN FALSE;
  END IF;
  
  RETURN v_used < v_limit;
END;
$$;

-- Функция инкремента использования (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.increment_partner_usage(p_partner_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.partner_subscriptions
  SET analyses_used = analyses_used + 1
  WHERE partner_id = p_partner_id AND is_active = true;
END;
$$;

-- Функция получения подписки партнёра
CREATE OR REPLACE FUNCTION public.get_partner_subscription(p_partner_id UUID)
RETURNS TABLE(
  plan_type TEXT,
  analyses_limit INTEGER,
  analyses_used INTEGER,
  price INTEGER,
  is_active BOOLEAN,
  activated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT plan_type, analyses_limit, analyses_used, price, is_active, activated_at
  FROM public.partner_subscriptions
  WHERE partner_id = p_partner_id AND is_active = true
  LIMIT 1;
$$;