import { useEffect, useRef } from 'react';
import { useTelegramAuth } from '@/contexts/TelegramAuthContext';
import { toast } from 'sonner';

interface TelegramLoginWidgetProps {
  botName: string;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: Record<string, string>) => void;
    };
  }
}

export function TelegramLoginWidget({ botName }: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { login, isLoading } = useTelegramAuth();

  useEffect(() => {
    // Define callback for Telegram widget
    (window as any).onTelegramAuth = async (user: Record<string, string>) => {
      try {
        await login(user);
        toast.success('Вы успешно авторизовались!');
      } catch (error) {
        toast.error('Ошибка авторизации');
        console.error('Auth error:', error);
      }
    };

    // Create script element
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.setAttribute('data-telegram-login', botName);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      containerRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [botName, login]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
}
