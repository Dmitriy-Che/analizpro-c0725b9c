
-- TARIFFS
CREATE TABLE public.tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  price_usd numeric(10,2) NOT NULL DEFAULT 0,
  reports_limit int NOT NULL DEFAULT 1,
  period_days int,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tariffs TO anon, authenticated;
GRANT ALL ON public.tariffs TO service_role;
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tariffs public read" ON public.tariffs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage tariffs" ON public.tariffs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.tariffs (code,title,description,price_usd,reports_limit,period_days,sort_order) VALUES
  ('free','Пробная','1 бесплатная расшифровка для новых пользователей',0,1,NULL,0),
  ('single','Разовая расшифровка','1 отчёт',5,1,30,1),
  ('monthly','Здоровье месяца','До 3 отчётов за 30 дней',15,3,30,2),
  ('family','Семейный','До 7 отчётов за 30 дней',30,7,30,3);

-- USER_ORDERS
CREATE TABLE public.user_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  device_id text,
  tariff_code text NOT NULL REFERENCES public.tariffs(code),
  price_usd numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','paid','processed','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  processed_at timestamptz
);
CREATE INDEX user_orders_user_idx ON public.user_orders(user_id);
CREATE INDEX user_orders_device_idx ON public.user_orders(device_id);
CREATE INDEX user_orders_status_idx ON public.user_orders(status);
GRANT SELECT, UPDATE ON public.user_orders TO authenticated;
GRANT ALL ON public.user_orders TO service_role;
ALTER TABLE public.user_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own orders" ON public.user_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update orders" ON public.user_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- USER_ENTITLEMENTS
CREATE TABLE public.user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text,
  source text NOT NULL CHECK (source IN ('free_trial','order','admin_grant')),
  order_id uuid REFERENCES public.user_orders(id) ON DELETE SET NULL,
  tariff_code text REFERENCES public.tariffs(code),
  reports_total int NOT NULL,
  reports_used int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX entitlements_user_idx ON public.user_entitlements(user_id);
CREATE INDEX entitlements_device_idx ON public.user_entitlements(device_id);
GRANT SELECT ON public.user_entitlements TO authenticated;
GRANT ALL ON public.user_entitlements TO service_role;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own entitlements" ON public.user_entitlements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- PAYMENT_SETTINGS
CREATE TABLE public.payment_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_settings TO anon, authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payment settings public read" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage payment settings" ON public.payment_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.payment_settings (key,value) VALUES
  ('qr_image_url',''),
  ('payment_instructions','Отсканируйте QR-код своим банковским приложением и переведите указанную сумму. После оплаты нажмите кнопку «Я оплатил». Мы проверим оплату и подготовим расшифровку — обычно в течение 1–2 часов.'),
  ('support_contact','@medgid_mo');

-- EXTEND user_analyses (telegram_id stays optional now)
ALTER TABLE public.user_analyses ALTER COLUMN telegram_id DROP NOT NULL;
ALTER TABLE public.user_analyses
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN device_id text,
  ADD COLUMN entitlement_id uuid REFERENCES public.user_entitlements(id) ON DELETE SET NULL,
  ADD COLUMN language_detected text,
  ADD COLUMN expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  ADD COLUMN title text,
  ADD COLUMN result_json jsonb;
CREATE INDEX user_analyses_user_idx ON public.user_analyses(user_id);
CREATE INDEX user_analyses_device_idx ON public.user_analyses(device_id);
CREATE INDEX user_analyses_expires_idx ON public.user_analyses(expires_at);

