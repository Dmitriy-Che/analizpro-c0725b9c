import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShoppingCart, CheckCircle2, Settings, Upload } from 'lucide-react';

interface Order {
  id: string;
  user_id: string | null;
  device_id: string | null;
  tariff_code: string;
  price_usd: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  processed_at: string | null;
  user_email: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  paid: 'bg-yellow-100 text-yellow-800',
  processed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  new: 'Новый',
  paid: 'Оплачен',
  processed: 'Обработан',
  cancelled: 'Отменён',
};

export function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState('');
  const [qrPath, setQrPath] = useState('');
  const [qrPreview, setQrPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [support, setSupport] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const refresh = async () => {
    const { data } = await supabase.rpc('admin_list_orders');
    if (data) setOrders(data as Order[]);
  };

  const loadSettings = async () => {
    const { data } = await supabase.from('payment_settings').select('*');
    if (data) {
      const m = Object.fromEntries(data.map((d) => [d.key, d.value ?? '']));
      setQrUrl(m.qr_image_url || '');
      setQrPath(m.qr_image_path || '');
      setInstructions(m.payment_instructions || '');
      setSupport(m.support_contact || '');
      if (m.qr_image_path) {
        const { data: signed } = await supabase.storage
          .from('payment-qr')
          .createSignedUrl(m.qr_image_path, 60 * 60);
        setQrPreview(signed?.signedUrl || '');
      } else if (m.qr_image_url) {
        setQrPreview(m.qr_image_url);
      }
    }
  };


  useEffect(() => {
    Promise.all([refresh(), loadSettings()]).finally(() => setLoading(false));
  }, []);

  const handleProcess = async (id: string) => {
    try {
      const { error } = await supabase.rpc('admin_process_order', { p_order_id: id });
      if (error) throw error;
      toast.success('Заказ обработан, расшифровки активированы');
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Ошибка');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await Promise.all([
        supabase.from('payment_settings').upsert({ key: 'qr_image_url', value: qrUrl, updated_at: new Date().toISOString() }),
        supabase.from('payment_settings').upsert({ key: 'payment_instructions', value: instructions, updated_at: new Date().toISOString() }),
        supabase.from('payment_settings').upsert({ key: 'support_contact', value: support, updated_at: new Date().toISOString() }),
      ]);
      toast.success('Настройки сохранены');
    } catch (e: any) {
      toast.error(e.message || 'Ошибка сохранения');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6 mb-8">
      <Card className="p-6 border-2 border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Настройки оплаты
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold mb-1 block">URL QR-картинки</label>
            <Input value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} placeholder="https://..." />
            <p className="text-xs text-muted-foreground mt-1">
              Если пусто — QR-код будет генерироваться автоматически из ID заказа.
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Инструкция</label>
            <textarea
              className="w-full min-h-[100px] border border-input rounded-md p-3 text-sm"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Поддержка (контакт)</label>
            <Input value={support} onChange={(e) => setSupport(e.target.value)} placeholder="@telegram_handle" />
          </div>
          <Button onClick={handleSaveSettings} disabled={savingSettings} className="gap-2">
            <Upload className="w-4 h-4" />
            {savingSettings ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-2 border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          Заказы B2C ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">Заказов пока нет</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="p-4 border border-border rounded-xl flex flex-wrap items-center gap-3"
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                    <span className="text-sm font-bold">{o.tariff_code}</span>
                    <span className="text-sm">${o.price_usd}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {o.user_email || `гость · ${o.device_id?.slice(0, 8)}`} ·{' '}
                    {new Date(o.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                {o.status === 'paid' && (
                  <Button size="sm" onClick={() => handleProcess(o.id)} className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Активировать расшифровки
                  </Button>
                )}
                {o.status === 'new' && (
                  <Button size="sm" variant="outline" onClick={() => handleProcess(o.id)}>
                    Принять без оплаты
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
