import { Progress } from '@/components/ui/progress';
import { Crown, AlertTriangle } from 'lucide-react';

interface SubscriptionBadgeProps {
  planType: string;
  analysesUsed: number;
  analysesLimit: number;
  compact?: boolean;
}

const PLAN_NAMES: Record<string, string> = {
  trial: 'Пробный',
  standard: 'Стандарт',
  business: 'Бизнес',
  premium: 'Премиум',
};

export function SubscriptionBadge({ 
  planType, 
  analysesUsed, 
  analysesLimit,
  compact = false 
}: SubscriptionBadgeProps) {
  const usagePercent = Math.min((analysesUsed / analysesLimit) * 100, 100);
  const isExhausted = usagePercent >= 100;
  const isWarning = usagePercent >= 80;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          planType === 'premium' 
            ? 'bg-purple-100 text-purple-700' 
            : planType === 'business'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {PLAN_NAMES[planType] || planType}
        </span>
        <span className={`text-xs ${isExhausted ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
          {analysesUsed}/{analysesLimit}
        </span>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border-2 ${
      isExhausted 
        ? 'bg-red-50 border-red-200' 
        : isWarning 
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-primary/5 border-primary/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Crown className={`w-4 h-4 ${
            planType === 'premium' 
              ? 'text-purple-600' 
              : planType === 'business'
              ? 'text-blue-600'
              : 'text-gray-600'
          }`} />
          <span className="font-medium text-sm">
            {PLAN_NAMES[planType] || planType}
          </span>
        </div>
        {isExhausted && (
          <div className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs font-medium">Лимит исчерпан</span>
          </div>
        )}
      </div>
      
      <div className="mb-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Расшифровок</span>
          <span className={isExhausted ? 'text-destructive font-bold' : ''}>
            {analysesUsed.toLocaleString()} / {analysesLimit.toLocaleString()}
          </span>
        </div>
        <Progress 
          value={usagePercent} 
          className={`h-2 ${
            isExhausted 
              ? '[&>div]:bg-destructive' 
              : isWarning 
              ? '[&>div]:bg-yellow-500' 
              : ''
          }`}
        />
      </div>

      {isWarning && !isExhausted && (
        <p className="text-xs text-yellow-600 mt-1">
          ⚠️ Осталось менее 20% лимита
        </p>
      )}
    </div>
  );
}
