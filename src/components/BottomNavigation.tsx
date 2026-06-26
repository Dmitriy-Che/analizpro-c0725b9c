import { Home, FileText, FolderClock, CreditCard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { to: '/', label: 'Главная', icon: Home, match: (p: string) => p === '/' },
    { to: '/analyze', label: 'Анализ', icon: FileText, match: (p: string) => p.startsWith('/analyze') },
    { to: '/my-reports', label: 'Отчёты', icon: FolderClock, match: (p: string) => p.startsWith('/my-reports') },
    { to: '/tariffs', label: 'Тарифы', icon: CreditCard, match: (p: string) => p.startsWith('/tariffs') || p.startsWith('/pay') },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg z-50">
      <div className="max-w-[480px] mx-auto flex justify-around items-center h-16 px-2">
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
