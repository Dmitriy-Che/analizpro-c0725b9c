
-- Admin: list all referrals with details
CREATE OR REPLACE FUNCTION public.admin_list_referrals()
RETURNS TABLE(
  id uuid,
  referrer_code text,
  referrer_user_id uuid,
  referrer_device_id text,
  referrer_email text,
  invitee_device_id text,
  invitee_user_id uuid,
  invitee_email text,
  invitee_ip text,
  status text,
  qualified_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz,
  invitee_analyses_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    r.id,
    r.referrer_code,
    rc.user_id AS referrer_user_id,
    rc.device_id AS referrer_device_id,
    ru.email::text AS referrer_email,
    r.invitee_device_id,
    r.invitee_user_id,
    iu.email::text AS invitee_email,
    r.invitee_ip,
    r.status,
    r.qualified_at,
    r.rewarded_at,
    r.created_at,
    (SELECT count(*) FROM public.user_analyses ua
       WHERE ua.device_id = r.invitee_device_id
          OR (r.invitee_user_id IS NOT NULL AND ua.user_id = r.invitee_user_id)) AS invitee_analyses_count
  FROM public.referrals r
  LEFT JOIN public.referral_codes rc ON rc.code = r.referrer_code
  LEFT JOIN auth.users ru ON ru.id = rc.user_id
  LEFT JOIN auth.users iu ON iu.id = r.invitee_user_id
  WHERE public.has_role(auth.uid(),'admin')
  ORDER BY r.created_at DESC;
$$;

-- Admin: delete referral (and optionally its gift entitlement)
CREATE OR REPLACE FUNCTION public.admin_delete_referral(p_referral_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_ref public.referrals;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Доступ запрещён'; END IF;
  SELECT * INTO v_ref FROM public.referrals WHERE id = p_referral_id;
  IF v_ref.id IS NULL THEN RAISE EXCEPTION 'Реферал не найден'; END IF;
  -- удаляем неиспользованный подарок приглашённому
  DELETE FROM public.user_entitlements
   WHERE source = 'referral_gift'
     AND device_id = v_ref.invitee_device_id
     AND reports_used = 0;
  DELETE FROM public.referrals WHERE id = p_referral_id;
END $$;

-- Admin: change referral status (approve flagged → pending; mark qualified/rewarded manually)
CREATE OR REPLACE FUNCTION public.admin_set_referral_status(p_referral_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Доступ запрещён'; END IF;
  IF p_status NOT IN ('pending','qualified','rewarded','flagged') THEN
    RAISE EXCEPTION 'Недопустимый статус';
  END IF;
  UPDATE public.referrals
     SET status = p_status,
         qualified_at = CASE WHEN p_status IN ('qualified','rewarded') AND qualified_at IS NULL THEN now() ELSE qualified_at END,
         rewarded_at  = CASE WHEN p_status = 'rewarded' AND rewarded_at IS NULL THEN now() ELSE rewarded_at END
   WHERE id = p_referral_id;
END $$;
