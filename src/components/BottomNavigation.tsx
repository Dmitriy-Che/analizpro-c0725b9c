import { Home, ArrowLeft, Share2, Briefcase } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const isHome = location.pathname === '/';
  const shareUrl = window.location.origin;
  const shareText = 'АнализПро — бесплатная расшифровка медицинских анализов с помощью ИИ! 🏥';

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
    setShareDialogOpen(false);
  };

  const handleVkShare = () => {
    const vkUrl = `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
    window.open(vkUrl, '_blank');
    setShareDialogOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Ссылка скопирована');
    setShareDialogOpen(false);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg z-50">
        <div className="max-w-[480px] mx-auto flex justify-around items-center h-16 px-4">
          {/* Home */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
              isHome ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Домой</span>
          </Button>

          {/* Back */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex flex-col items-center gap-1 h-auto py-2 px-4 text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-medium">Назад</span>
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShareDialogOpen(true)}
            className="flex flex-col items-center gap-1 h-auto py-2 px-4 text-muted-foreground"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-xs font-medium">Поделиться</span>
          </Button>
        </div>
      </nav>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Поделиться</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              variant="outline"
              className="w-full gap-3 h-12 justify-start border-2 hover:bg-[#0088cc]/10 hover:border-[#0088cc]"
              onClick={handleTelegramShare}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0088cc">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="font-medium">Telegram</span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full gap-3 h-12 justify-start border-2 hover:bg-[#0077FF]/10 hover:border-[#0077FF]"
              onClick={handleVkShare}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0077FF">
                <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.596 4 8.034c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.644v3.472c0 .373.17.508.271.508.22 0 .407-.135.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.644-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
              </svg>
              <span className="font-medium">ВКонтакте</span>
            </Button>

            <Button
              variant="outline"
              className="w-full gap-3 h-12 justify-start border-2"
              onClick={handleCopyLink}
            >
              <svg className="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="font-medium">Скопировать ссылку</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
