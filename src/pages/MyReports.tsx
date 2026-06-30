import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation } from '@/components/BottomNavigation';
import { DesktopNav } from '@/components/DesktopNav';
import { Header } from '@/components/Header';
import { AdPlaceholder } from '@/components/AdPlaceholder';
import { ReferralCard } from '@/components/ReferralCard';
import { ReferralGiftBanner } from '@/components/ReferralGiftBanner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Sparkles, AlertCircle, Calendar, User, CreditCard, Hash, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Timer } from 'lucide-react';
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
  tariff_code: string | null;
  tariff_title: string | null;
  order_number: number | null;
}

const STUDY_LABELS: Record<string, string> = {
  lab: 'Лабораторные анализы',
  ultrasound: 'УЗИ',
  mri: 'МРТ',
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pt-16 lg:pt-0 pb-6 lg:pb-12">
      <DesktopNav />

      <div className="relative max-w-[480px] lg:max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <div className="lg:hidden">
          <Header />
        </div>

        <div className="stack-section">
          <h1 className="h-page">Мои отчёты</h1>
          <p className="t-lead">История ваших расшифровок</p>
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
            <Button onClick={() => navigate('/analyze')} variant="hero">
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
              const studyLabel = STUDY_LABELS[r.study_type || ''] || r.title || 'Расшифровка';
              const genderLabel = r.gender === 'male' ? 'муж.' : r.gender === 'female' ? 'жен.' : null;
              const status: string | undefined = r.result_json?.overall_status;
              const statusMeta = status === 'critical'
                ? { label: 'Критично', cls: 'bg-destructive/10 text-destructive border-destructive/30', Icon: XCircle }
                : status === 'warning'
                ? { label: 'Внимание', cls: 'bg-warning/10 text-warning border-warning/40', Icon: AlertTriangle }
                : status === 'normal'
                ? { label: 'Норма', cls: 'bg-success/10 text-success border-success/30', Icon: CheckCircle2 }
                : null;
              const daysLeft = Math.ceil((new Date(r.expires_at).getTime() - Date.now()) / 86400000);
              const expiringSoon = daysLeft >= 0 && daysLeft <= 7;
              const orderLabel = r.order_number ? `Заказ №${r.order_number}` : `Отчёт №${r.id.slice(0, 8).toUpperCase()}`;
              return (
                <Card
                  key={r.id}
                  className="p-4 lg:p-5 border-2 hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold leading-tight">{studyLabel}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {statusMeta && (
                          <Badge variant="outline" className={`gap-1 ${statusMeta.cls}`}>
                            <statusMeta.Icon className="w-3 h-3" />
                            {statusMeta.label}
                          </Badge>
                        )}
                        {expiringSoon && (
                          <Badge variant="outline" className="gap-1 bg-accent/10 text-accent border-accent/40">
                            <Timer className="w-3 h-3" />
                            {daysLeft === 0 ? 'Истекает сегодня' : `Истекает через ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary/60 shrink-0" />
                      <span>{date}</span>
                    </div>
                    {(r.age || genderLabel) && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary/60 shrink-0" />
                        <span>
                          {r.age ? `${r.age} лет` : ''}
                          {r.age && genderLabel ? ' · ' : ''}
                          {genderLabel ?? ''}
                        </span>
                      </div>
                    )}
                    {(r.tariff_title || r.tariff_code) && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary/60 shrink-0" />
                        <span className="truncate">{r.tariff_title || r.tariff_code}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary/60 shrink-0" />
                      <span>{orderLabel}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => openReport(r)}
                    variant="hero"
                    className="w-full gap-2"
                  >
                    Открыть отчёт
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                </Card>
              );
            })}
          </div>
        )}

        <AdPlaceholder page="my-reports" />
      </div>

      <BottomNavigation />
    </div>
  );
}
