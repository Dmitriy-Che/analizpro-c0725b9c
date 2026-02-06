import { Card } from '@/components/ui/card';
import { StructuredAnalysisResult, getOverallStatusColor } from '@/types/analysis';
import { StatusChart } from './StatusChart';
import { IndicatorCard } from './IndicatorCard';
import { 
  CheckCircle2, 
  Calendar,
  FileText,
  Sparkles
} from 'lucide-react';
import logo from '@/assets/new-logo.png';

interface AnalysisReportProps {
  result: StructuredAnalysisResult;
  age: string;
  gender: string;
  clinicName?: string;
  clinicLogo?: string | null;
}

export function AnalysisReport({ 
  result, 
  age, 
  gender, 
  clinicName,
  clinicLogo 
}: AnalysisReportProps) {
  const statusColors = getOverallStatusColor(result.overall_status);
  const abnormalIndicators = result.indicators.filter(i => i.status !== 'normal');
  const hasAbnormal = abnormalIndicators.length > 0;

  return (
    <div id="analysis-report" className="space-y-4">
      {/* Header Card */}
      <Card className={`border-2 ${statusColors.border} rounded-2xl shadow-xl overflow-hidden`}>
        <div className={`${statusColors.header} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={clinicLogo || logo} 
                alt="Logo" 
                className="w-10 h-10 rounded-full bg-white/20 object-contain"
              />
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Результаты анализа
                </h3>
                {clinicName && (
                  <p className="text-white/80 text-xs">{clinicName}</p>
                )}
              </div>
            </div>
            <div className="text-right text-white/80 text-xs">
              <div className="flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString('ru-RU')}
              </div>
              <div className="mt-1">
                {gender === 'male' ? '👨' : '👩'} {age} лет
              </div>
            </div>
          </div>
        </div>
        
        <div className={`p-5 ${statusColors.body}`}>
          {/* Summary */}
          <div className="text-center mb-4">
            <p className="text-sm text-foreground font-medium">{result.summary}</p>
          </div>
          
          {/* Status Chart */}
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
            <Sparkles className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-foreground">
              Показатели, требующие внимания
            </h4>
          </div>
          
          {abnormalIndicators.map((indicator, index) => (
            <IndicatorCard 
              key={index} 
              indicator={indicator} 
              index={index}
            />
          ))}
        </div>
      )}

      {/* All Normal Message */}
      {!hasAbnormal && (
        <Card className="p-6 border-2 border-green-200 bg-green-50 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
          <h4 className="font-bold text-lg text-green-700 mb-2">
            Отличные результаты!
          </h4>
          <p className="text-sm text-green-600">
            Все показатели находятся в пределах нормы для вашего возраста и пола.
          </p>
        </Card>
      )}

      {/* General Recommendations */}
      {result.general_recommendations && (
        <Card className="p-4 border-2 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Общие рекомендации</h4>
              <p className="text-sm text-muted-foreground">
                {result.general_recommendations}
              </p>
              {result.follow_up && (
                <p className="text-sm text-primary font-medium mt-2">
                  📅 Контроль: {result.follow_up}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
