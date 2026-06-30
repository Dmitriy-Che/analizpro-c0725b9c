
-- 1) order_number
ALTER TABLE public.user_orders ADD COLUMN IF NOT EXISTS order_number BIGSERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS user_orders_order_number_idx ON public.user_orders(order_number);

-- 2) admin_list_orders v2
DROP FUNCTION IF EXISTS public.admin_list_orders();
CREATE OR REPLACE FUNCTION public.admin_list_orders()
RETURNS TABLE(
  id uuid,
  order_number bigint,
  user_id uuid,
  device_id text,
  tariff_code text,
  tariff_title text,
  price_usd numeric,
  status text,
  effective_status text,
  reports_total integer,
  reports_used integer,
  reports_left integer,
  expires_at timestamptz,
  created_at timestamptz,
  paid_at timestamptz,
  processed_at timestamptz,
  user_email text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    o.id,
    o.order_number,
    o.user_id,
    o.device_id,
    o.tariff_code,
    t.title,
    o.price_usd,
    o.status,
    CASE
      WHEN o.status = 'cancelled' THEN 'cancelled'
      WHEN o.status = 'processed' AND e.id IS NOT NULL AND (
        e.reports_used >= e.reports_total OR (e.expires_at IS NOT NULL AND e.expires_at < now())
      ) THEN 'exhausted'
      WHEN o.status = 'processed' THEN 'active'
      WHEN o.status = 'paid' THEN 'paid'
      ELSE 'new'
    END AS effective_status,
    e.reports_total,
    e.reports_used,
    CASE WHEN e.id IS NULL THEN NULL ELSE GREATEST(e.reports_total - e.reports_used, 0) END AS reports_left,
    e.expires_at,
    o.created_at,
    o.paid_at,
    o.processed_at,
    u.email::text
  FROM public.user_orders o
  LEFT JOIN public.tariffs t ON t.code = o.tariff_code
  LEFT JOIN LATERAL (
    SELECT * FROM public.user_entitlements ent
    WHERE ent.order_id = o.id ORDER BY ent.created_at DESC LIMIT 1
  ) e ON TRUE
  LEFT JOIN auth.users u ON u.id = o.user_id
  WHERE public.has_role(auth.uid(),'admin')
  ORDER BY o.created_at DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_orders() TO authenticated;

-- 3) delete order (and related entitlements)
CREATE OR REPLACE FUNCTION public.admin_delete_order(p_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Доступ запрещён'; END IF;
  DELETE FROM public.user_entitlements WHERE order_id = p_order_id;
  DELETE FROM public.user_orders WHERE id = p_order_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_delete_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_order(uuid) TO authenticated;

-- 4) change tariff
CREATE OR REPLACE FUNCTION public.admin_change_order_tariff(p_order_id uuid, p_tariff_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_t public.tariffs; v_o public.user_orders;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Доступ запрещён'; END IF;
  SELECT * INTO v_t FROM public.tariffs WHERE code = p_tariff_code AND is_active = true;
  IF v_t.id IS NULL THEN RAISE EXCEPTION 'Тариф не найден'; END IF;
  SELECT * INTO v_o FROM public.user_orders WHERE id = p_order_id;
  IF v_o.id IS NULL THEN RAISE EXCEPTION 'Заказ не найден'; END IF;
  UPDATE public.user_orders SET tariff_code = p_tariff_code, price_usd = v_t.price_usd WHERE id = p_order_id;
  -- если уже выдан entitlement — обновим лимит и срок
  UPDATE public.user_entitlements
     SET tariff_code = p_tariff_code,
         reports_total = v_t.reports_limit,
         expires_at = CASE WHEN v_t.period_days IS NULL THEN expires_at ELSE now() + (v_t.period_days || ' days')::interval END
   WHERE order_id = p_order_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_change_order_tariff(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_change_order_tariff(uuid, text) TO authenticated;
