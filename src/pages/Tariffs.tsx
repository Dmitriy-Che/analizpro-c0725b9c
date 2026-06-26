import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { DesktopNav } from '@/components/DesktopNav';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Sparkles, Gift } from 'lucide-react';
import { TARIFF_LIST, FREE_TRIAL_REPORTS } from '@/config/tariffs';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEntitlements } from '@/hooks/useEntitlements';
import { toast } from 'sonner';

export default function Tariffs() {
  const navigate = useNavigate();
  const { deviceId } = useCurrentUser();
  const { remaining, hasAvailable, claimFreeTrial, entitlements } = useEntitlements();
  const [busy, setBusy] = useState<string | null>(null);

  const trialUsed = entitlements.some((e) => e.source === 'free_trial');

  const handleBuy = async (code: string) => {
    setBusy(code);
    try {
      const { data, error } = await supabase.rpc('create_order', {
        p_tariff_code: code,
        p_device_id: deviceId,
      });
      if (error) throw error;
      navigate(`/pay/${data}`);
    } catch (e: any) {
      toast.error(e.message || 'Не удалось создать заказ');
    } finally {
      setBusy(null);
    }
  };

  const handleFreeTrial = async () => {
    setBusy('free');
    try {
      await claimFreeTrial();
      toast.success('Бесплатная расшифровка активирована!');
      navigate('/analyze');
    } catch (e: any) {
      toast.error(e.message || 'Ошибка');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-20 lg:pb-12">
      <div className="hidden lg:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <DesktopNav />

      <div className="relative max-w-[480px] lg:max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <div className="lg:hidden">
          <Header />
        </div>

        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Тарифы и оплата
          </div>
          <h1 className="text-3xl lg:text-5xl font-black mb-3">Выберите тариф</h1>
          <p className="text-muted-foreground lg:text-lg">
            {hasAvailable
              ? `У вас осталось расшифровок: ${remaining}`
              : 'Оплата по QR-коду · отчёты хранятся 30 дней'}
          </p>
        </div>

        {/* Бесплатная пробная */}
        {!trialUsed && (
          <Card className="p-5 lg:p-7 mb-6 lg:mb-8 border-2 border-accent/40 bg-gradient-to-br from-accent/10 to-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white bg-accent rounded-bl-xl">
              БЕСПЛАТНО
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg lg:text-xl font-bold mb-1">Пробная расшифровка</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {FREE_TRIAL_REPORTS} бесплатная расшифровка для новых пользователей. Без оплаты, без регистрации.
                </p>
                <Button
                  onClick={handleFreeTrial}
                  disabled={busy === 'free'}
                  className="bg-accent hover:bg-accent/90 text-white font-semibold"
                >
                  {busy === 'free' ? 'Активация...' : 'Активировать бесплатно'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Платные тарифы */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {TARIFF_LIST.map((t) => (
            <Card
              key={t.code}
              className={`p-6 lg:p-8 border-2 relative overflow-hidden transition-all hover:shadow-xl ${
                t.highlight
                  ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5 lg:scale-105'
                  : 'border-border/50 bg-card/80'
              }`}
            >
              {t.highlight && (
                <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-primary to-accent rounded-bl-xl">
                  ПОПУЛЯРНЫЙ
                </div>
              )}
              <h3 className="text-xl lg:text-2xl font-black mb-1">{t.title}</h3>
              <p className="text-sm text-muted-foreground mb-5">{t.subtitle}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl lg:text-5xl font-black">${t.price_usd}</span>
                <span className="text-muted-foreground text-sm">
                  / {t.reports} {t.reports === 1 ? 'отчёт' : t.reports < 5 ? 'отчёта' : 'отчётов'}
                </span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleBuy(t.code)}
                disabled={busy === t.code}
                className={`w-full h-12 font-bold ${
                  t.highlight
                    ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                    : ''
                }`}
                variant={t.highlight ? 'default' : 'outline'}
              >
                {busy === t.code ? 'Создание заказа...' : 'Выбрать'}
              </Button>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8 max-w-xl mx-auto">
          Оплата выполняется по QR-коду через банковское приложение. После оплаты нажмите «Я оплатил» — мы проверим перевод и активируем расшифровки. Отчёты хранятся 30 дней.
        </p>
      </div>

      <BottomNavigation />
    </div>
  );
}
