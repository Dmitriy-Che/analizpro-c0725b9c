import { Home, FileText, FolderClock, CreditCard, Building2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePlatformMode } from '@/hooks/usePlatformMode';

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { b2cEnabled, b2bEnabled } = usePlatformMode();

  const b2cItems = [
    { to: '/analyze', label: 'Анализ', icon: FileText, match: (p: string) => p.startsWith('/analyze') },
    { to: '/my-reports', label: 'Отчёты', icon: FolderClock, match: (p: string) => p.startsWith('/my-reports') },
    { to: '/tariffs', label: 'Тарифы', icon: CreditCard, match: (p: string) => p.startsWith('/tariffs') || p.startsWith('/pay') },
  ];

  const b2bItems = [
    { to: '/partner/dashboard', label: 'Клиника', icon: Building2, match: (p: string) => p.startsWith('/partner') },
  ];

  const items = [
    { to: '/', label: 'Главная', icon: Home, match: (p: string) => p === '/' },
    ...(b2cEnabled ? b2cItems : []),
    ...(!b2cEnabled && b2bEnabled ? b2bItems : []),
  ];

  return (
    <nav className="lg:hidden fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-b border-border shadow-md z-50">
      <div className="max-w-[480px] mx-auto flex justify-around items-center h-14 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(location.pathname);
          return (
            <Button
              key={item.to}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.to)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
