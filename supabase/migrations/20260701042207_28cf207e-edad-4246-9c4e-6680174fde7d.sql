
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_device_id text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_code text;
  v_uid uuid := auth.uid();
  v_attempts int := 0;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_rand text;
  i int;
BEGIN
  IF v_uid IS NULL AND (p_device_id IS NULL OR length(p_device_id) < 16) THEN
    RAISE EXCEPTION 'auth or device_id required';
  END IF;

  IF v_uid IS NOT NULL THEN
    SELECT code INTO v_code FROM public.referral_codes WHERE user_id = v_uid LIMIT 1;
  ELSE
    SELECT code INTO v_code FROM public.referral_codes WHERE device_id = p_device_id AND user_id IS NULL LIMIT 1;
  END IF;
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;

  LOOP
    v_rand := '';
    FOR i IN 1..5 LOOP
      v_rand := v_rand || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    END LOOP;
    v_code := 'MED-' || v_rand;
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
END $function$;
