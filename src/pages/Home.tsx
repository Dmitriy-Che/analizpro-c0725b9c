import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import telegramBotQr from '@/assets/telegram-bot-qr.png.asset.json';
import { BottomNavigation } from '@/components/BottomNavigation';
import { DesktopNav } from '@/components/DesktopNav';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowRight,
  Brain,
  FileText,
  Gift,
  Globe2,
  Heart,
  MessageCircle,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ReferralCard } from '@/components/ReferralCard';
import { ReferralGiftBanner } from '@/components/ReferralGiftBanner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEntitlements } from '@/hooks/useEntitlements';
import { CircleFlag } from 'react-circle-flags';
import Flag from 'react-flagkit';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { entitlements } = useEntitlements();
  const { b2cEnabled, b2bEnabled } = usePlatformMode();
  const hasUsedAnalysis = entitlements.some((e) => e.reports_used > 0);
  const hideFreeTrial = !!user && hasUsedAnalysis;
  const b2bOnly = !b2cEnabled && b2bEnabled;

  useEffect(() => {
    supabase.functions.invoke('track-visit').catch(console.error);
  }, []);

  if (b2bOnly) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pt-16 lg:pt-0 pb-6 lg:pb-12">
        <DesktopNav />
        <div className="lg:hidden max-w-[480px] mx-auto px-4 py-6">
          <Header />
          <B2BLanding />
        </div>
        <div className="hidden lg:block max-w-6xl mx-auto px-8 py-16">
          <B2BLanding />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pt-16 lg:pt-0 pb-6 lg:pb-12">
      <div className="hidden lg:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <DesktopNav />


      {/* MOBILE */}
      <div className="lg:hidden relative max-w-[480px] mx-auto px-4 py-6">
        <Header />
        <p className="text-muted-foreground text-center mb-6">
          Расшифровка анализов на русском, английском, вьетнамском и тайском
        </p>

        <ReferralGiftBanner />

        {!hideFreeTrial && (
          <Card className="p-4 mb-6 border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-primary/10">
            <div className="flex items-center gap-3 mb-1.5">
              <Gift className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold">1 бесплатная расшифровка</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Для новых пользователей — быстрая регистрация, оплата не требуется.
            </p>
            <Button
              onClick={() => navigate('/tariffs?claim=free')}
              variant="cta"
              size="xl"
              className="w-full"
            >
              Попробовать бесплатно!
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 text-center border-2 border-primary/20 bg-card/80">
            <Shield className="w-6 h-6 mx-auto mb-1 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Безопасно</span>
          </Card>
          <Card className="p-3 text-center border-2 border-accent/20 bg-card/80">
            <Zap className="w-6 h-6 mx-auto mb-1 text-accent" />
            <span className="text-xs font-medium text-muted-foreground">Быстро</span>
          </Card>
          <Card className="p-3 text-center border-2 border-secondary/20 bg-card/80">
            <Globe2 className="w-6 h-6 mx-auto mb-1 text-secondary" />
            <span className="text-xs font-medium text-muted-foreground">EN / VI / TH</span>
          </Card>
        </div>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-center mb-4">Почему нам можно доверять</h2>
          <Card className="p-4 border border-border/50 bg-card/80">
            <div className="space-y-4">
              {[
                { Icon: Brain, text: 'Используем новейшие нейросети в медицине для структурированного анализа результатов по стандартам WHO 2026.', color: 'text-primary' },
                { Icon: ShieldCheck, text: 'Не храним ваши документы дольше необходимого для обработки.', color: 'text-accent' },
                { Icon: MessageCircle, text: 'Объясняем показатели простым языком без лишней медицинской терминологии.', color: 'text-secondary' },
                { Icon: Stethoscope, text: 'Помогаем подготовиться к беседе с вашим врачом.', color: 'text-primary' },
              ].map(({ Icon, text, color }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon className={`w-6 h-6 flex-shrink-0 ${color}`} />
                  <p className="text-sm text-muted-foreground leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>



        <section className="mb-6">
          <h2 className="text-lg font-bold text-center mb-4">Как это работает?</h2>
          <Card className="p-5 border-2 border-border/50 bg-card/80">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span>Загрузите фото анализа на любом из 4 языков</span>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>Укажите возраст и пол</span>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>Получите расшифровку на русском</span>
              </div>
            </div>
          </Card>
        </section>

        <Button
          onClick={() => navigate('/analyze')}
          variant="hero"
          size="xl"
          className="w-full"
        >
          Загрузить анализ
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <div className="mt-6">
          <ReferralCard />
        </div>




        <p className="text-xs text-muted-foreground text-center mt-6">
          Сервис предоставляет информацию только в ознакомительных целях и не является медицинской консультацией.
        </p>

        <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-accent/10 text-center rounded-2xl border-2 border-primary/20 shadow-md">
          <h2 className="text-lg font-bold text-center mb-4">💬 Присоединяйтесь к нам!</h2>
          <p className="text-sm text-muted-foreground mb-4">Обновления и советы по здоровью</p>
          <Button asChild className="bg-accent hover:bg-accent/90 text-white font-semibold shadow-lg">
            <a href="https://t.me/medgid_mo" target="_blank" rel="noopener noreferrer">
              Перейти в Telegram-канал
            </a>
          </Button>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
          <div>Версия 5.0.0</div>
          <div>© 2026 АнализПро. Все права защищены.</div>
          <a href="https://docs.google.com/document/d/1F4EAz8NiKYt6rmi3SrVG7M99fOhqMXjC0gXsQiGMyUY/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-block">
            Политика конфиденциальности
          </a>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:block relative max-w-6xl mx-auto px-8 py-16">
        <section className="grid grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              ИИ-расшифровка для русских экспатов
            </div>
            <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.05] mb-6">
              Понятная расшифровка{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                анализов, УЗИ и МРТ
              </span>{' '}
              на русском
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Загрузите фото исследования на английском, вьетнамском или тайском — ИИ автоматически
              переведёт и объяснит результаты на русском с учётом возраста и пола.
            </p>
            {!hideFreeTrial && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent text-sm font-semibold mb-6">
                <Gift className="w-4 h-4" />
                1 бесплатная расшифровка для новых пользователей
              </div>
            )}
            <div className="flex gap-4">
              <Button
                onClick={() => navigate('/analyze')}
                variant="hero"
                size="xl"
              >
                Загрузить анализ
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="brand-outline"
                size="xl"
                onClick={() => navigate('/tariffs')}
              >
                Тарифы и оплата
              </Button>
            </div>

          </div>

          <div className="relative">
            <div
              className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 p-1 shadow-2xl cursor-pointer hover:shadow-3xl transition-all"
              onClick={() => navigate('/analyze')}
            >
              <div className="w-full h-full rounded-[22px] bg-card/90 backdrop-blur p-8 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg mb-6">
                  <Upload className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-2 whitespace-pre-line text-center leading-tight">Загрузить анализ{"\n"}(нажать сюда)</h3>
                <div className="flex items-center justify-center gap-2 mb-3" aria-label="Поддерживаемые языки">
                  <Flag country="GB" size={40} className="rounded-sm shadow-sm" title="Английский" />
                  <Flag country="VN" size={40} className="rounded-sm shadow-sm" title="Вьетнамский" />
                  <Flag country="TH" size={40} className="rounded-sm shadow-sm" title="Тайский" />
                  <Flag country="RU" size={40} className="rounded-sm shadow-sm" title="Русский" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Поддержка анализов на английском, вьетнамском, тайском или русском языке.
                </p>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 px-4 py-2 rounded-2xl bg-card border-2 border-primary/20 shadow-lg flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold">5 секунд</span>
            </div>
            <div className="absolute -bottom-4 -left-4 px-4 py-2 rounded-2xl bg-card border-2 border-accent/20 shadow-lg flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">4 языка</span>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-black text-center mb-8">Почему нам можно доверять</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { Icon: Brain, text: 'Используем новейшие нейросети в медицине для структурированного анализа результатов по стандартам WHO 2026.', color: 'text-primary' },
              { Icon: ShieldCheck, text: 'Не храним ваши документы дольше необходимого для обработки.', color: 'text-accent' },
              { Icon: MessageCircle, text: 'Объясняем показатели простым языком без лишней медицинской терминологии.', color: 'text-secondary' },
              { Icon: Stethoscope, text: 'Помогаем подготовиться к беседе с вашим врачом.', color: 'text-primary' },
            ].map(({ Icon, text, color }, i) => (
              <Card key={i} className="p-6 border-2 border-border/50 bg-card/80">
                <Icon className={`w-10 h-10 mb-4 ${color}`} />
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </Card>
            ))}
          </div>
        </section>



        <section className="grid grid-cols-3 gap-6 mb-20">
          {[
            { Icon: Shield, color: 'text-primary', bg: 'border-primary/20', title: 'Безопасно', desc: 'Данные обрабатываются анонимно, отчёты хранятся не более 30 дней.' },
            { Icon: Globe2, color: 'text-accent', bg: 'border-accent/20', title: '4 языка', desc: 'Английский, вьетнамский, тайский, русский. Отчёт всегда на русском.' },
            { Icon: Heart, color: 'text-secondary', bg: 'border-secondary/20', title: 'Понятно', desc: 'Сложные медицинские термины объясняются простым языком.' },
          ].map(({ Icon, color, bg, title, desc }) => (
            <Card key={title} className={`p-7 border-2 ${bg} bg-card/80 hover:shadow-lg transition-all`}>
              <Icon className={`w-10 h-10 mb-4 ${color}`} />
              <h3 className="text-xl font-bold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl bg-gradient-to-br from-primary to-accent p-12 text-center shadow-xl mb-12">
          <FileText className="w-14 h-14 text-white mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-3">Готовы расшифровать ваш анализ?</h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto">
            Первая расшифровка — бесплатно. Без регистрации.
          </p>
          <Button
            onClick={() => navigate('/analyze')}
            className="h-14 px-10 text-base font-bold bg-white text-primary hover:bg-white/90 shadow-lg"
          >
            Загрузить анализ
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </section>

        {/* Реферальная программа */}
        <section className="mb-12">
          <ReferralCard />
        </section>



        {/* Telegram Bot Section */}
        <section className="rounded-3xl border-2 border-primary/20 bg-card/80 p-10 mb-12 grid grid-cols-2 gap-8 items-center shadow-md">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Также в Telegram
            </div>
            <h2 className="text-3xl xl:text-4xl font-black mb-3 leading-tight">
              Пользуйтесь сервисом{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                прямо в Telegram
              </span>
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Отправьте фото анализа нашему боту — получите расшифровку на русском
              за несколько секунд. Никаких приложений устанавливать не нужно.
            </p>
            <Button asChild variant="hero" size="lg">
              <a href="https://t.me/med_gid_bot" target="_blank" rel="noopener noreferrer">
                Открыть @med_gid_bot
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>

          </div>
          <div className="flex justify-center">
            <img
              src={telegramBotQr.url}
              alt="QR-код бота @med_gid_bot"
              className="rounded-2xl max-h-[340px] w-auto shadow-lg border border-border"
            />
          </div>
        </section>

        <footer className="text-center text-sm text-muted-foreground space-y-3 pt-8 border-t border-border">
          <div>Версия 5.0.0 · © 2026 АнализПро. Все права защищены.</div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="https://t.me/medgid_mo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1 font-semibold"
            >
              💬 Telegram-канал: @medgid_mo
            </a>
            <span className="text-border">·</span>
            <a
              href="https://t.me/med_gid_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
            >
              🤖 Бот: @med_gid_bot
            </a>
          </div>
          <a
            href="https://docs.google.com/document/d/1F4EAz8NiKYt6rmi3SrVG7M99fOhqMXjC0gXsQiGMyUY/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-block"
          >
            Политика конфиденциальности
          </a>
        </footer>
      </div>

      <BottomNavigation />
    </div>
  );
}
