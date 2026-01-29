import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Shield, Zap, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
export default function Home() {
  const navigate = useNavigate();

  // Track visit
  useEffect(() => {
    supabase.functions.invoke('track-visit').catch(console.error);
  }, []);
  return <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-20">
      {/* Desktop decorative background */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-[480px] lg:max-w-[520px] mx-auto px-4 py-6 lg:py-12">
        {/* Header */}
        <Header />
        <p className="text-muted-foreground lg:text-lg text-center mb-8">Расшифровка любых анализов за 5 секунд!</p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-8">
          <Card className="p-3 lg:p-4 text-center border-2 border-primary/20 bg-card/80 hover:border-primary/40 transition-colors">
            <Shield className="w-6 h-6 lg:w-7 lg:h-7 mx-auto mb-1 text-primary" />
            <span className="text-xs lg:text-sm font-medium text-muted-foreground">Безопасно</span>
          </Card>
          <Card className="p-3 lg:p-4 text-center border-2 border-accent/20 bg-card/80 hover:border-accent/40 transition-colors">
            <Zap className="w-6 h-6 lg:w-7 lg:h-7 mx-auto mb-1 text-accent" />
            <span className="text-xs lg:text-sm font-medium text-muted-foreground">Быстро</span>
          </Card>
          <Card className="p-3 lg:p-4 text-center border-2 border-secondary/20 bg-card/80 hover:border-secondary/40 transition-colors">
            <Heart className="w-6 h-6 lg:w-7 lg:h-7 mx-auto mb-1 text-secondary" />
            <span className="text-xs lg:text-sm font-medium text-muted-foreground">Понятно</span>
          </Card>
        </div>

        {/* Description */}
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

        {/* Start Button */}
        <Button onClick={() => navigate('/analyze')} className="w-full h-14 lg:h-16 text-lg lg:text-xl font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
          Начать расшифровку
          <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 ml-2" />
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Сервис предоставляет информацию только в ознакомительных целях и не является медицинской консультацией.
        </p>

        {/* Telegram Channel Block */}
        <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-accent/10 text-center rounded-2xl border-2 border-primary/20 shadow-md">
          <div className="text-base font-semibold mb-1 text-foreground">💬 Присоединяйтесь к нам!</div>
          <p className="text-sm text-muted-foreground mb-4">Обновления, советы по здоровью и новости медицины</p>
          <Button asChild className="bg-accent hover:bg-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <a href="https://t.me/medgid_mo" target="_blank" rel="noopener noreferrer">
              Перейти в Telegram-канал
            </a>
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
          <div>Версия 4.0.1</div>
          <div>© 2026 АнализПро. Все права защищены.</div>
          <a href="https://docs.google.com/document/d/1F4EAz8NiKYt6rmi3SrVG7M99fOhqMXjC0gXsQiGMyUY/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-block">
            Политика конфиденциальности
          </a>
        </div>
      </div>

      <BottomNavigation />
    </div>;
}