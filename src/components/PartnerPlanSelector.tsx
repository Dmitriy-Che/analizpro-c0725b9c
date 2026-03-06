import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, Loader2, Clock, Package } from 'lucide-react';

interface PartnerPlanSelectorProps {
  partnerId: string;
  currentPlan: string;
  requestedPlan: string | null;
  onPlanRequested: () => void;
}

const PLANS = [
  { 
    type: 'standard', 
    name: 'Стандарт', 
    limit: 500, 
    price: 30000,
    features: ['500 расшифровок', 'Статистика', 'QR-код для клиники']
  },
  { 
    type: 'business', 
    name: 'Бизнес', 
    limit: 1500, 
    price: 52000,
    features: ['1 500 расшифровок', 'Расширенная статистика', 'QR-код для клиники', 'Приоритетная поддержка']
  },
  { 
    type: 'premium', 
    name: 'Премиум', 
    limit: 3000, 
    price: 75000,
    features: ['3 000 расшифровок', 'Полная статистика', 'QR-код для клиники', 'Приоритетная поддержка', 'Персональный менеджер']
  },
];

const PLAN_STYLES: Record<string, { border: string; bg: string; badge: string }> = {
  standard: { border: 'border-muted-foreground/30', bg: 'bg-muted/30', badge: 'bg-muted text-muted-foreground' },
  business: { border: 'border-blue-300', bg: 'bg-blue-50/50', badge: 'bg-blue-100 text-blue-700' },
  premium: { border: 'border-purple-300', bg: 'bg-purple-50/50', badge: 'bg-purple-100 text-purple-700' },
};

export function PartnerPlanSelector({ 
  partnerId, 
  currentPlan, 
  requestedPlan, 
  onPlanRequested 
}: PartnerPlanSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleRequestPlan = async (planType: string) => {
    if (planType === currentPlan) return;
    
    setLoading(planType);
    try {
      const { error } = await supabase
        .from('partner_subscriptions')
        .update({ requested_plan: planType })
        .eq('partner_id', partnerId);

      if (error) throw error;

      toast.success('Заявка на тариф отправлена! Ожидайте активации администратором.');
      onPlanRequested();
    } catch (err) {
      console.error('Error requesting plan:', err);
      toast.error('Ошибка отправки заявки');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Выберите тариф</h3>
        <p className="text-sm text-muted-foreground">
          После выбора тарифа заявка будет отправлена администратору для активации после оплаты.
        </p>
      </div>

      {requestedPlan && (
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-medium text-blue-800">Заявка отправлена</p>
            <p className="text-sm text-blue-600">
              Вы подали заявку на тариф «{PLANS.find(p => p.type === requestedPlan)?.name || requestedPlan}». 
              Ожидайте активации администратором.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const styles = PLAN_STYLES[plan.type];
          const isCurrent = currentPlan === plan.type;
          const isRequested = requestedPlan === plan.type;

          return (
            <Card 
              key={plan.type} 
              className={`p-6 border-2 ${styles.border} ${styles.bg} relative transition-all ${
                isRequested ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              {plan.type === 'business' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium">
                  Популярный
                </div>
              )}

              <div className="text-center mb-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>
                  {plan.name}
                </span>
                <p className="text-3xl font-black mt-3">
                  {plan.price.toLocaleString()} ₽
                </p>
                <p className="text-xs text-muted-foreground">за пакет</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button disabled className="w-full" variant="outline">
                  Текущий тариф
                </Button>
              ) : isRequested ? (
                <Button disabled className="w-full" variant="secondary">
                  <Clock className="w-4 h-4 mr-2" />
                  Заявка отправлена
                </Button>
              ) : (
                <Button 
                  onClick={() => handleRequestPlan(plan.type)}
                  disabled={loading !== null}
                  className="w-full"
                  variant={plan.type === 'business' ? 'default' : 'outline'}
                >
                  {loading === plan.type ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Package className="w-4 h-4 mr-2" />
                  )}
                  Выбрать
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
