
-- 1. Убираем широкую политику чтения
DROP POLICY IF EXISTS "Payment settings authenticated read" ON public.payment_settings;

-- 2. Публичная функция, отдающая только безопасные поля (без admin_telegram_chat_id)
CREATE OR REPLACE FUNCTION public.get_public_payment_settings()
RETURNS TABLE(key text, value text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT key, value
  FROM public.payment_settings
  WHERE key IN (
    'qr_image_url',
    'qr_image_path',
    'payment_instructions',
    'support_contact',
    'payment_link',
    'wallet_address',
    'wallet_network',
    'support_telegram_url'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_public_payment_settings() TO anon, authenticated;

-- 3. Серверная функция авто-сверки оплаты в сети TRON.
-- Сравнивает сумму USDT-перевода с заказом, при совпадении помечает заказ как paid.
-- Вызывается из edge-функции verify-tron-payment с service_role.
CREATE OR REPLACE FUNCTION public.mark_order_paid_by_tron(
  p_order_id uuid,
  p_tx_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_status text;
BEGIN
  SELECT status INTO v_status FROM public.user_orders WHERE id = p_order_id;
  IF v_status IS NULL THEN RETURN false; END IF;
  IF v_status <> 'new' THEN RETURN false; END IF;
  UPDATE public.user_orders
     SET status = 'paid',
         paid_at = now(),
         tx_hash = p_tx_hash
   WHERE id = p_order_id AND status = 'new';
  RETURN FOUND;
END $$;

GRANT EXECUTE ON FUNCTION public.mark_order_paid_by_tron(uuid, text) TO service_role;

-- 4. Колонка для хеша транзакции (если ещё нет)
ALTER TABLE public.user_orders ADD COLUMN IF NOT EXISTS tx_hash text;
