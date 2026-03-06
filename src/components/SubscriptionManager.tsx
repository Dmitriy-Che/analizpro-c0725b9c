import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Crown, 
  Loader2, 
  Save, 
  Package,
  AlertTriangle
} from 'lucide-react';

interface Subscription {
  plan_type: string;
  analyses_limit: number;
  analyses_used: number;
  price: number;
  is_active: boolean;
  activated_at: string;
  requested_plan?: string | null;
}

interface SubscriptionManagerProps {
  partnerId: string;
  partnerName: string;
  subscription: Subscription | null;
  onUpdate: () => void;
}

const PLANS = [
  { type: 'standard', name: 'Стандарт', limit: 500, price: 30000 },
  { type: 'business', name: 'Бизнес', limit: 1500, price: 52000 },
  { type: 'premium', name: 'Премиум', limit: 3000, price: 75000 },
];

export function SubscriptionManager({ 
  partnerId, 
  partnerName, 
  subscription, 
  onUpdate 
}: SubscriptionManagerProps) {
  const [saving, setSaving] = useState(false);
  const [customLimit, setCustomLimit] = useState<number>(subscription?.analyses_limit || 500);

  const usagePercent = subscription 
    ? Math.min((subscription.analyses_used / subscription.analyses_limit) * 100, 100)
    : 0;

  const getPlanName = (type: string) => {
    return PLANS.find(p => p.type === type)?.name || type;
  };

  const handleActivatePlan = async (planType: string) => {
    setSaving(true);
    const plan = PLANS.find(p => p.type === planType)!;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (subscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('partner_subscriptions')
          .update({
            plan_type: planType,
            analyses_limit: plan.limit,
            price: plan.price,
            activated_at: new Date().toISOString(),
            activated_by: user?.id
          })
          .eq('partner_id', partnerId);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('partner_subscriptions')
          .insert({
            partner_id: partnerId,
            plan_type: planType,
            analyses_limit: plan.limit,
            analyses_used: 0,
            price: plan.price,
            activated_by: user?.id,
            is_active: true
          });

        if (error) throw error;
      }

      // Log to history
      await supabase.from('subscription_history').insert({
        partner_id: partnerId,
        plan_type: planType,
        analyses_limit: plan.limit,
        price: plan.price,
        action: subscription ? 'renewed' : 'activated',
        admin_id: user?.id
      });

      toast.success(`План "${plan.name}" активирован для ${partnerName}`);
      onUpdate();
    } catch (error) {
      console.error('Error activating plan:', error);
      toast.error('Ошибка активации плана');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLimit = async () => {
    if (!subscription) {
      toast.error('Сначала активируйте план');
      return;
    }

    if (customLimit < 0) {
      toast.error('Лимит не может быть отрицательным');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('partner_subscriptions')
        .update({ analyses_limit: customLimit })
        .eq('partner_id', partnerId);

      if (error) throw error;

      // Log to history
      await supabase.from('subscription_history').insert({
        partner_id: partnerId,
        plan_type: subscription.plan_type,
        analyses_limit: customLimit,
        price: subscription.price,
        action: 'limit_changed',
        admin_id: user?.id
      });

      toast.success(`Лимит изменён на ${customLimit.toLocaleString()}`);
      onUpdate();
    } catch (error) {
      console.error('Error updating limit:', error);
      toast.error('Ошибка изменения лимита');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 border-2 border-primary/20">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Crown className="w-5 h-5 text-primary" />
        Управление тарифом
      </h3>

      {/* Current subscription status */}
      {subscription ? (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Текущий план:</span>
            <span className="text-primary font-bold">
              {getPlanName(subscription.plan_type)}
            </span>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Использовано расшифровок</span>
              <span className={usagePercent >= 100 ? 'text-destructive font-bold' : ''}>
                {subscription.analyses_used.toLocaleString()} / {subscription.analyses_limit.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={usagePercent} 
              className={`h-3 ${usagePercent >= 100 ? '[&>div]:bg-destructive' : usagePercent >= 80 ? '[&>div]:bg-yellow-500' : ''}`}
            />
          </div>

          {usagePercent >= 100 && (
            <div className="flex items-center gap-2 text-destructive text-sm mt-2">
              <AlertTriangle className="w-4 h-4" />
              Лимит исчерпан!
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            Активирован: {new Date(subscription.activated_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Нет активной подписки</span>
          </div>
          <p className="text-sm text-yellow-600 mt-1">
            Активируйте тариф для начала работы
          </p>
        </div>
      )}

      {/* Plan selection buttons */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-3 block">Выбрать тариф:</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANS.map((plan) => (
            <Button
              key={plan.type}
              variant={subscription?.plan_type === plan.type ? 'default' : 'outline'}
              onClick={() => handleActivatePlan(plan.type)}
              disabled={saving}
              className="flex flex-col h-auto py-4"
            >
              <Package className="w-5 h-5 mb-1" />
              <span className="font-bold">{plan.name}</span>
              <span className="text-xs opacity-80">{plan.limit.toLocaleString()} расш.</span>
              <span className="text-xs opacity-80">{plan.price.toLocaleString()} ₽</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Manual limit adjustment */}
      <div className="border-t pt-4">
        <Label className="text-sm font-medium mb-3 block">
          Ручная установка лимита:
        </Label>
        <div className="flex gap-3">
          <Input
            type="number"
            value={customLimit}
            onChange={(e) => setCustomLimit(parseInt(e.target.value) || 0)}
            min={0}
            className="max-w-[200px]"
          />
          <Button 
            onClick={handleUpdateLimit} 
            disabled={saving || !subscription}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Сохранить
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Вы можете установить любое значение лимита вручную
        </p>
      </div>
    </Card>
  );
}
