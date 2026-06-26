
# План доработки АнализПро (B2C + тарифы + мультиязычность)

## 1. Гибридная авторизация (гость + опциональный вход)

- Включить email/password + Google через Lovable Cloud Auth.
- Новый компонент `AuthDialog` (вход/регистрация) + страница `/login` (уже есть, переиспользуем).
- Хук `useCurrentUser()` — возвращает `{ user, deviceId }`. `device_id` хранится в `localStorage` (uuid v4) и используется для гостей.
- Гость может: использовать 1 бесплатную расшифровку, оплатить разовый тариф.
- Для «Мои отчёты», истории и тарифов с лимитом >1 расшифровки — мягкое требование входа («Войдите, чтобы сохранить отчёт дольше, чем на 24 часа»).
- При входе после гостевого использования: миграция `device_id → user_id` в таблицах `user_orders`, `user_analyses`, `user_entitlements` (RPC `claim_guest_data`).

## 2. База данных (миграции)

Новые таблицы (все с GRANT + RLS):

- **`user_orders`** — `id, user_id (nullable), device_id, tariff_type, price_usd numeric, status ('new'|'paid'|'processed'|'cancelled'), created_at, paid_at, processed_at, notes`.
  - RLS: видит свои заказы по `auth.uid()` ИЛИ по `device_id` (передаётся через RPC).
- **`user_entitlements`** — `id, user_id, device_id, source ('free_trial'|'order'), order_id, reports_total int, reports_used int, expires_at, created_at`.
  - Логика: разовый = 1/30дн, месячный = 3/30дн, семейный = 7/30дн, бесплатный trial = 1/без срока.
- **`user_analyses`** (уже есть — расширить): добавить `device_id`, `entitlement_id`, `language_detected text`, `expires_at` (= created_at + 30 days).
- **`tariffs`** — справочник: `code, title, price_usd, reports_limit, period_days, sort_order, is_active`. Сидинг 3 тарифов + free.
- **`payment_settings`** — `key, value` (хранит `qr_image_url`, `payment_instructions`, `support_contact`). Управляется из админки.

Функции (SECURITY DEFINER):
- `consume_entitlement(p_user_id, p_device_id)` — атомарно списывает 1 расшифровку из ближайшего активного entitlement, возвращает `entitlement_id` или ошибку.
- `grant_free_trial(p_user_id, p_device_id)` — выдаёт бесплатный entitlement, если ещё не выдавался.
- `mark_order_paid(p_order_id)` — переводит заказ в `paid`, создаёт `user_entitlement` по тарифу.
- `claim_guest_data(p_device_id)` — при логине переносит записи на `auth.uid()`.
- `get_my_reports()` — отчёты текущего пользователя/гостя за 30 дней.

Очистка: cron / RPC `purge_expired_reports()` удаляет `user_analyses` старше 30 дней (запускается из edge function по требованию + при заходе на «Мои отчёты»).

## 3. Конфиг тарифов

Файл `src/config/tariffs.ts`:

```ts
export const TARIFFS = {
  free:    { code:'free',    title:'Пробная',           price_usd: 0,  reports: 1, period_days: null },
  single:  { code:'single',  title:'Разовая расшифровка', price_usd: 5,  reports: 1, period_days: 30 },
  monthly: { code:'monthly', title:'Здоровье месяца',     price_usd: 15, reports: 3, period_days: 30 },
  family:  { code:'family',  title:'Семейный',            price_usd: 30, reports: 7, period_days: 30 },
} as const;
```

Цены продублированы в таблице `tariffs` (используется на бэкенде для валидации); фронт-конфиг — для быстрого редактирования и UI.

## 4. Edge Function `analyze-medical-photo` — изменения

- Принимает `user_id?` или `device_id` (один из обязательно).
- Перед вызовом ИИ: `consume_entitlement` → если нет → 402 «Нет активных расшифровок, выберите тариф».
- В системный промпт: «Документ может быть на английском, вьетнамском, тайском или русском. Определи язык автоматически. Отчёт всегда возвращай на русском.»
- Добавить в JSON-ответ поле `language_detected` («en»|«vi»|«th»|«ru»|«other»).
- При сохранении в `user_analyses`: проставить `entitlement_id`, `language_detected`, `expires_at = now() + 30 days`, `device_id` или `user_id`.

## 5. Новые страницы и компоненты (B2C)

