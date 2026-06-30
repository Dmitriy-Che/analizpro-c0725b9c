
CREATE OR REPLACE FUNCTION public.admin_process_order(p_order_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order public.user_orders;
  v_tariff public.tariffs;
  v_ent uuid;
  v_carry int := 0;
  v_total int;
  v_new_expires timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Доступ запрещён'; END IF;
  SELECT * INTO v_order FROM public.user_orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Заказ не найден'; END IF;
  IF v_order.status = 'processed' THEN RAISE EXCEPTION 'Уже обработан'; END IF;
  SELECT * INTO v_tariff FROM public.tariffs WHERE code = v_order.tariff_code;

  -- Сумма остатков по всем активным расшифровкам этого пользователя/устройства
  SELECT COALESCE(SUM(GREATEST(reports_total - reports_used, 0)), 0)
    INTO v_carry
    FROM public.user_entitlements
   WHERE reports_used < reports_total
     AND (expires_at IS NULL OR expires_at > now())
     AND (
       (v_order.user_id IS NOT NULL AND user_id = v_order.user_id)
       OR (v_order.user_id IS NULL AND v_order.device_id IS NOT NULL AND device_id = v_order.device_id)
     );

  -- Гасим старые активные entitlement-ы — их остаток переедет в новый
  IF v_carry > 0 THEN
    UPDATE public.user_entitlements
       SET reports_used = reports_total
     WHERE reports_used < reports_total
       AND (expires_at IS NULL OR expires_at > now())
       AND (
         (v_order.user_id IS NOT NULL AND user_id = v_order.user_id)
         OR (v_order.user_id IS NULL AND v_order.device_id IS NOT NULL AND device_id = v_order.device_id)
       );
  END IF;

  v_total := v_tariff.reports_limit + v_carry;
  v_new_expires := CASE WHEN v_tariff.period_days IS NULL THEN now() + interval '365 days'
                        ELSE now() + (v_tariff.period_days || ' days')::interval END;

  INSERT INTO public.user_entitlements(user_id, device_id, source, order_id, tariff_code, reports_total, reports_used, expires_at)
  VALUES (v_order.user_id, v_order.device_id, 'order', v_order.id, v_tariff.code, v_total, 0, v_new_expires)
  RETURNING id INTO v_ent;

  UPDATE public.user_orders SET status='processed', processed_at = now() WHERE id = p_order_id;
  RETURN v_ent;
END $$;
