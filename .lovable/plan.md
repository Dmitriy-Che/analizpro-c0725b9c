## Реферальная программа «Пригласи друга — получи бесплатную расшифровку»

**Выбранная схема:**
- Двусторонняя: новый пользователь по ссылке получает **+1 бесплатную расшифровку в подарок**; пригласивший получает бонусы по этапам.
- Этапы для пригласившего: **1 друг → +1 расшифровка, 3 друга → +3 расшифровки, 5 друзей → месячный тариф**.
- Приглашение засчитывается **только после первой расшифровки приглашённого** (защита от ботов).
- Ссылка ведёт на веб-версию: `analizpro.lovable.app/?ref=MED-A7K2`.

## Как это будет выглядеть для пользователя

1. На главной и в `/my-reports` появляется яркая карточка **«Пригласите друга — получите бесплатную расшифровку»** с прогресс-баром «0/1 → 1/3 → 3/5».
2. Кнопка «Поделиться» открывает Web Share API с текстом: *«Я разбираю свои анализы с помощью АнализПро — расшифровывает анализы простым языком. Дарю тебе 1 бесплатную расшифровку: {link}»*. Запасные кнопки: WhatsApp, Telegram, Копировать.
3. Когда друг переходит → видит баннер **«🎁 У вас 1 бесплатная расшифровка в подарок от друга»** → загружает анализ → получает результат.
4. В этот момент пригласившему уходит уведомление (тост при следующем входе) **«Ваш друг сделал расшифровку — вам начислена 1 бесплатная расшифровка!»**, прогресс обновляется.

## Защита от накрутки

- Засчитываем только **новые** `device_id` (которых раньше не было в `visits` или `user_analyses`).
- Свой же `ref` на свой `device_id` — игнорируется.
- Бонус начисляется только после реальной расшифровки, не за переход.
- Rate-limit: максимум **10 приглашений с одного device_id в сутки**.
- IP-дедупликация: если 5+ «новых» приглашённых с одного IP за час — invite ставится в `pending_review`, бонус не начисляется до ручной проверки админом.

## Технические детали

**Новые таблицы:**

```sql
-- Реферальные коды (1 на device_id / user_id)
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,        -- 'MED-A7K2'
  user_id uuid REFERENCES auth.users(id),
  device_id text,
  created_at timestamptz DEFAULT now()
);

-- Приглашения
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_code text NOT NULL REFERENCES public.referral_codes(code),
  invitee_device_id text NOT NULL,
  invitee_user_id uuid,
  invitee_ip text,
  status text NOT NULL DEFAULT 'pending',  -- pending | qualified | rewarded | flagged
  qualified_at timestamptz,                -- когда сделал первую расшифровку
  rewarded_at timestamptz,                 -- когда начислили бонус
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX ON public.referrals(invitee_device_id);  -- один device_id = одно приглашение
```

Плюс GRANT-ы, RLS-политики через SECURITY DEFINER RPC.

**Новые RPC:**
- `get_or_create_referral_code(p_device_id)` — возвращает реферальный код пользователя.
- `register_referral(p_ref_code, p_device_id, p_ip)` — вызывается при заходе по `?ref=...`, создаёт `pending` запись и сразу выдаёт приглашённому 1 бесплатную расшифровку (`user_entitlements` с `source='referral_gift'`).
- `qualify_referral(p_device_id)` — вызывается после первой успешной расшифровки. Меняет статус на `qualified`, начисляет бонус пригласившему по этапам (1/3/5).
- `get_my_referral_stats(p_device_id)` — для UI: код, количество qualified, текущий этап.

**Изменения существующего кода:**
- `App.tsx` / `Index.tsx` — при заходе с `?ref=…` сохранять в localStorage и вызывать `register_referral`.
- `analyze-medical-photo` edge-функция — после успешного анализа вызывать `qualify_referral` для текущего device_id (один раз, при первой расшифровке).
- `Home.tsx`, `MyReports.tsx` — добавить компонент `ReferralCard.tsx` (прогресс + кнопка «Поделиться»).
- Новая страница `/invite` или модалка — расширенная статистика, история приглашений.

**Файлы для создания/правки:**
- Миграция `referral_codes`, `referrals` + 4 RPC.
- `src/components/ReferralCard.tsx` — карточка с прогресс-баром и share.
- `src/components/ReferralGiftBanner.tsx` — баннер приглашённому «у вас подарок».
- `src/hooks/useReferral.ts` — статистика + обработка `?ref=…` параметра.
- Правки в `App.tsx`, `Home.tsx`, `MyReports.tsx`, `Analyze.tsx`, `supabase/functions/analyze-medical-photo/index.ts`.

## Что показать админу

В `Admin.tsx` — новая вкладка «Рефералы»: топ-пригласившие, всего приглашений, конверсия pending → qualified, список `flagged` для ручной проверки.

## Открытые вопросы (не блокирующие)

- Текст для шеринга — предложу дефолтный, потом подправите.
- Дизайн карточки приглашения — сделаю в стиле текущих тарифных карточек (border-2, rounded-2xl, градиент primary→accent).
- Месячный тариф за 5 приглашений = эквивалент текущего `monthly` (выдадим `user_entitlements` с тем же лимитом расшифровок и сроком 30 дней).
