import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { DesktopNav } from '@/components/DesktopNav';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Shield, Zap, Heart, Sparkles, FileText, Stethoscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.functions.invoke('track-visit').catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-20 lg:pb-12">
      {/* Desktop decorative background */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <DesktopNav />

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden relative max-w-[480px] mx-auto px-4 py-6">
        <Header />
        <p className="text-muted-foreground text-center mb-8">Расшифровка любых анализов за 5 секунд!</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="p-3 text-center border-2 border-primary/20 bg-card/80">
            <Shield className="w-6 h-6 mx-auto mb-1 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Безопасно</span>
          </Card>
          <Card className="p-3 text-center border-2 border-accent/20 bg-card/80">
            <Zap className="w-6 h-6 mx-auto mb-1 text-accent" />
            <span className="text-xs font-medium text-muted-foreground">Быстро</span>
          </Card>
          <Card className="p-3 text-center border-2 border-secondary/20 bg-card/80">
            <Heart className="w-6 h-6 mx-auto mb-1 text-secondary" />
            <span className="text-xs font-medium text-muted-foreground">Понятно</span>
          </Card>
        </div>

        <Card className="p-5 mb-6 border-2 border-border/50 bg-card/80">
          <h3 className="font-semibold mb-3 text-lg">Как это работает?</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span>Загрузите фото любого анализа, УЗИ, МРТ</span>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span>Укажите возраст и пол пациента</span>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span>Получите расшифровку с рекомендациями</span>
            </div>
          </div>
        </Card>

        <Button
          onClick={() => navigate('/analyze')}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
        >
          Начать расшифровку
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Сервис предоставляет информацию только в ознакомительных целях и не является медицинской консультацией.
        </p>

        <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-accent/10 text-center rounded-2xl border-2 border-primary/20 shadow-md">
          <div className="text-base font-semibold mb-1 text-foreground">💬 Присоединяйтесь к нам!</div>
          <p className="text-sm text-muted-foreground mb-4">Обновления, советы по здоровью и новости медицины</p>
          <Button asChild className="bg-accent hover:bg-accent/90 text-white font-semibold shadow-lg">
            <a href="https://t.me/medgid_mo" target="_blank" rel="noopener noreferrer">
              Перейти в Telegram-канал
            </a>
          </Button>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
          <div>Версия 4.1.0</div>
          <div>© 2026 АнализПро. Все права защищены.</div>
          <a href="https://docs.google.com/document/d/1F4EAz8NiKYt6rmi3SrVG7M99fOhqMXjC0gXsQiGMyUY/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-block">
            Политика конфиденциальности
          </a>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:block relative max-w-6xl mx-auto px-8 py-16">
        {/* Hero */}
        <section className="grid grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              ИИ-расшифровка медицинских анализов
            </div>
            <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.05] mb-6">
              Понятная расшифровка{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                анализов, УЗИ и МРТ
              </span>{' '}
              за 5 секунд
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Загрузите фото исследования — искусственный интеллект объяснит результаты простым языком
              и даст персональные рекомендации с учётом возраста и пола.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => navigate('/analyze')}
                className="h-14 px-8 text-base font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
              >
                Начать расшифровку
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/partner/login')}
                className="h-14 px-8 text-base font-semibold border-2"
              >
                Для клиник и партнёров
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6 max-w-md">
              Сервис носит ознакомительный характер и не заменяет консультацию врача.
            </p>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 p-1 shadow-2xl">
              <div className="w-full h-full rounded-[22px] bg-card/90 backdrop-blur p-8 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg mb-6">
                  <Stethoscope className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-2">АнализПро©</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Стандарты WHO, AACC, EFLM. Актуальные клинические протоколы 2025 года.
                </p>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 px-4 py-2 rounded-2xl bg-card border-2 border-primary/20 shadow-lg flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold">5 секунд</span>
            </div>
            <div className="absolute -bottom-4 -left-4 px-4 py-2 rounded-2xl bg-card border-2 border-accent/20 shadow-lg flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Анонимно</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-3 gap-6 mb-20">
          {[
            { Icon: Shield, color: 'text-primary', bg: 'border-primary/20', title: 'Безопасно', desc: 'Мы не храним фото и результаты. Данные обрабатываются анонимно.' },
            { Icon: Zap, color: 'text-accent', bg: 'border-accent/20', title: 'Быстро', desc: 'Готовая расшифровка появляется через несколько секунд после загрузки.' },
            { Icon: Heart, color: 'text-secondary', bg: 'border-secondary/20', title: 'Понятно', desc: 'Сложные медицинские термины объясняются простым человеческим языком.' },
          ].map(({ Icon, color, bg, title, desc }) => (
            <Card key={title} className={`p-7 border-2 ${bg} bg-card/80 hover:shadow-lg transition-all`}>
              <Icon className={`w-10 h-10 mb-4 ${color}`} />
              <h3 className="text-xl font-bold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </Card>
          ))}
        </section>

        {/* How it works */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">Как это работает</h2>
            <p className="text-muted-foreground">Три простых шага — и расшифровка готова</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { n: '1', title: 'Загрузите снимок', desc: 'Сфотографируйте или прикрепите файл анализа, УЗИ или МРТ.' },
              { n: '2', title: 'Укажите данные', desc: 'Возраст, пол и тип исследования — для точной интерпретации.' },
              { n: '3', title: 'Получите расшифровку', desc: 'Структурированный отчёт с диаграммами и рекомендациями.' },
            ].map((step) => (
              <Card key={step.n} className="p-7 border-2 border-border/50 bg-card/80 relative overflow-hidden">
                <div className="absolute -top-4 -right-2 text-[120px] font-black text-primary/5 leading-none select-none">
                  {step.n}
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-white font-black text-lg flex items-center justify-center mb-4 shadow-md">
                    {step.n}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl bg-gradient-to-br from-primary to-accent p-12 text-center shadow-xl mb-12">
          <FileText className="w-14 h-14 text-white mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-3">Готовы расшифровать ваш анализ?</h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto">
            Это бесплатно и занимает меньше минуты. Никакой регистрации не требуется.
          </p>
          <Button
            onClick={() => navigate('/analyze')}
            className="h-14 px-10 text-base font-bold bg-white text-primary hover:bg-white/90 shadow-lg"
          >
            Загрузить анализ
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground space-y-2 pt-8 border-t border-border">
          <div>Версия 4.1.0 · © 2026 АнализПро. Все права защищены.</div>
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
