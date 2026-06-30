import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShoppingCart, CheckCircle2, Settings, Upload, Trash2, Search, Filter, DollarSign } from 'lucide-react';

interface Order {
  id: string;
  order_number: number;
  user_id: string | null;
  device_id: string | null;
  tariff_code: string;
  tariff_title: string | null;
  price_usd: number;
  status: string;
  effective_status: string;
  reports_total: number | null;
  reports_used: number | null;
  reports_left: number | null;
  expires_at: string | null;
  created_at: string;
  paid_at: string | null;
  processed_at: string | null;
  user_email: string | null;
}

interface Tariff { code: string; title: string; price_usd: number; reports_limit: number }

const EFF_BADGE: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  paid: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-700',
  exhausted: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
};
const EFF_LABEL: Record<string, string> = {
  new: 'Не активирован',
  paid: 'Оплачен',
  active: 'Активирован',
  exhausted: 'Исчерпан',
  cancelled: 'Отменён',
};

const RANGE_OPTIONS: { value: string; label: string; days: number | null }[] = [
  { value: '1', label: 'За 1 день', days: 1 },
  { value: '7', label: 'За 7 дней', days: 7 },
  { value: '30', label: 'За 30 дней', days: 30 },
  { value: '90', label: 'За 90 дней', days: 90 },
  { value: 'all', label: 'За всё время', days: null },
];

function fmtMoscow(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) + ' МСК';
}

