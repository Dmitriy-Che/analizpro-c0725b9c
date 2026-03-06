import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Crown, AlertTriangle, CheckCircle } from 'lucide-react';

interface SubscriptionData {
  plan_type: string;
  analyses_limit: number;
  analyses_used: number;
  price: number;
  is_active: boolean;
  activated_at: string;
  requested_plan?: string | null;
}

interface PartnerSubscriptionCardProps {
  subscription: SubscriptionData | null;
  loading?: boolean;
}

const PLAN_NAMES: Record<string, string> = {
  trial: 'Пробный период',
  standard: 'Стандарт',
  business: 'Бизнес',
  premium: 'Премиум',
};

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  trial: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  standard: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  business: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  premium: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
};

export function PartnerSubscriptionCard({ subscription, loading }: PartnerSubscriptionCardProps) {
  if (loading) {
    return (
      <Card className="p-6 border-2 border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="h-4 bg-muted rounded w-full mb-2" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="p-6 border-2 border-yellow-200 bg-yellow-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-bold text-yellow-800">Нет активной подписки</h3>
            <p className="text-sm text-yellow-600">
              Обратитесь к администратору для активации тарифа
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const usagePercent = Math.min((subscription.analyses_used / subscription.analyses_limit) * 100, 100);
  const isExhausted = usagePercent >= 100;
  const isWarning = usagePercent >= 80;
  const remaining = Math.max(subscription.analyses_limit - subscription.analyses_used, 0);

  const colors = PLAN_COLORS[subscription.plan_type] || PLAN_COLORS.standard;

  return (
    <Card className={`p-6 border-2 ${
      isExhausted 
        ? 'border-red-200 bg-red-50/50' 
        : isWarning 
        ? 'border-yellow-200 bg-yellow-50/50'
        : `${colors.border} bg-card`
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Crown className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Ваш тариф</h3>
            <span className={`text-sm font-medium ${colors.text}`}>
              {PLAN_NAMES[subscription.plan_type] || subscription.plan_type}
            </span>
          </div>
        </div>
        
        {isExhausted ? (
          <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Лимит исчерпан</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Активен</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Использовано расшифровок</span>
            <span className={`font-medium ${isExhausted ? 'text-destructive' : ''}`}>
              {subscription.analyses_used.toLocaleString()} / {subscription.analyses_limit.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={usagePercent} 
            className={`h-3 ${
              isExhausted 
                ? '[&>div]:bg-destructive' 
                : isWarning 
                ? '[&>div]:bg-yellow-500' 
                : '[&>div]:bg-primary'
            }`}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Осталось</span>
          <span className={`font-bold ${isExhausted ? 'text-destructive' : 'text-green-600'}`}>
            {remaining.toLocaleString()} расшифровок
          </span>
        </div>

        {isWarning && !isExhausted && (
          <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Осталось менее 20% от лимита
              </span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Рекомендуем обратиться к администратору для продления
            </p>
          </div>
        )}

        {isExhausted && (
          <div className="p-3 bg-red-100 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Лимит расшифровок исчерпан
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Новые расшифровки недоступны. Обратитесь к администратору для продления подписки.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
