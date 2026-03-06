
ALTER TABLE public.partner_subscriptions 
  ADD COLUMN requested_plan text DEFAULT NULL;