export function OrdersAdmin({ section = 'all' }: { section?: 'all' | 'orders' | 'settings' } = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);

  const [qrUrl, setQrUrl] = useState('');
  const [qrPath, setQrPath] = useState('');
  const [qrPreview, setQrPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [support, setSupport] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const [range, setRange] = useState('7');
  const [search, setSearch] = useState('');

  const refresh = async () => {
    const { data } = await supabase.rpc('admin_list_orders');
    if (data) setOrders(data as Order[]);
  };

  const loadTariffs = async () => {
    const { data } = await supabase.from('tariffs').select('code,title,price_usd,reports_limit').eq('is_active', true).order('sort_order');
    if (data) setTariffs(data as Tariff[]);
  };

  const loadSettings = async () => {
    const { data } = await supabase.from('payment_settings').select('*');
    if (data) {
      const m = Object.fromEntries(data.map((d) => [d.key, d.value ?? '']));
      setQrUrl(m.qr_image_url || '');
      setQrPath(m.qr_image_path || '');
      setInstructions(m.payment_instructions || '');
      setSupport(m.support_contact || '');
      setPaymentLink(m.payment_link || '');
      setTgChatId(m.admin_telegram_chat_id || '');
      if (m.qr_image_path) {
        const { data: signed } = await supabase.storage.from('payment-qr').createSignedUrl(m.qr_image_path, 3600);
        setQrPreview(signed?.signedUrl || '');
      } else if (m.qr_image_url) {
        setQrPreview(m.qr_image_url);
      }
    }
  };

  useEffect(() => {
    Promise.all([refresh(), loadSettings(), loadTariffs()]).finally(() => setLoading(false));
  }, []);

  const handleProcess = async (id: string) => {
    try {
      const { error } = await supabase.rpc('admin_process_order', { p_order_id: id });
      if (error) throw error;
      toast.success('Заказ активирован');
      await refresh();
    } catch (e: any) { toast.error(e.message || 'Ошибка'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.rpc('admin_delete_order', { p_order_id: id });
      if (error) throw error;
      toast.success('Заказ удалён');
      await refresh();
    } catch (e: any) { toast.error(e.message || 'Ошибка'); }
  };

  const handleChangeTariff = async (id: string, code: string) => {
    try {
      const { error } = await supabase.rpc('admin_change_order_tariff', { p_order_id: id, p_tariff_code: code });
      if (error) throw error;
      toast.success('Тариф обновлён');
      await refresh();
    } catch (e: any) { toast.error(e.message || 'Ошибка'); }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await Promise.all([
        supabase.from('payment_settings').upsert({ key: 'qr_image_url', value: qrUrl, updated_at: new Date().toISOString() }),
        supabase.from('payment_settings').upsert({ key: 'qr_image_path', value: qrPath, updated_at: new Date().toISOString() }),
        supabase.from('payment_settings').upsert({ key: 'payment_instructions', value: instructions, updated_at: new Date().toISOString() }),
        supabase.from('payment_settings').upsert({ key: 'support_contact', value: support, updated_at: new Date().toISOString() }),
        supabase.from('payment_settings').upsert({ key: 'payment_link', value: paymentLink, updated_at: new Date().toISOString() }),
        supabase.from('payment_settings').upsert({ key: 'admin_telegram_chat_id', value: tgChatId, updated_at: new Date().toISOString() }),
      ]);
      toast.success('Настройки сохранены');
    } catch (e: any) { toast.error(e.message || 'Ошибка'); }
    finally { setSavingSettings(false); }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Файл слишком большой (макс 5 МБ)'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `qr-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('payment-qr').upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      if (qrPath && qrPath !== path) await supabase.storage.from('payment-qr').remove([qrPath]);
      setQrPath(path);
      setQrUrl('');
      const { data: signed } = await supabase.storage.from('payment-qr').createSignedUrl(path, 3600);
      setQrPreview(signed?.signedUrl || '');
      await Promise.all([
        supabase.from('payment_settings').upsert({ key: 'qr_image_path', value: path, updated_at: new Date().toISOString() }),
        supabase.from('payment_settings').upsert({ key: 'qr_image_url', value: '', updated_at: new Date().toISOString() }),
      ]);
      toast.success('QR-код загружен');
    } catch (err: any) { toast.error(err.message || 'Ошибка загрузки'); }
    finally { setUploading(false); }
  };

  // Фильтрация
  const filteredByDate = useMemo(() => {
    const opt = RANGE_OPTIONS.find((r) => r.value === range);
    if (!opt || opt.days === null) return orders;
    const cutoff = Date.now() - opt.days * 24 * 3600 * 1000;
    return orders.filter((o) => new Date(o.created_at).getTime() >= cutoff);
  }, [orders, range]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredByDate;
    return filteredByDate.filter((o) => {
      if (String(o.order_number).includes(q)) return true;
      if (o.user_email?.toLowerCase().includes(q)) return true;
      if (o.created_at.startsWith(q)) return true;
      // Поиск по дате в формате DD.MM.YYYY
      const d = new Date(o.created_at).toLocaleDateString('ru-RU');
      return d.includes(q);
    });
  }, [filteredByDate, search]);

  const totalPaid = useMemo(
    () => filtered.filter((o) => ['paid', 'active', 'exhausted'].includes(o.effective_status))
      .reduce((s, o) => s + Number(o.price_usd || 0), 0),
    [filtered]
  );

  if (loading) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* Настройки оплаты */}
      {section !== 'orders' && (
      <Card className="p-6 border-2 border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" /> Настройки оплаты
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold mb-1 block">QR-картинка</label>
            {qrPreview && (
              <div className="mb-2 p-3 bg-white rounded-lg border inline-block">
                <img src={qrPreview} alt="QR" className="w-32 h-32 object-contain" />
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleQrUpload} disabled={uploading}
              className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:font-semibold hover:file:opacity-90" />
            <p className="text-xs text-muted-foreground mt-1">
              {uploading ? 'Загрузка...' : 'PNG/JPG до 5 МБ. Или укажите URL ниже.'}
            </p>
            <Input value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} placeholder="https://..." className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Инструкция</label>
            <textarea className="w-full min-h-[100px] border border-input rounded-md p-3 text-sm"
              value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Поддержка</label>
            <Input value={support} onChange={(e) => setSupport(e.target.value)} placeholder="@telegram_handle" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Ссылка на оплату</label>
            <Input value={paymentLink} onChange={(e) => setPaymentLink(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Telegram chat_id админа (для уведомлений о заказах)</label>
            <Input value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} placeholder="например, 123456789" />
            <p className="text-xs text-muted-foreground mt-1">
              Узнать свой chat_id: напишите в Telegram боту <b>@userinfobot</b> — он пришлёт ваш ID. Также напишите хотя бы одно сообщение нашему боту <b>@med_gid_bot</b>, чтобы он мог вам писать.
            </p>
          </div>
          <Button onClick={handleSaveSettings} disabled={savingSettings} className="gap-2">
            <Upload className="w-4 h-4" />
            {savingSettings ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>
        </div>
      </Card>
      )}

      {/* Заказы */}
      {section !== 'settings' && (
      <Card className="p-6 border-2 border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" /> Заказы B2C
        </h2>

        {/* Фильтры */}
        <div className="grid gap-3 md:grid-cols-[1fr_220px] mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск: №, email или дата (28.06.2026)" className="pl-9" />
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Итоги */}
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">Найдено заказов</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-700" />
            <div>
              <p className="text-xs text-muted-foreground">Сумма оплаченных</p>
              <p className="text-2xl font-bold text-green-700">${totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">Заказов не найдено</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((o) => (
              <div key={o.id} className="p-4 border border-border rounded-xl flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-mono font-bold text-primary">#{o.order_number}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${EFF_BADGE[o.effective_status]}`}>
                      {EFF_LABEL[o.effective_status]}
                    </span>
                    <span className="text-sm font-bold">{o.tariff_title || o.tariff_code}</span>
                    <span className="text-sm font-bold text-green-700">${o.price_usd}</span>
                    {o.reports_left !== null && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        Осталось — {o.reports_left} из {o.reports_total}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {o.user_email || `гость · ${o.device_id?.slice(0, 8)}`} · {fmtMoscow(o.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={o.tariff_code} onValueChange={(v) => handleChangeTariff(o.id, v)}>
                    <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tariffs.map((t) => (
                        <SelectItem key={t.code} value={t.code}>{t.title} · ${t.price_usd}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {o.effective_status !== 'active' && o.effective_status !== 'exhausted' && (
                    <Button size="sm" onClick={() => handleProcess(o.id)} className="gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Активировать
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить заказ #{o.order_number}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Действие необратимо. Связанные расшифровки по этому заказу также будут удалены.
                          Пользователь и его отчёты сохраняются.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(o.id)} className="bg-red-600 hover:bg-red-700">
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
