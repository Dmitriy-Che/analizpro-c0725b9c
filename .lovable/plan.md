
## План: Преобразование в B2B платформу для медицинских клиник

### Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────┐
│                    B2B Платформа АнализПро                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────────┐        ┌──────────────────────────────┐ │
│   │   Публичная      │        │   Личный кабинет клиники     │ │
│   │   часть          │        │   /partner/dashboard         │ │
│   │   /{slug}        │        │                              │ │
│   │                  │        │   - Статистика               │ │
│   │   - Брендированная       │   - Настройки                 │ │
│   │     страница     │        │   - QR-код                   │ │
│   │   - Анализ       │        │   - Ссылка                   │ │
│   │   - Результаты   │        │                              │ │
│   └──────────────────┘        └──────────────────────────────┘ │
│                                                                 │
│   ┌──────────────────┐        ┌──────────────────────────────┐ │
│   │   Регистрация    │        │   Админ-панель (ваша)        │ │
│   │   партнёров      │        │   /admin                     │ │
│   │   /partner/register      │                              │ │
│   │                  │        │   - Все клиники              │ │
│   │   - Email/пароль │        │   - Общая статистика         │ │
│   │   - Название     │        │   - Управление               │ │
│   │   - Контакты     │        │                              │ │
│   └──────────────────┘        └──────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Шаг 1: Создание таблиц базы данных

**1.1. Таблица `partners` (клиники-партнёры)**
```sql
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                    -- Название клиники
  slug TEXT UNIQUE NOT NULL,             -- Уникальный URL (например: "klinika-zdorovye")
  logo_url TEXT,                         -- Логотип клиники
  contact_email TEXT,                    -- Контактный email
  contact_phone TEXT,                    -- Контактный телефон
  address TEXT,                          -- Адрес
  is_active BOOLEAN DEFAULT true,        -- Статус активности
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**1.2. Таблица `partner_roles` (роли партнёров)**
```sql
-- Роль "partner" добавляется к существующему enum app_role
ALTER TYPE public.app_role ADD VALUE 'partner';

-- Партнёрам назначается роль через user_roles
```

**1.3. Обновление таблицы `analysis_logs`**
```sql
ALTER TABLE public.analysis_logs 
ADD COLUMN partner_id UUID REFERENCES public.partners(id);

-- Добавим индекс для быстрой фильтрации
CREATE INDEX idx_analysis_logs_partner_id ON public.analysis_logs(partner_id);
```

**1.4. Обновление таблицы `visits`**
```sql
ALTER TABLE public.visits 
ADD COLUMN partner_id UUID REFERENCES public.partners(id);

CREATE INDEX idx_visits_partner_id ON public.visits(partner_id);
```

---

### Шаг 2: RLS-политики безопасности

```sql
-- Политики для таблицы partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Партнёр видит только свои данные
CREATE POLICY "Partners can view own data" ON public.partners
  FOR SELECT USING (user_id = auth.uid());

-- Партнёр может обновлять только свои данные
CREATE POLICY "Partners can update own data" ON public.partners
  FOR UPDATE USING (user_id = auth.uid());

-- Админы видят всех партнёров
CREATE POLICY "Admins can view all partners" ON public.partners
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Публичный доступ к активным партнёрам по slug (для публичных страниц)
CREATE POLICY "Anyone can view active partners by slug" ON public.partners
  FOR SELECT USING (is_active = true);
```

---

### Шаг 3: Новые страницы

**3.1. Регистрация партнёра: `/partner/register`**
- Форма регистрации: email, пароль, название клиники
- Автогенерация slug из названия
- Отправка на подтверждение email
- После регистрации → личный кабинет

**3.2. Вход партнёра: `/partner/login`**
- Email + пароль
- Проверка роли "partner"
- Редирект в личный кабинет

**3.3. Личный кабинет: `/partner/dashboard`**
- Статистика только по своим пациентам:
  - Всего визитов
  - Всего анализов
  - Распределение по полу
  - Распределение по возрасту
  - Типы анализов
  - Статусы (норма/внимание/критично)
- Уникальная ссылка на приложение: `https://analizpro.lovable.app/c/{slug}`
- QR-код для печати (генерация на клиенте)
- Настройки профиля

**3.4. Брендированная страница клиники: `/c/{slug}`**
- Показывает логотип клиники (если есть)
- Название клиники
- Все функции анализа работают как обычно
- Статистика привязывается к partner_id

---

### Шаг 4: Обновление существующих файлов

**4.1. App.tsx - новые роуты**
```tsx
<Route path="/partner/register" element={<PartnerRegister />} />
<Route path="/partner/login" element={<PartnerLogin />} />
<Route path="/partner/dashboard" element={<PartnerDashboard />} />
<Route path="/c/:slug" element={<PartnerHome />} />
<Route path="/c/:slug/analyze" element={<PartnerAnalyze />} />
<Route path="/c/:slug/results" element={<PartnerResults />} />
```

**4.2. Edge-функции**
- Обновить `analyze-medical-photo`: принимать `partner_id` и сохранять в `analysis_logs`
- Обновить `track-visit`: принимать `partner_id` и сохранять в `visits`

**4.3. Новые database functions**
```sql
-- Статистика для конкретного партнёра
CREATE FUNCTION get_partner_stats(p_partner_id UUID)
RETURNS TABLE(...) AS $$
  -- Аналогично get_analysis_stats, но с фильтром по partner_id
$$;
```

---

### Шаг 5: Новые компоненты

**5.1. `QRCodeGenerator.tsx`**
- Генерация QR-кода из URL
- Возможность скачать как PNG
- Библиотека: `qrcode` или `qrcode.react`

**5.2. `PartnerHeader.tsx`**
- Показывает логотип клиники (или логотип АнализПро если нет)
- Название клиники
- Надпись "Сервис от АнализПро"

---

### Шаг 6: Структура файлов

```text
src/
├── pages/
│   ├── partner/
│   │   ├── Register.tsx      -- Регистрация партнёра
│   │   ├── Login.tsx         -- Вход партнёра
│   │   └── Dashboard.tsx     -- Личный кабинет
│   └── clinic/
│       ├── Home.tsx          -- /c/{slug} - главная клиники
│       ├── Analyze.tsx       -- /c/{slug}/analyze
│       └── Results.tsx       -- /c/{slug}/results
├── components/
│   ├── QRCodeGenerator.tsx
│   ├── PartnerHeader.tsx
│   └── PartnerStats.tsx
└── hooks/
    └── usePartner.ts         -- Хук для работы с данными партнёра
```

---

### Технические детали

**Генерация slug:**
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^а-яa-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}
```

**QR-код:**
- Установить `qrcode.react`: `npm install qrcode.react`
- Генерировать QR с URL клиники

**Определение partner_id:**
- На страницах `/c/{slug}` - по slug из URL
- На обычных страницах - `null` (общие пользователи)

---

### Последовательность реализации

1. **Миграция базы данных** - создание таблиц и политик
2. **Регистрация/вход партнёров** - страницы и логика
3. **Личный кабинет партнёра** - статистика и настройки
4. **Брендированные страницы** - `/c/{slug}/*`
5. **QR-код генератор** - в личном кабинете
6. **Обновление edge-функций** - привязка к partner_id
7. **Обновление админ-панели** - просмотр всех партнёров