- **`/tariffs`** — карточки 3 платных тарифов + бейдж «1 бесплатно для новых». Кнопка «Выбрать» → создаёт `user_orders` (RPC `create_order`) → редирект на `/pay/:orderId`.
- **`/pay/:orderId`** — крупный QR (статичная картинка из `payment_settings.qr_image_url`, fallback — заглушка), сумма USD, инструкция, кнопка «Я оплатил» (переводит заказ в `paid`, показывает «Спасибо! Отчёт появится в Мои отчёты после проверки оплаты»). Кнопка «Отмена».
- **`/my-reports`** — список `user_analyses` за 30 дней (свои + гостевые по device_id), плашка «Отчёты хранятся 30 дней», клик → открытие отчёта (переиспользуем `AnalysisReport`).
- **`/analyze`** — перед запуском анализа проверяет наличие активного entitlement; если нет — редирект на `/tariffs` (с сохранением загруженного файла в state).

Меню (Header / DesktopNav / BottomNavigation):
- Главная, Расшифровать, **Мои отчёты**, **Тарифы**, Поделиться.
- Убрать пункты «Партнёры» / «Клиники» из публичного меню и футера. Роуты `/partner/*`, `/c/:slug`, `/admin` остаются рабочими по прямой ссылке.

## 6. Скрытие B2B

- Удалить ссылки на партнёрские страницы из `Header.tsx`, `DesktopNav.tsx`, `BottomNavigation.tsx`, `Home.tsx`, футера.
- Роуты в `App.tsx` оставить без изменений.
- В `Home.tsx` убрать секции «Для клиник», оставить только B2C-контент.

## 7. Админка (`/admin`)

Добавить вкладки:
- **Заказы** — список `user_orders`, фильтр по статусу, кнопки «Пометить обработанным» (`processed`), отмена.
- **Настройки оплаты** — загрузка/смена QR-картинки (Supabase Storage bucket `payment-assets`, публичный), редактирование инструкции и контакта поддержки.
- **Тарифы** — редактирование цен/лимитов (таблица `tariffs`).

## 8. Что предлагаю улучшить (на ваше усмотрение)

- **Уведомление администратору** при создании заказа и нажатии «Я оплатил» (Telegram-бот через существующую функцию `telegram-auth` — можно расширить или добавить `notify-admin`). Даст возможность быстро подтверждать оплату вручную.
- **Email-уведомление пользователю** когда отчёт переведён в `processed` (Resend через edge function, опционально).
- **Бейдж «Осталось N расшифровок до DD.MM»** в шапке после покупки — повышает доверие.
- **Кнопка «Скачать PDF»** уже есть в отчётах — добавить её и в «Мои отчёты».
- **Микро-аналитика конверсии**: считать просмотры `/tariffs` → создание заказа → `paid` → `processed`.

## Технические детали

| Файл | Изменение |
|---|---|
| `supabase/migrations/<ts>_b2c_tariffs.sql` | Все новые таблицы, RPC, RLS, GRANT, seed тарифов |
| `supabase/functions/analyze-medical-photo/index.ts` | Списание entitlement, авто-язык в промпте, сохранение `language_detected` |
| `supabase/functions/notify-admin/index.ts` (новая) | Telegram-уведомление о новом/оплаченном заказе |
| `src/config/tariffs.ts` (новый) | Конфиг цен |
| `src/hooks/useCurrentUser.ts` (новый) | `{ user, deviceId, isGuest }` |
| `src/hooks/useEntitlements.ts` (новый) | Остаток расшифровок |
| `src/pages/Tariffs.tsx` (новый) | Страница тарифов |
| `src/pages/Pay.tsx` (новый) | Страница оплаты QR |
| `src/pages/MyReports.tsx` (новый) | Список отчётов за 30 дней |
| `src/pages/Login.tsx` | Email/password + Google через `lovable.auth.signInWithOAuth` |
| `src/pages/Analyze.tsx` | Проверка entitlement перед анализом |
| `src/pages/Admin.tsx` | Вкладки Заказы / Настройки оплаты / Тарифы |
| `src/components/Header.tsx`, `DesktopNav.tsx`, `BottomNavigation.tsx` | Новое меню, убрать B2B |
| `src/pages/Home.tsx` | Убрать B2B-секции, добавить блок про тарифы и бесплатную расшифровку |
| `src/App.tsx` | Новые роуты `/tariffs`, `/pay/:orderId`, `/my-reports` |
| `src/integrations/supabase/types.ts` | Регенерируется после миграции |

После одобрения иду по шагам: миграция → конфиг → хуки → страницы → меню → edge function → админка.
