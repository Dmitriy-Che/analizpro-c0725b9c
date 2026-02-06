import { AnalysisIndicator, getStatusColor } from '@/types/analysis';

interface ValueBarProps {
  indicator: AnalysisIndicator;
}

export function ValueBar({ indicator }: ValueBarProps) {
  const { value, reference_min, reference_max, unit, status } = indicator;
  const colors = getStatusColor(status);
  
  // If no numeric references, show simple status bar
  if (reference_min === undefined || reference_max === undefined || typeof value !== 'number') {
    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Референс: {indicator.reference_text || 'Индивидуально'}</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full w-1/3 ${status === 'normal' ? 'bg-green-500' : status.includes('critical') ? 'bg-red-500' : 'bg-yellow-500'}`}
            style={{ marginLeft: status === 'low' || status === 'critical_low' ? '0' : status === 'normal' ? '33%' : '66%' }}
          />
        </div>
      </div>
    );
  }

  // Calculate position on scale
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  const rangeSize = reference_max - reference_min;
  const padding = rangeSize * 0.3; // 30% padding on each side
  const scaleMin = reference_min - padding;
  const scaleMax = reference_max + padding;
  const scaleRange = scaleMax - scaleMin;
  
  // Calculate percentages
  const normalStartPct = ((reference_min - scaleMin) / scaleRange) * 100;
  const normalWidthPct = ((reference_max - reference_min) / scaleRange) * 100;
  const valuePositionPct = Math.min(Math.max(((numValue - scaleMin) / scaleRange) * 100, 2), 98);

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{scaleMin.toFixed(1)}</span>
        <span className="font-medium text-foreground">
          {numValue.toFixed(1)} {unit}
        </span>
        <span>{scaleMax.toFixed(1)}</span>
      </div>
      
      <div className="relative h-4 bg-gradient-to-r from-red-200 via-yellow-200 to-red-200 rounded-full overflow-hidden">
        {/* Normal range zone */}
        <div 
          className="absolute top-0 h-full bg-green-300/80"
          style={{ 
            left: `${normalStartPct}%`, 
            width: `${normalWidthPct}%` 
          }}
        />
        
        {/* Value marker */}
        <div 
          className="absolute top-0 h-full w-1 bg-foreground rounded-full shadow-lg transition-all"
          style={{ left: `calc(${valuePositionPct}% - 2px)` }}
        />
      </div>
      
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span className="text-red-600">Низкий</span>
        <span className="text-green-600 font-medium">Норма: {reference_min}-{reference_max}</span>
        <span className="text-red-600">Высокий</span>
      </div>
    </div>
  );
}
