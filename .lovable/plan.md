
# План: Названия городов на русском языке

## Проблема
Блок «Топ городов» в админ-панели показывает названия на английском (например, "Moscow" вместо "Москва"), потому что API геолокации `ip-api.com` по умолчанию возвращает данные на английском.

## Решение

### 1. Для новых данных — изменить запросы к API геолокации
Добавить параметр `lang=ru` в URL запроса к ip-api.com. Это заставит API возвращать названия городов сразу на русском языке.

**Файлы для изменения:**
- `supabase/functions/track-visit/index.ts` — строка 39
- `supabase/functions/analyze-medical-photo/index.ts` — аналогичный запрос к ip-api.com

```text
Было:  http://ip-api.com/json/${ipAddress}?fields=status,country,city
Будет: http://ip-api.com/json/${ipAddress}?fields=status,country,city&lang=ru
```

### 2. Для существующих данных — словарь перевода
Поскольку в базе уже есть записи с английскими названиями, добавить функцию-переводчик для отображения.

**Файл:** `src/pages/Admin.tsx`

Добавить словарь популярных городов:
```text
const cityTranslations: Record<string, string> = {
  "Moscow": "Москва",
  "Saint Petersburg": "Санкт-Петербург",
  "Novosibirsk": "Новосибирск",
  "Yekaterinburg": "Екатеринбург",
  "Kazan": "Казань",
  "Nizhny Novgorod": "Нижний Новгород",
  "Chelyabinsk": "Челябинск",
  "Samara": "Самара",
  "Omsk": "Омск",
  "Rostov-on-Don": "Ростов-на-Дону",
  "Ufa": "Уфа",
  "Krasnoyarsk": "Красноярск",
  "Perm": "Пермь",
  "Voronezh": "Воронеж",
  "Volgograd": "Волгоград",
  "Krasnodar": "Краснодар",
  "Saratov": "Саратов",
  "Tyumen": "Тюмень",
  "Tolyatti": "Тольятти",
  "Izhevsk": "Ижевск",
  "Barnaul": "Барнаул",
  "Ulyanovsk": "Ульяновск",
  "Irkutsk": "Иркутск",
  "Khabarovsk": "Хабаровск",
  "Yaroslavl": "Ярославль",
  "Vladivostok": "Владивосток",
  "Makhachkala": "Махачкала",
  "Tomsk": "Томск",
  "Orenburg": "Оренбург",
  "Kemerovo": "Кемерово",
  "Novokuznetsk": "Новокузнецк",
  "Ryazan": "Рязань",
  "Astrakhan": "Астрахань",
  "Naberezhnyye Chelny": "Набережные Челны",
  "Penza": "Пенза",
  "Kirov": "Киров",
  "Lipetsk": "Липецк",
  "Cheboksary": "Чебоксары",
  "Balashikha": "Балашиха",
  "Kaliningrad": "Калининград",
  "Tula": "Тула",
  "Kursk": "Курск",
  "Sochi": "Сочи",
  "Stavropol": "Ставрополь",
  "Bryansk": "Брянск",
  "Ivanovo": "Иваново",
  "Belgorod": "Белгород",
  "Surgut": "Сургут",
  "Vladimir": "Владимир",
  "Arkhangelsk": "Архангельск",
  "Chita": "Чита",
  "Kaluga": "Калуга",
  "Smolensk": "Смоленск",
  "Saransk": "Саранск",
  "Vologda": "Вологда",
  "Tver": "Тверь",
  "Yoshkar-Ola": "Йошкар-Ола",
  "Almaty": "Алматы",
  "Nur-Sultan": "Нур-Султан",
  "Astana": "Астана",
  "Bishkek": "Бишкек",
  "Tashkent": "Ташкент",
  "Minsk": "Минск",
  "Kyiv": "Киев",
  "Kiev": "Киев"
  // ... и другие
};

const translateCity = (city: string | null): string => {
  if (!city) return 'Неизвестно';
  return cityTranslations[city] || city;
};
```

И использовать при отображении (строка 623):
```tsx
{translateCity(cityData.city)}
```

---

## Технические детали

| Файл | Изменения |
|------|-----------|
| `supabase/functions/track-visit/index.ts` | Добавить `&lang=ru` в URL |
| `supabase/functions/analyze-medical-photo/index.ts` | Добавить `&lang=ru` в URL |
| `src/pages/Admin.tsx` | Добавить словарь и функцию перевода |

## Результат
- Новые визиты будут сохраняться сразу с русскими названиями городов
- Старые данные будут отображаться на русском благодаря словарю перевода
- Города, которых нет в словаре, отобразятся как есть (на английском)
