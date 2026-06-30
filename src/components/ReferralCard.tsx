import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useReferralStats, buildReferralLink } from '@/hooks/useReferral';

const MILESTONES = [1, 3, 5] as const;

function rewardLabel(m: number) {
  if (m === 1) return '+1 расшифровка';
  if (m === 3) return '+3 расшифровки';
  return 'Месячный тариф';
}

export function ReferralCard({ compact = false }: { compact?: boolean }) {
  const { stats, ensureCode, loading } = useReferralStats();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const qualified = stats?.qualified ?? 0;
  const next = stats?.next_milestone;

  const handleShare = async () => {
    setBusy(true);
    try {
      const code = stats?.code ?? (await ensureCode());
      if (!code) {
        toast.error('Не удалось получить реферальный код');
        return;
      }
      const link = buildReferralLink(code);
      const text = `Я разбираю свои анализы с помощью АнализПро — расшифровывает анализы простым языком. Дарю тебе 1 бесплатную расшифровку: ${link}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: 'АнализПро', text, url: link });
          return;
        } catch (e: any) {
          if (e?.name === 'AbortError') return;
        }
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Ссылка скопирована — отправьте её другу');
      setTimeout(() => setCopied(false), 2500);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    const code = stats?.code ?? (await ensureCode());
    if (!code) return;
    await navigator.clipboard.writeText(buildReferralLink(code));
    setCopied(true);
    toast.success('Ссылка скопирована');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="p-5 border-2 border-accent/30 bg-gradient-to-br from-accent/10 via-card to-primary/10 rounded-2xl">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base leading-tight">
            Пригласите друга — получите бесплатную расшифровку
          </h3>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-1">
              Друг получит 1 расшифровку в подарок. Вам — бонус, когда друг ею воспользуется.
            </p>
          )}
        </div>
      </div>

      {/* Прогресс по этапам */}
      <div className="flex items-center justify-between gap-1 mb-3">
        {MILESTONES.map((m, i) => {
          const reached = qualified >= m;
          const isNext = next === m;
          return (
            <div key={m} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  reached
                    ? 'bg-success text-white border-success'
                    : isNext
                    ? 'bg-accent/20 text-accent border-accent animate-pulse'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {reached ? <Check className="w-4 h-4" /> : m}
              </div>
              <span className={`text-[10px] text-center leading-tight ${isNext ? 'text-accent font-bold' : 'text-muted-foreground'}`}>
                {rewardLabel(m)}
              </span>
              {i < MILESTONES.length - 1 && (
                <div className={`hidden ${reached ? 'bg-success' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-center text-muted-foreground mb-3">
        {loading
          ? 'Загрузка...'
          : qualified === 0
          ? 'Пригласите 1 друга → получите 1 бесплатную расшифровку'
          : next
          ? `Пригласили: ${qualified}. До следующего бонуса: ${next - qualified}`
          : `🎉 Все 3 этапа пройдены! Пригласили: ${qualified}`}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleShare} disabled={busy} variant="cta" size="lg" className="flex-1 gap-2">
          <Share2 className="w-4 h-4" />
          Поделиться
        </Button>
        <Button onClick={handleCopy} disabled={busy} variant="brand-outline" size="lg" className="px-3">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      {stats?.code && !compact && (
        <div className="mt-3 text-center text-[11px] text-muted-foreground">
          Ваш код: <span className="font-mono font-bold text-foreground">{stats.code}</span>
        </div>
      )}
    </Card>
  );
}
