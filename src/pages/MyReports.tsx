import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation } from '@/components/BottomNavigation';
import { DesktopNav } from '@/components/DesktopNav';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { REPORTS_RETENTION_DAYS } from '@/config/tariffs';

interface Report {
  id: string;
  title: string | null;
  study_type: string | null;
  age: number | null;
  gender: string | null;
  language_detected: string | null;
  result_json: any;
  full_result: string | null;
  created_at: string;
  expires_at: string;
}

const STUDY_LABELS: Record<string, string> = {
  lab: 'Лабораторные анализы',
  ultrasound: 'УЗИ',
  mri: 'МРТ',
};

const LANG_LABELS: Record<string, string> = {
  en: '🇬🇧 Английский',
  vi: '🇻🇳 Вьетнамский',
  th: '🇹🇭 Тайский',
  ru: '🇷🇺 Русский',
};

export default function MyReports() {
  const navigate = useNavigate();
  const { deviceId, user, loading: userLoading } = useCurrentUser();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    (async () => {
      const { data } = await supabase.rpc('get_my_reports', { p_device_id: deviceId });
      if (data) setReports(data as Report[]);
      setLoading(false);
    })();
  }, [deviceId, userLoading, user?.id]);

  const openReport = (r: Report) => {
    navigate('/results', {
      state: {
        result: r.full_result || JSON.stringify(r.result_json),
        age: r.age?.toString() ?? '',
        gender: r.gender ?? '',
        fromHistory: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-20 lg:pb-12">
      <DesktopNav />

      <div className="relative max-w-[480px] lg:max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <div className="lg:hidden">
          <Header />
        </div>

        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-4xl font-black mb-2">Мои отчёты</h1>
          <p className="text-muted-foreground">
            История ваших расшифровок
          </p>
        </div>

        <Card className="p-4 mb-6 border-2 border-accent/30 bg-accent/5 flex items-start gap-3">
          <Clock className="w-5 h-5 text-accent mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Отчёты хранятся {REPORTS_RETENTION_DAYS} дней. После этого срока они автоматически удаляются — сохраните важные результаты заранее.
          </p>
        </Card>

        {!user && (
          <Card className="p-4 mb-6 border-2 border-primary/30 bg-primary/5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground font-semibold mb-1">
                Войдите, чтобы не потерять отчёты
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Без входа отчёты привязаны только к этому браузеру и устройству.
              </p>
              <Button size="sm" onClick={() => navigate('/login')}>
                Войти или зарегистрироваться
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
        ) : reports.length === 0 ? (
          <Card className="p-8 text-center border-2 border-dashed">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-bold mb-2">Пока нет отчётов</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Загрузите анализ — расшифровка появится здесь
            </p>
            <Button onClick={() => navigate('/analyze')} className="bg-gradient-to-r from-primary to-accent">
              <Sparkles className="w-4 h-4 mr-2" />
              Расшифровать
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => {
              const date = new Date(r.created_at).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              });
              const studyLabel = STUDY_LABELS[r.study_type || ''] || 'Расшифровка';
              const langLabel = r.language_detected ? LANG_LABELS[r.language_detected] : null;
              return (
                <Card
                  key={r.id}
                  onClick={() => openReport(r)}
                  className="p-4 lg:p-5 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all border-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold">{studyLabel}</h3>
                        {langLabel && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {langLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {date}
                        {r.age && r.gender ? ` · ${r.age} лет · ${r.gender === 'male' ? 'муж.' : 'жен.'}` : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
