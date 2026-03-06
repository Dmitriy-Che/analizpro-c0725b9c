

# Пробный тариф при регистрации + выбор тарифа партнёром

## Что нужно сделать

### 1. Пробный тариф при регистрации
При регистрации партнёра в Edge Function `register-partner` автоматически создавать запись в `partner_subscriptions` с plan_type = `trial`, limit = 10, price = 0.

### 2. Выбор тарифа партнёром в личном кабинете
Добавить в дашборд партнёра новую вкладку "Тариф" с карточками трёх тарифов. При выборе тарифа партнёр отправляет **заявку** — в `partner_subscriptions` обновляется поле `requested_plan` (новый столбец), но `plan_type` остаётся текущим (trial/старый). Тариф не активируется автоматически.

### 3. Уведомление в админ-панели
В карточке партнёра и в `SubscriptionManager` показывать заявку: "Партнёр запросил тариф Бизнес". Админ нажимает кнопку "Активировать" после оплаты — только тогда `plan_type` меняется и лимиты обновляются.

---

## Технические детали

### Миграция БД
Добавить столбец `requested_plan` в `partner_subscriptions`:
```sql
ALTER TABLE public.partner_subscriptions 
  ADD COLUMN requested_plan text DEFAULT NULL;
```

### Edge Function: `register-partner/index.ts`
После создания партнёра (шаг 3) добавить шаг 3.5 — вставка trial-подписки:
```sql
INSERT INTO partner_subscriptions (partner_id, plan_type, analyses_limit, analyses_used, price, is_active)
VALUES (partner_id, 'trial', 10, 0, 0, true);
```

### `src/components/PartnerSubscriptionCard.tsx`
- Добавить `trial` в `PLAN_NAMES` ("Пробный период") и `PLAN_COLORS` (зелёный)
- Если `plan_type === 'trial'` — показывать баннер "У вас пробный период, доступно 10 расшифровок"
- Если есть `requested_plan` — показать "Вы подали заявку на тариф X, ожидайте активации"

### Новый компонент: `src/components/PartnerPlanSelector.tsx`
- 3 карточки тарифов (Стандарт/Бизнес/Премиум) с ценами и лимитами
- Кнопка "Выбрать" → обновляет `requested_plan` в `partner_subscriptions`
- Если уже есть `requested_plan` — показывать "Заявка отправлена"
- RLS: партнёры могут обновлять `requested_plan` для своей подписки

### `src/pages/partner/Dashboard.tsx`
- Добавить вкладку "Тариф" с `PartnerPlanSelector`
- Передавать данные подписки в компонент

### `src/components/SubscriptionManager.tsx` (админ)
- Показывать баннер-уведомление если `requested_plan` не null: "Партнёр запросил тариф {name}!"
- Кнопка "Активировать запрошенный тариф" → устанавливает `plan_type = requested_plan`, обновляет лимиты/цену, сбрасывает `requested_plan = null`

### `src/components/SubscriptionBadge.tsx`
- Добавить поддержку `trial` плана

### `src/pages/Admin.tsx`
- В карточке партнёра показывать индикатор "Новая заявка!" если есть `requested_plan`

### RLS: миграция
```sql
-- Партнёры могут обновлять requested_plan для своей подписки
CREATE POLICY "Partners can request plan"
ON public.partner_subscriptions
FOR UPDATE
TO authenticated
USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()))
WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
```

## Затрагиваемые файлы

| Файл | Действие |
|------|----------|
| БД миграция | Добавить `requested_plan` столбец + RLS policy |
| `supabase/functions/register-partner/index.ts` | Создание trial-подписки |
| `src/components/PartnerSubscriptionCard.tsx` | Trial-режим + уведомление о заявке |
| `src/components/PartnerPlanSelector.tsx` | Новый — выбор тарифа партнёром |
| `src/pages/partner/Dashboard.tsx` | Вкладка "Тариф" |
| `src/components/SubscriptionManager.tsx` | Уведомление о заявке + быстрая активация |
| `src/components/SubscriptionBadge.tsx` | Поддержка trial |
| `src/pages/Admin.tsx` | Индикатор заявки в карточке партнёра |
| `src/hooks/usePartner.ts` | Добавить `requested_plan` в типы |

