import { Card } from '@/components/ui/card';
import { AnalysisIndicator, getStatusColor } from '@/types/analysis';
import { ValueBar } from './ValueBar';
import { 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  Stethoscope,
  Lightbulb
} from 'lucide-react';

interface IndicatorCardProps {
  indicator: AnalysisIndicator;
  index: number;
}

export function IndicatorCard({ indicator, index }: IndicatorCardProps) {
  const colors = getStatusColor(indicator.status);
  
  const StatusIcon = indicator.status === 'normal' 
    ? CheckCircle2
    : indicator.status === 'low' || indicator.status === 'critical_low'
    ? TrendingDown
    : TrendingUp;

  const statusLabel = indicator.status === 'normal' 
    ? 'В норме'
    : indicator.status === 'low'
    ? 'Понижен'
    : indicator.status === 'high'
    ? 'Повышен'
    : indicator.status === 'critical_low'
    ? 'Критически низкий'
    : 'Критически высокий';

  return (
    <Card 
      className={`p-4 border-2 ${colors.border} ${colors.bg} animate-fade-in`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-bold text-foreground text-base leading-tight">
            {indicator.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">
              {indicator.value}
            </span>
            <span className="text-sm text-muted-foreground">{indicator.unit}</span>
          </div>
        </div>
        
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
          <StatusIcon className={`w-4 h-4 ${colors.text}`} />
          <span className={`text-xs font-medium ${colors.text}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Value Bar */}
      <ValueBar indicator={indicator} />

      {/* Explanation */}
      <div className="mt-4 p-3 bg-white/60 rounded-lg border border-border/30">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Что это значит:</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {indicator.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-3 p-3 bg-white/60 rounded-lg border border-border/30">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Рекомендация:</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {indicator.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Specialist */}
      {indicator.specialist && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <Stethoscope className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">К кому обратиться:</span>
          <span className="font-medium text-primary">{indicator.specialist}</span>
        </div>
      )}
    </Card>
  );
}
