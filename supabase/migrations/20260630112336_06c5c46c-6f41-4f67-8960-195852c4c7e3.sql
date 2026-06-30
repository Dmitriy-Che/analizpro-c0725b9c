
-- Реферальные коды
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX referral_codes_user_unique ON public.referral_codes(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX referral_codes_device_unique ON public.referral_codes(device_id) WHERE device_id IS NOT NULL AND user_id IS NULL;

GRANT SELECT ON public.referral_codes TO anon, authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referral code visible" ON public.referral_codes FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR public.has_role(auth.uid(),'admin')
);

-- Приглашения
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_code text NOT NULL,
  invitee_device_id text NOT NULL UNIQUE,
  invitee_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invitee_ip text,
  status text NOT NULL DEFAULT 'pending',
  qualified_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX referrals_referrer_idx ON public.referrals(referrer_code);
CREATE INDEX referrals_status_idx ON public.referrals(status);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view referrals" ON public.referrals FOR SELECT
USING (public.has_role(auth.uid(),'admin'));

-- Добавим source 'referral_gift' и 'referral_reward' в user_entitlements (поле text, без enum)
-- ничего менять не нужно

-- Получить или создать реферальный код
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_device_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code text;
  v_uid uuid := auth.uid();
  v_attempts int := 0;
BEGIN
  IF v_uid IS NULL AND (p_device_id IS NULL OR length(p_device_id) < 16) THEN
    RAISE EXCEPTION 'auth or device_id required';
  END IF;

  -- Уже есть код?
  IF v_uid IS NOT NULL THEN
    SELECT code INTO v_code FROM public.referral_codes WHERE user_id = v_uid LIMIT 1;
  ELSE
    SELECT code INTO v_code FROM public.referral_codes WHERE device_id = p_device_id AND user_id IS NULL LIMIT 1;
  END IF;
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;

  -- Сгенерировать уникальный
  LOOP
    v_code := 'MED-' || upper(substr(replace(encode(gen_random_bytes(4),'base64'),'/','A'),1,5));
    v_code := regexp_replace(v_code, '[^A-Z0-9\-]', '0', 'g');
    BEGIN
      INSERT INTO public.referral_codes(code, user_id, device_id)
      VALUES (v_code, v_uid, CASE WHEN v_uid IS NULL THEN p_device_id ELSE NULL END);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_attempts := v_attempts + 1;
      IF v_attempts > 10 THEN RAISE; END IF;
    END;
  END LOOP;
  RETURN v_code;
END $$;

-- Регистрация перехода по реф.ссылке + подарок приглашённому
CREATE OR REPLACE FUNCTION public.register_referral(p_ref_code text, p_device_id text, p_ip text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_user uuid;
  v_owner_device text;
  v_existing_invite uuid;
  v_seen boolean;
  v_ip_recent int;
  v_status text := 'pending';
  v_ent_id uuid;
  v_today_count int;
BEGIN
  IF p_ref_code IS NULL OR p_device_id IS NULL OR length(p_device_id) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_input');
  END IF;

  SELECT user_id, device_id INTO v_owner_user, v_owner_device
  FROM public.referral_codes WHERE code = p_ref_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unknown_code');
  END IF;

  -- Защита: свой же ref на своём device
  IF v_owner_device IS NOT NULL AND v_owner_device = p_device_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self_ref');
  END IF;

  -- Уже приглашён?
  SELECT id INTO v_existing_invite FROM public.referrals WHERE invitee_device_id = p_device_id;
  IF v_existing_invite IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'already_registered');
  END IF;

  -- Засчитываем только НОВЫЕ device_id (не было визитов/анализов)
  SELECT EXISTS(SELECT 1 FROM public.visits WHERE device_id = p_device_id)
      OR EXISTS(SELECT 1 FROM public.user_analyses WHERE device_id = p_device_id)
    INTO v_seen;
  IF v_seen THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_new_device');
  END IF;

  -- Rate-limit: 10 приглашений с device за сутки
  SELECT count(*) INTO v_today_count
    FROM public.referrals
   WHERE referrer_code = p_ref_code
     AND created_at > now() - interval '1 day';
  IF v_today_count >= 10 THEN
    v_status := 'flagged';
  END IF;

  -- IP-дедупликация: 5+ новых за час с одного IP → flagged
  IF p_ip IS NOT NULL AND p_ip <> '' THEN
    SELECT count(*) INTO v_ip_recent
      FROM public.referrals
     WHERE invitee_ip = p_ip
       AND created_at > now() - interval '1 hour';
    IF v_ip_recent >= 5 THEN
      v_status := 'flagged';
    END IF;
  END IF;

  INSERT INTO public.referrals(referrer_code, invitee_device_id, invitee_ip, status)
  VALUES (p_ref_code, p_device_id, p_ip, v_status);

  -- Подарок приглашённому (даже если flagged — пусть человек попробует)
  INSERT INTO public.user_entitlements(user_id, device_id, source, tariff_code, reports_total, reports_used, expires_at)
  VALUES (NULL, p_device_id, 'referral_gift', 'free', 1, 0, now() + interval '180 days')
  RETURNING id INTO v_ent_id;

  RETURN jsonb_build_object('ok', true, 'gift', true, 'status', v_status);
END $$;

