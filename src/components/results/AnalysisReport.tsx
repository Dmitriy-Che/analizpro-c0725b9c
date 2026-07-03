import { Card } from '@/components/ui/card';
import { StructuredAnalysisResult, getOverallStatusColor } from '@/types/analysis';
import { StatusChart } from './StatusChart';
import { IndicatorCard } from './IndicatorCard';
import {
  CheckCircle2,
  FileText,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import logo from '@/assets/new-logo.png';

interface AnalysisReportProps {
  result: StructuredAnalysisResult;
  age: string;
  gender: string;
  studyType?: string;
  orderNumber?: string;
  clinicName?: string;
  clinicLogo?: string | null;
}

const STUDY_TYPE_LABELS: Record<string, string> = {
  lab: 'Анализы (МОАК/биохимия)',
  ultrasound: 'УЗИ',
  mri: 'МРТ',
};

export function AnalysisReport({
  result,
  age,
  gender,
  studyType,
  orderNumber,
  clinicName,
  clinicLogo,
}: AnalysisReportProps) {
  const statusColors = getOverallStatusColor(result.overall_status);
  const abnormalIndicators = result.indicators.filter(i => i.status !== 'normal');
  const hasAbnormal = abnormalIndicators.length > 0;

  const dateStr = new Date().toLocaleDateString('ru-RU');
  const studyLabel = studyType ? STUDY_TYPE_LABELS[studyType] ?? studyType : null;
  const order = orderNumber || `№ ${Date.now().toString().slice(-6)}`;

  return (
    <div id="analysis-report" className="space-y-4">
      {/* Brand Header */}
      <Card className="rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-primary/5 via-background to-accent/5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <img
                src={clinicLogo || logo}
                alt="АнализПро"
                className="w-11 h-11 lg:w-12 lg:h-12 rounded-full object-contain bg-white border border-border/40"
              />
              <div className="leading-tight">
                <div className="text-lg lg:text-xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  АнализПро<span className="text-[0.6em] align-super">©</span>
                </div>
                {clinicName && (
                  <div className="text-xs text-muted-foreground">{clinicName}</div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch bg-border/60" />

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground leading-snug">
                Расшифровка результата анализов
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                <span>Заказ {order}</span>
                <span>·</span>
                <span>{dateStr}</span>
                <span>·</span>
                <span>{gender === 'male' ? '👨' : '👩'} {age} лет</span>
                {studyLabel && (
                  <>
                    <span>·</span>
                    <span>{studyLabel}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Card */}
      <Card className={`border-2 ${statusColors.border} rounded-2xl shadow-xl overflow-hidden`}>
        <div className={`${statusColors.header} p-4 sm:p-5 lg:p-6`}>
          <h3 className="text-white font-bold text-lg sm:text-xl lg:text-2xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6" />
            Результаты анализа
          </h3>
        </div>

        <div className={`p-5 lg:p-6 ${statusColors.body}`}>
          <div className="text-center mb-4">
            <p className="text-base sm:text-lg lg:text-xl text-foreground font-medium leading-relaxed">
              {result.summary}
            </p>
          </div>

          <div className="flex justify-center py-4">
            <StatusChart
              normalCount={result.normal_count}
              abnormalCount={result.abnormal_count}
              overallStatus={result.overall_status}
            />
          </div>
        </div>
      </Card>

      {/* Indicators with Deviations */}
      {hasAbnormal && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
            <h4 className="font-bold text-foreground text-base sm:text-lg lg:text-xl">
              Показатели, требующие внимания
            </h4>
          </div>

          {abnormalIndicators.map((indicator, index) => (
            <IndicatorCard key={index} indicator={indicator} index={index} />
          ))}
        </div>
      )}

      {/* All Normal Message */}
      {!hasAbnormal && (
        <Card className="p-6 lg:p-8 border-2 border-green-200 bg-green-50 text-center">
          <CheckCircle2 className="w-12 h-12 lg:w-16 lg:h-16 mx-auto text-green-500 mb-3" />
          <h4 className="font-bold text-lg sm:text-xl lg:text-2xl text-green-700 mb-2">
            Отличные результаты!
          </h4>
          <p className="text-sm sm:text-base lg:text-lg text-green-600 leading-relaxed">
            Все показатели находятся в пределах нормы для вашего возраста и пола.
          </p>
        </Card>
      )}

      {/* General Recommendations */}
      {result.general_recommendations && (
        <Card className="p-4 sm:p-5 lg:p-6 border-2 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-foreground text-base sm:text-lg lg:text-xl mb-1">
                Общие рекомендации
              </h4>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                {result.general_recommendations}
              </p>
              {result.follow_up && (
                <p className="text-sm sm:text-base lg:text-lg text-primary font-medium mt-2">
                  📅 Контроль: {result.follow_up}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="border-2 border-warning/30 bg-warning/5 p-4 sm:p-5 rounded-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
            Не является медицинской консультацией. Для точной диагностики и лечения обратитесь к квалифицированному специалисту.
          </p>
        </div>
      </Card>
    </div>
  );
}
