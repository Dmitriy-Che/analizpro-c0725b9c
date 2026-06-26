// Конфиг тарифов. Цены продублированы в БД (таблица tariffs) для валидации на сервере.
// Здесь только UI-метаданные и быстрая настройка отображения.

export type TariffCode = 'free' | 'single' | 'monthly' | 'family';

export interface TariffConfig {
  code: TariffCode;
  title: string;
  subtitle: string;
  price_usd: number;
  reports: number;
  period_days: number | null;
  features: string[];
  highlight?: boolean;
}

export const TARIFFS: Record<Exclude<TariffCode, 'free'>, TariffConfig> = {
  single: {
    code: 'single',
    title: 'Разовая расшифровка',
    subtitle: 'Когда нужен один отчёт',
    price_usd: 5,
    reports: 1,
    period_days: 30,
    features: [
      '1 расшифровка',
      'Действует 30 дней',
      'Отчёт хранится 30 дней',
      'Поддержка любого языка анализа',
    ],
  },
  monthly: {
    code: 'monthly',
    title: 'Здоровье месяца',
    subtitle: 'Оптимально для регулярных проверок',
    price_usd: 15,
    reports: 3,
    period_days: 30,
    features: [
      'До 3 расшифровок',
      'Действует 30 дней',
      'История отчётов',
      'Приоритетная обработка',
    ],
    highlight: true,
  },
  family: {
    code: 'family',
    title: 'Семейный',
    subtitle: 'Для всей семьи',
    price_usd: 30,
    reports: 7,
    period_days: 30,
    features: [
      'До 7 расшифровок',
      'Действует 30 дней',
      'Подходит для всей семьи',
      'Приоритетная обработка',
    ],
  },
};

export const TARIFF_LIST = Object.values(TARIFFS);

export function getTariff(code: string): TariffConfig | undefined {
  return TARIFFS[code as Exclude<TariffCode, 'free'>];
}

export const FREE_TRIAL_REPORTS = 1;
export const REPORTS_RETENTION_DAYS = 30;
