import { useTelegramAutoAuth } from '@/hooks/useTelegramAutoAuth';

export function TelegramAutoAuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useTelegramAutoAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 gap-4 px-6">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground text-center">Вход через Telegram…</p>
      </div>
    );
  }

  return <>{children}</>;
}
