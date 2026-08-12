import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PlatformMode, usePlatformMode, useInvalidatePlatformMode } from '@/hooks/usePlatformMode';

const OPTIONS: { value: PlatformMode; title: string; description: string }[] = [
  {
    value: 'b2c',
    title: 'B2C',
    description: 'Платформа работает только с обычными пользователями и расшифровкой анализов.',
  },
  {
    value: 'b2b',
    title: 'B2B',
    description: 'Платформа работает только с клиниками/партнёрами.',
  },
  {
    value: 'both',
    title: 'B2C + B2B',
    description: 'Доступны оба направления.',
  },
];

export function PlatformModeAdmin() {
  const { mode, isLoading } = usePlatformMode();
  const invalidate = useInvalidatePlatformMode();
  const [selected, setSelected] = useState<PlatformMode>(mode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(mode);
  }, [mode]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({ key: 'platform_mode', value: selected, updated_at: new Date().toISOString() });
      if (error) throw error;
      await invalidate();
      toast.success('Режим работы платформы изменён');
    } catch (e) {
      console.error(e);
      toast.error('Не удалось сохранить режим работы платформы');
    } finally {
      setSaving(false);
    }
  };

  const currentTitle = OPTIONS.find((o) => o.value === mode)?.title ?? '—';

  return (
    <Card className="p-6 border-2 border-border/60 bg-card/80">
      <div className="flex items-center gap-3 mb-1">
        <Settings2 className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Режим работы платформы</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Определяет, какие разделы и пункты меню доступны посетителям сайта. Администратор всегда
        видит все разделы независимо от выбранного режима. Текущий режим:{' '}
        <span className="font-semibold text-foreground">{currentTitle}</span>
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <RadioGroup
            value={selected}
            onValueChange={(v) => setSelected(v as PlatformMode)}
            className="space-y-3"
          >
            {OPTIONS.map((opt) => (
              <label
                key={opt.value}
                htmlFor={`mode-${opt.value}`}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                  selected === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border/60 hover:bg-muted/40'
                }`}
              >
                <RadioGroupItem value={opt.value} id={`mode-${opt.value}`} className="mt-1" />
                <div>
                  <Label htmlFor={`mode-${opt.value}`} className="text-base font-semibold cursor-pointer">
                    {opt.title}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>

          <Button
            onClick={handleSave}
            disabled={saving || selected === mode}
            variant="hero"
            className="mt-5"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Сохранить режим
          </Button>
        </>
      )}
    </Card>
  );
}