CREATE POLICY "Users see own analyses" ON public.user_analyses FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.grant_free_trial(p_user_id uuid, p_device_id text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF p_user_id IS NULL AND (p_device_id IS NULL OR p_device_id = '') THEN
    RAISE EXCEPTION 'user_id or device_id required';
  END IF;
  SELECT id INTO v_id FROM public.user_entitlements
   WHERE source = 'free_trial'
     AND ((p_user_id IS NOT NULL AND user_id = p_user_id)
       OR (p_user_id IS NULL AND device_id = p_device_id))
   LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  INSERT INTO public.user_entitlements(user_id, device_id, source, tariff_code, reports_total, reports_used, expires_at)
  VALUES (p_user_id, NULLIF(p_device_id,''), 'free_trial', 'free', 1, 0, now() + interval '365 days')
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.grant_free_trial(uuid,text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_my_entitlements(p_device_id text)
RETURNS TABLE(id uuid, source text, tariff_code text, reports_total int, reports_used int, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, source, tariff_code, reports_total, reports_used, expires_at
    FROM public.user_entitlements
   WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid())
      OR (p_device_id IS NOT NULL AND p_device_id <> '' AND device_id = p_device_id)
   ORDER BY created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_entitlements(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_order(p_tariff_code text, p_device_id text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_price numeric; v_id uuid;
BEGIN
  IF p_tariff_code NOT IN ('single','monthly','family') THEN
    RAISE EXCEPTION 'Недопустимый тариф';
  END IF;
  SELECT price_usd INTO v_price FROM public.tariffs WHERE code = p_tariff_code AND is_active = true;
  IF v_price IS NULL THEN RAISE EXCEPTION 'Тариф не найден'; END IF;
  INSERT INTO public.user_orders(user_id, device_id, tariff_code, price_usd, status)
  VALUES (auth.uid(), NULLIF(p_device_id,''), p_tariff_code, v_price, 'new')
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.create_order(text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_order(p_order_id uuid, p_device_id text)
RETURNS TABLE(id uuid, tariff_code text, price_usd numeric, status text, created_at timestamptz, paid_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, tariff_code, price_usd, status, created_at, paid_at
    FROM public.user_orders
   WHERE id = p_order_id
     AND ((auth.uid() IS NOT NULL AND user_id = auth.uid())
       OR (p_device_id IS NOT NULL AND p_device_id <> '' AND device_id = p_device_id)
       OR public.has_role(auth.uid(),'admin'));
$$;
GRANT EXECUTE ON FUNCTION public.get_my_order(uuid,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_order_paid_by_user(p_order_id uuid, p_device_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_orders
     WHERE id = p_order_id AND status = 'new'
       AND ((auth.uid() IS NOT NULL AND user_id = auth.uid())
         OR (p_device_id IS NOT NULL AND p_device_id <> '' AND device_id = p_device_id))
  ) INTO v_owner;
  IF NOT v_owner THEN RAISE EXCEPTION 'Заказ не найден или уже обработан'; END IF;
  UPDATE public.user_orders SET status = 'paid', paid_at = now() WHERE id = p_order_id;
END $$;
GRANT EXECUTE ON FUNCTION public.mark_order_paid_by_user(uuid,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_process_order(p_order_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.user_orders; v_tariff public.tariffs; v_ent uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Доступ запрещён'; END IF;
  SELECT * INTO v_order FROM public.user_orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Заказ не найден'; END IF;
  IF v_order.status = 'processed' THEN RAISE EXCEPTION 'Уже обработан'; END IF;
  SELECT * INTO v_tariff FROM public.tariffs WHERE code = v_order.tariff_code;
  INSERT INTO public.user_entitlements(user_id, device_id, source, order_id, tariff_code, reports_total, reports_used, expires_at)
  VALUES (v_order.user_id, v_order.device_id, 'order', v_order.id, v_tariff.code, v_tariff.reports_limit, 0,
          CASE WHEN v_tariff.period_days IS NULL THEN now() + interval '365 days' ELSE now() + (v_tariff.period_days || ' days')::interval END)
  RETURNING id INTO v_ent;
  UPDATE public.user_orders SET status='processed', processed_at = now() WHERE id = p_order_id;
  RETURN v_ent;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_process_order(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.consume_entitlement(p_user_id uuid, p_device_id text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.user_entitlements
   WHERE reports_used < reports_total
     AND (expires_at IS NULL OR expires_at > now())
     AND ((p_user_id IS NOT NULL AND user_id = p_user_id)
       OR (p_user_id IS NULL AND p_device_id IS NOT NULL AND device_id = p_device_id))
   ORDER BY (source='free_trial') DESC, expires_at ASC NULLS LAST
   FOR UPDATE SKIP LOCKED
   LIMIT 1;
  IF v_id IS NULL THEN RETURN NULL; END IF;
  UPDATE public.user_entitlements SET reports_used = reports_used + 1 WHERE id = v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.consume_entitlement(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_guest_data(p_device_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR p_device_id IS NULL OR p_device_id = '' THEN RETURN; END IF;
  UPDATE public.user_orders SET user_id = auth.uid()
    WHERE device_id = p_device_id AND user_id IS NULL;
  UPDATE public.user_entitlements SET user_id = auth.uid()
    WHERE device_id = p_device_id AND user_id IS NULL;
  UPDATE public.user_analyses SET user_id = auth.uid()
    WHERE device_id = p_device_id AND user_id IS NULL;
END $$;
GRANT EXECUTE ON FUNCTION public.claim_guest_data(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_reports(p_device_id text)
RETURNS TABLE(id uuid, title text, study_type text, age int, gender text, language_detected text, result_json jsonb, full_result text, created_at timestamptz, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, title, study_type, age, gender, language_detected, result_json, full_result, created_at, expires_at
    FROM public.user_analyses
   WHERE expires_at > now()
     AND ((auth.uid() IS NOT NULL AND user_id = auth.uid())
       OR (p_device_id IS NOT NULL AND p_device_id <> '' AND device_id = p_device_id))
   ORDER BY created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_reports(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.purge_expired_reports()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n int;
BEGIN
  DELETE FROM public.user_analyses WHERE expires_at < now();
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END $$;
GRANT EXECUTE ON FUNCTION public.purge_expired_reports() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_list_orders()
RETURNS TABLE(id uuid, user_id uuid, device_id text, tariff_code text, price_usd numeric, status text, created_at timestamptz, paid_at timestamptz, processed_at timestamptz, user_email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.user_id, o.device_id, o.tariff_code, o.price_usd, o.status, o.created_at, o.paid_at, o.processed_at, u.email::text
    FROM public.user_orders o
    LEFT JOIN auth.users u ON u.id = o.user_id
   WHERE public.has_role(auth.uid(),'admin')
   ORDER BY o.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_orders() TO authenticated;
