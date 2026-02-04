
# План: Система тарифных планов для партнёров (обновлённый)

## Обновлённые тарифы

| План | Расшифровок | Цена |
|------|-------------|------|
| Стандарт | 500 | 30,000 ₽ |
| Бизнес | 1,500 | 52,000 ₽ |
| Премиум | 3,000 | 75,000 ₽ |

## Дополнительное требование

Админ должен иметь возможность **вручную изменять количество расшифровок** у любого партнёра в любой момент (просто вбив желаемую цифру в соответствующее окно).

---

## Архитектура решения

### Новая таблица: `partner_subscriptions`

```text
partner_subscriptions
├── id (uuid, PK)
├── partner_id (uuid → partners.id, UNIQUE)
├── plan_type (text: standard, business, premium)
├── analyses_limit (int) — лимит расшифровок
├── analyses_used (int) — использовано расшифровок
├── price (int) — цена в рублях
├── activated_at (timestamp)
├── activated_by (uuid) — кем активирован
├── is_active (boolean)
├── created_at (timestamp)
```

### Новая таблица: `subscription_history`

```text
subscription_history
├── id (uuid, PK)
├── partner_id (uuid)
├── plan_type (text)
├── analyses_limit (int)
├── price (int)
├── action (text: activated, limit_changed, renewed)
├── admin_id (uuid)
├── created_at (timestamp)
```

---

## Логика работы

### 1. Проверка лимита при расшифровке

В edge-функции `analyze-medical-photo` (после строки 105, до вызова AI):

```text
Если partner_id указан:
  1. Получить подписку из partner_subscriptions
  2. Проверить: analyses_used < analyses_limit?
  3. Если лимит исчерпан → вернуть ошибку
  4. Если OK → продолжить анализ
  5. После успеха → увеличить analyses_used на 1
```

### 2. Ручное изменение лимита администратором

В админ-панели при клике на партнёра появится поле ввода для `analyses_limit`, позволяющее установить любое значение.

---

## Изменения в UI

### Админ-панель (`src/pages/Admin.tsx`)

1. **В карточке партнёра** показать:
   - Текущий тариф (Стандарт/Бизнес/Премиум)
   - Использовано / Лимит расшифровок
   - Прогресс-бар

2. **В блоке деталей партнёра**:
   - Выбор тарифного плана (кнопки)
   - Поле ввода для **ручной установки лимита**
   - Кнопка сохранения

### Дашборд партнёра (`src/pages/partner/Dashboard.tsx`)

1. **Новый блок "Ваш тариф"**:
   - Название плана
   - Использовано / Лимит
   - Цветной прогресс-бар
   - Предупреждение при достижении 80%

---

## Технические шаги

### Шаг 1: Миграция базы данных

SQL-миграция создаст:
- Таблицу `partner_subscriptions`
- Таблицу `subscription_history`
- RLS-политики
- Функцию `check_partner_limit(partner_id)` — возвращает TRUE если лимит не исчерпан
- Функцию `increment_partner_usage(partner_id)` — увеличивает счётчик на 1

### Шаг 2: Обновление Edge-функции

В `supabase/functions/analyze-medical-photo/index.ts`:

```text
// После валидации partner_id (строка ~105)

if (partner_id) {
  // Получить подписку
  const { data: subscription } = await supabase
    .from('partner_subscriptions')
    .select('analyses_used, analyses_limit, is_active')
    .eq('partner_id', partner_id)
    .eq('is_active', true)
    .single();

  if (!subscription) {
    return Response с ошибкой "Нет активной подписки"
  }

  if (subscription.analyses_used >= subscription.analyses_limit) {
    return Response с ошибкой "Лимит исчерпан"
  }
}

// ... выполнить анализ ...

// После успешного анализа (перед return)
if (partner_id) {
  await supabase.rpc('increment_partner_usage', { p_partner_id: partner_id });
}
```

### Шаг 3: UI Админ-панель

В `src/pages/Admin.tsx` добавить:

1. Загрузку данных подписки партнёра при выборе
2. Блок управления тарифом:
   - Три кнопки выбора плана
   - Поле ввода `<Input type="number">` для ручного лимита
   - Кнопка "Сохранить"
3. Функции для активации плана и изменения лимита

### Шаг 4: UI Дашборд партнёра

В `src/pages/partner/Dashboard.tsx` добавить блок:

```text
┌─────────────────────────────────┐
│ 📊 Ваш тариф: Бизнес            │
│                                 │
│ Расшифровок: 847 / 1,500        │
│ ████████████░░░░░░░░  56%       │
│                                 │
│ [Предупреждение при 80%+]       │
└─────────────────────────────────┘
```

### Шаг 5: Хук usePartner

В `src/hooks/usePartner.ts` добавить:
- Функцию `fetchSubscription()` для получения данных подписки
- Состояние `subscription` в возвращаемом объекте

---

## RLS-политики

```text
partner_subscriptions:
├── SELECT: админы — все, партнёры — только свои
├── INSERT: только админы
├── UPDATE: только админы

subscription_history:
├── SELECT: админы — все, партнёры — только свои
├── INSERT: через SECURITY DEFINER функции
```

---

## Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `supabase/migrations/...` | Новые таблицы, функции, RLS |
| `supabase/functions/analyze-medical-photo/index.ts` | Проверка и инкремент лимита |
| `src/pages/Admin.tsx` | UI управления тарифами + ручной ввод лимита |
| `src/pages/partner/Dashboard.tsx` | Блок отображения тарифа |
| `src/hooks/usePartner.ts` | Загрузка данных подписки |

---

## Поведение при исчерпании лимита

Когда `analyses_used >= analyses_limit`:
- Пользователь клиники видит: "Лимит расшифровок вашей клиники исчерпан. Обратитесь к администратору."
- Партнёр в дашборде видит красный прогресс-бар
- Админ видит статус "Лимит исчерпан" в списке партнёров
