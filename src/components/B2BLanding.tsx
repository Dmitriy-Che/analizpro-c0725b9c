import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, LineChart, QrCode, ShieldCheck, Users } from 'lucide-react';

/**
 * Лендинг для режима B2B: показывается вместо пользовательских блоков,
 * когда платформа работает только с клиниками и партнёрами.
 */
export function B2BLanding() {
  const navigate = useNavigate();

  const features = [
    { Icon: Users, title: 'Партнёрский кабинет', desc: 'Статистика приёмов, пациентов и расшифровок клиники в одном месте.' },
    { Icon: QrCode, title: 'QR-код клиники', desc: 'Персональная брендированная ссылка и QR-код для пациентов.' },
    { Icon: LineChart, title: 'Аналитика', desc: 'Визиты, география, возраст и пол пациентов, динамика по дням.' },
    { Icon: ShieldCheck, title: 'Тарифы для клиник', desc: 'Пробный период и планы на 500 / 1500 / 3000 расшифровок.' },
  ];

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
          <Building2 className="w-4 h-4" />
          Для клиник и партнёров
        </div>
        <h1 className="text-3xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
          ИИ-расшифровка анализов{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            для вашей клиники
          </span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Подключите брендированную страницу расшифровки анализов, УЗИ и МРТ для своих пациентов.
          Собственный QR-код, статистика и понятные тарифы.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8">
        {features.map(({ Icon, title, desc }) => (
          <Card key={title} className="p-5 lg:p-6 border-2 border-border/50 bg-card/80">
            <Icon className="w-8 h-8 lg:w-10 lg:h-10 mb-3 text-primary" />
            <h3 className="text-lg font-bold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => navigate('/partner/register')} variant="hero" size="xl">
          Заявка на подключение
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <Button onClick={() => navigate('/partner/login')} variant="brand-outline" size="xl">
          Кабинет клиники
        </Button>
      </div>
    </section>
  );
}
