import { Link } from 'react-router-dom';
import { Sparkles, Gift } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { cn } from '@/lib/utils';

interface Props {
  variant?: 'compact' | 'full';
  className?: string;
}

/**
 * Универсальный информер остатка расшифровок.
 * compact — маленький бейдж-ссылка (для шапки/главной).
 * full    — карточка-плашка в стиле тарифных карточек (для страницы тарифов).
 */
export function EntitlementsBadge({ variant = 'compact', className }: Props) {
  const { remaining, total, loading } = useEntitlements();

  if (loading) return null;

  const used = Math.max(0, total - remaining);
  const has = remaining > 0;

  if (variant === 'compact') {
    return (
      <Link
        to="/tariffs"
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition',
          has
            ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15'
            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
          className,
        )}
      >
        <Sparkles className="w-3 h-3" />
        {has ? `Осталось расшифровок: ${remaining}` : 'Нет доступных расшифровок'}
      </Link>
    );
  }

  // full — карточка в стиле тарифов
  return (
    <Link
      to="/analyze"
      className={cn(
        'block rounded-2xl border-2 p-4 lg:p-5 transition-all hover:shadow-md',
        has
          ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 hover:border-primary/50'
          : 'border-border/60 bg-muted/30 hover:border-border',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0',
            has ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {has ? <Sparkles className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-0.5">
            Ваш баланс
          </div>
          {has ? (
            <div className="text-sm lg:text-base font-bold leading-tight">
              У вас осталось{' '}
              <span className="text-primary">{remaining}</span>
              {total > 0 && (
                <span className="text-muted-foreground font-semibold"> из {total}</span>
              )}{' '}
              {remaining === 1 ? 'расшифровка' : remaining < 5 ? 'расшифровки' : 'расшифровок'}
            </div>
          ) : (
            <div className="text-sm lg:text-base font-bold leading-tight">
              У вас пока нет активных расшифровок
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