-- Квалификация: после первой расшифровки приглашённый «подтверждается», пригласивший получает бонус
CREATE OR REPLACE FUNCTION public.qualify_referral(p_device_id text, p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ref public.referrals;
  v_owner_user uuid;
  v_owner_device text;
  v_qualified_total int;
  v_reward_total int := 0;
  v_reward_days int := 365;
  v_reward_source text;
BEGIN
  IF p_device_id IS NULL OR length(p_device_id) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_input');
  END IF;

  SELECT * INTO v_ref FROM public.referrals WHERE invitee_device_id = p_device_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_invite');
  END IF;
  IF v_ref.status NOT IN ('pending') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_processed', 'status', v_ref.status);
  END IF;

  -- Помечаем приглашение
  UPDATE public.referrals
     SET status = 'qualified',
         qualified_at = now(),
         invitee_user_id = COALESCE(invitee_user_id, p_user_id)
   WHERE id = v_ref.id;

  -- Подсчёт qualified у пригласившего
  SELECT count(*) INTO v_qualified_total
    FROM public.referrals
   WHERE referrer_code = v_ref.referrer_code
     AND status IN ('qualified','rewarded');

  -- Получатель бонуса
  SELECT user_id, device_id INTO v_owner_user, v_owner_device
  FROM public.referral_codes WHERE code = v_ref.referrer_code;

  -- Этапы: 1 → +1 расшифровка, 3 → +3, 5 → месячный
  IF v_qualified_total = 1 THEN
    v_reward_total := 1;
    v_reward_source := 'referral_reward_1';
  ELSIF v_qualified_total = 3 THEN
    v_reward_total := 3;
    v_reward_source := 'referral_reward_3';
  ELSIF v_qualified_total = 5 THEN
    -- Месячный тариф: возьмём reports_limit и period_days из tariffs.monthly
    SELECT COALESCE(reports_limit, 30), COALESCE(period_days, 30)
      INTO v_reward_total, v_reward_days
      FROM public.tariffs WHERE code = 'monthly' LIMIT 1;
    v_reward_source := 'referral_reward_5_monthly';
  END IF;

  IF v_reward_total > 0 THEN
    INSERT INTO public.user_entitlements(user_id, device_id, source, tariff_code, reports_total, reports_used, expires_at)
    VALUES (v_owner_user,
            CASE WHEN v_owner_user IS NULL THEN v_owner_device ELSE NULL END,
            v_reward_source,
            CASE WHEN v_qualified_total = 5 THEN 'monthly' ELSE 'free' END,
            v_reward_total, 0,
            now() + (v_reward_days || ' days')::interval);

    UPDATE public.referrals SET status='rewarded', rewarded_at=now() WHERE id = v_ref.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'qualified_total', v_qualified_total, 'reward', v_reward_total);
END $$;

-- Статистика для UI
CREATE OR REPLACE FUNCTION public.get_my_referral_stats(p_device_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code text;
  v_uid uuid := auth.uid();
  v_qualified int := 0;
  v_pending int := 0;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT code INTO v_code FROM public.referral_codes WHERE user_id = v_uid LIMIT 1;
  ELSE
    SELECT code INTO v_code FROM public.referral_codes WHERE device_id = p_device_id AND user_id IS NULL LIMIT 1;
  END IF;
  IF v_code IS NULL THEN
    RETURN jsonb_build_object('code', NULL, 'qualified', 0, 'pending', 0, 'next_milestone', 1);
  END IF;
  SELECT
    count(*) FILTER (WHERE status IN ('qualified','rewarded')),
    count(*) FILTER (WHERE status = 'pending')
    INTO v_qualified, v_pending
    FROM public.referrals WHERE referrer_code = v_code;
  RETURN jsonb_build_object(
    'code', v_code,
    'qualified', v_qualified,
    'pending', v_pending,
    'next_milestone', CASE WHEN v_qualified < 1 THEN 1 WHEN v_qualified < 3 THEN 3 WHEN v_qualified < 5 THEN 5 ELSE NULL END
  );
END $$;

-- Админ-статистика
CREATE OR REPLACE FUNCTION public.admin_referral_stats()
RETURNS TABLE(
  total_invites bigint,
  qualified bigint,
  rewarded bigint,
  flagged bigint,
  conversion_pct numeric,
  top_referrers jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (SELECT count(*) FROM public.referrals) AS total_invites,
    (SELECT count(*) FROM public.referrals WHERE status IN ('qualified','rewarded')) AS qualified,
    (SELECT count(*) FROM public.referrals WHERE status = 'rewarded') AS rewarded,
    (SELECT count(*) FROM public.referrals WHERE status = 'flagged') AS flagged,
    CASE WHEN (SELECT count(*) FROM public.referrals) = 0 THEN 0
         ELSE ROUND(100.0 * (SELECT count(*) FROM public.referrals WHERE status IN ('qualified','rewarded'))
                    / (SELECT count(*) FROM public.referrals), 1)
    END AS conversion_pct,
    (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT referrer_code AS code,
             count(*) AS invites,
             count(*) FILTER (WHERE status IN ('qualified','rewarded')) AS qualified
      FROM public.referrals
      GROUP BY referrer_code
      ORDER BY count(*) DESC
      LIMIT 10
    ) t) AS top_referrers
  WHERE public.has_role(auth.uid(),'admin');
$$;
