import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, X } from 'lucide-react';
import { hasReferralGiftPending, markReferralGiftShown } from '@/hooks/useReferral';
import { useNavigate } from 'react-router-dom';

export function ReferralGiftBanner() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(hasReferralGiftPending());
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    markReferralGiftShown();
    setVisible(false);
  };

  return (
    <Card className="p-4 mb-4 border-2 border-success/40 bg-gradient-to-br from-success/10 via-card to-accent/10 rounded-2xl relative animate-fade-in">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-muted/50 transition"
        aria-label="Закрыть"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-success" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base leading-tight mb-1">
            🎁 У вас 1 бесплатная расшифровка в подарок!
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Подарок от друга, который вас пригласил. Загрузите анализ и получите расшифровку бесплатно.
          </p>
          <Button
            size="sm"
            variant="cta"
            onClick={() => {
              markReferralGiftShown();
              navigate('/analyze');
            }}
          >
            Использовать подарок
          </Button>
        </div>
      </div>
    </Card>
  );
}
