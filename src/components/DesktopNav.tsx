import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Share2, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import logo from '@/assets/logo-optimized.webp';

export function DesktopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [shareOpen, setShareOpen] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareText = 'АнализПро — бесплатная расшифровка медицинских анализов с помощью ИИ! 🏥';

  const items = [
    { to: '/', label: 'Главная', icon: Home, match: (p: string) => p === '/' },
    { to: '/analyze', label: 'Расшифровка', icon: FileText, match: (p: string) => p.startsWith('/analyze') },
    { to: '/partner/login', label: 'Партнёрам', icon: Briefcase, match: (p: string) => p.startsWith('/partner') },
  ];

  return (
    <>
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
            <button
              onClick={() => setShareOpen(true)}
              className="px-4 h-10 rounded-xl flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Поделиться
            </button>
          </nav>

          <Button
            onClick={() => navigate('/analyze')}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
          >
            Начать расшифровку
          </Button>
        </div>
      </header>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Поделиться</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3 border-2"
              onClick={() => {
                window.open(
                  `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
                  '_blank',
                );
                setShareOpen(false);
              }}
            >
              Telegram
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3 border-2"
              onClick={() => {
                window.open(
                  `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
                  '_blank',
                );
                setShareOpen(false);
              }}
            >
              ВКонтакте
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3 border-2"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast.success('Ссылка скопирована');
                setShareOpen(false);
              }}
            >
              Скопировать ссылку
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
