import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, FolderClock, CreditCard, LogIn, LogOut, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo-optimized.webp';

export function DesktopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCurrentUser();

  const items = [
    { to: '/', label: 'Главная', icon: Home, match: (p: string) => p === '/' },
    { to: '/analyze', label: 'Расшифровка', icon: FileText, match: (p: string) => p.startsWith('/analyze') },
    { to: '/my-reports', label: 'Мои отчёты', icon: FolderClock, match: (p: string) => p.startsWith('/my-reports') },
    { to: '/tariffs', label: 'Тарифы', icon: CreditCard, match: (p: string) => p.startsWith('/tariffs') || p.startsWith('/pay') },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Вы вышли');
    navigate('/');
  };

  return (
    <header className="hidden lg:block sticky top-0 z-40 bg-card/85 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between gap-8">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="АнализПро"
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-contain shadow-sm"
          />
          <span className="text-lg font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            АнализПро<span className="text-[10px] align-super">©</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {items.map((item) => {
            const active = item.match(location.pathname);
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`px-4 h-10 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              Войти
            </Button>
          )}
          <Button
            onClick={() => navigate('/analyze')}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
          >
            Расшифровать
          </Button>
        </div>
      </div>
    </header>
  );
}
