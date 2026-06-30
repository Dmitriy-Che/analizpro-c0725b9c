import { Link } from 'react-router-dom';
import logo from '@/assets/logo-optimized.webp';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Sparkles } from 'lucide-react';

export function Header() {
  const { remaining, loading } = useEntitlements();

  return (
    <div className="mb-6 lg:mb-8">
      <Link to="/" className="text-center block">
        <img
          src={logo}
          alt="АнализПро"
          width={96}
          height={96}
          className="w-20 h-20 lg:w-24 lg:h-24 mx-auto shadow-lg mb-3 animate-fade-in object-contain rounded-full"
          fetchPriority="high"
        />
        <div className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          АнализПро<span className="text-sm align-super">©</span>
        </div>
      </Link>
      {!loading && (
        <div className="flex justify-center mt-3">
          <Link
            to="/tariffs"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition ${
              remaining > 0
                ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15'
                : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            {remaining > 0
              ? `Осталось расшифровок: ${remaining}`
              : 'Нет доступных расшифровок'}
          </Link>
        </div>
      )}
    </div>
  );
}
