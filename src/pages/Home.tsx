import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTelegramAuth } from '@/contexts/TelegramAuthContext';
import { TelegramLoginWidget } from '@/components/TelegramLoginWidget';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, FileText, Clock, User, LogOut, Shield, Zap, Heart } from 'lucide-react';
import logo from '@/assets/new-logo.png';
import { supabase } from '@/integrations/supabase/client';

const TELEGRAM_BOT_NAME = 'MedGidAnalysisBot';

export default function Home() {
  const navigate = useNavigate();
  const { user, recentAnalyses, isAuthenticated, isMiniApp, logout, isLoading } = useTelegramAuth();

  // Track visit
  useEffect(() => {
    supabase.functions.invoke('track-visit').catch(console.error);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStudyTypeLabel = (type: string) => {
    switch (type) {
      case 'lab': return 'Анализы';
      case 'ultrasound': return 'УЗИ';
      case 'mri': return 'МРТ';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-20">
      {/* Desktop decorative background */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-[480px] lg:max-w-[520px] mx-auto px-4 py-6 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-10">
          <img 
            src={logo} 
            alt="АнализПро" 
            className="w-24 h-24 lg:w-32 lg:h-32 mx-auto shadow-lg mb-4 animate-fade-in object-contain"
          />
          <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            АнализПро<span className="text-sm align-super">©</span>
          </h1>
          <p className="text-muted-foreground lg:text-lg">Расшифровка анализов с помощью ИИ</p>
        </div>

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

        {/* Auth Section */}
        {isLoading ? (
          <Card className="p-8 mb-6 border-2 border-border/50">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </Card>
        ) : isAuthenticated ? (
          <Card className="p-4 mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-3">
              {user?.photo_url ? (
                <img 
                  src={user.photo_url} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold text-foreground">
                  {user?.first_name} {user?.last_name}
                </div>
                {user?.username && (
                  <div className="text-sm text-muted-foreground">@{user.username}</div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ) : !isMiniApp ? (
          <Card className="p-6 mb-6 border-2 border-border/50">
            <h3 className="text-lg font-semibold text-center mb-4">Войти через Telegram</h3>
            <TelegramLoginWidget botName={TELEGRAM_BOT_NAME} />
            <p className="text-xs text-muted-foreground text-center mt-3">
              Авторизуйтесь, чтобы сохранять историю анализов
            </p>
          </Card>
        ) : null}

        {/* Recent Analyses */}
        {isAuthenticated && recentAnalyses.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Последние анализы
            </h3>
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => (
                <Card 
                  key={analysis.id}
                  className="p-4 border-2 border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => navigate('/results', { 
                    state: { 
                      result: analysis.full_result,
                      age: analysis.age,
                      gender: analysis.gender 
                    } 
                  })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {getStudyTypeLabel(analysis.study_type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(analysis.created_at)}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {analysis.result_summary && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {analysis.result_summary}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <Card className="p-5 mb-6 border-2 border-border/50 bg-card/80">
          <h3 className="font-semibold mb-3 text-lg">Как это работает?</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span>Загрузите фото анализа, УЗИ или МРТ</span>
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
        <Button
          onClick={() => navigate('/analyze')}
          className="w-full h-14 lg:h-16 text-lg lg:text-xl font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
        >
          Начать расшифровку
          <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 ml-2" />
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Сервис предоставляет информацию только в ознакомительных целях и не является медицинской консультацией.
        </p>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
          <div>Версия 4.0.0</div>
          <div>© 2025 АнализПро. Все права защищены.</div>
          <a 
            href="https://docs.google.com/document/d/1F4EAz8NiKYt6rmi3SrVG7M99fOhqMXjC0gXsQiGMyUY/edit?usp=sharing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-block"
          >
            Политика конфиденциальности
          </a>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
