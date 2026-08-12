import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { usePlatformMode } from '@/hooks/usePlatformMode';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface ModeGuardProps {
  requires: 'b2c' | 'b2b';
  children: ReactNode;
}

/**
 * Ограничивает доступ к разделу в зависимости от режима работы платформы.
 * Администратор имеет доступ ко всем разделам в любом режиме.
 * Существующая функциональность не удаляется — только скрывается в неподходящем режиме.
 */
export function ModeGuard({ requires, children }: ModeGuardProps) {
  const navigate = useNavigate();
  const { b2cEnabled, b2bEnabled, isLoading } = usePlatformMode();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  if (isLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const allowed = requires === 'b2c' ? b2cEnabled : b2bEnabled;

  if (allowed || isAdmin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center border-2 border-border/60 bg-card/90">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold mb-2">Раздел недоступен в текущем режиме</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {requires === 'b2c'
            ? 'Сейчас платформа работает только с клиниками и партнёрами.'
            : 'Сейчас платформа работает только с пользовательскими расшифровками.'}
        </p>
        <Button onClick={() => navigate('/')} variant="hero" className="w-full">
          На главную
        </Button>
      </Card>
    </div>
  );
}
