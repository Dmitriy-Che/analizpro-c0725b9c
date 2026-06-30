import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { DesktopNav } from '@/components/DesktopNav';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, ArrowLeft, Copy, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getTariff } from '@/config/tariffs';
import { toast } from 'sonner';

interface OrderRow {
  id: string;
  tariff_code: string;
  price_usd: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface PaymentSettings {
  qr_image_url: string;
  payment_instructions: string;
  support_contact: string;
  payment_link: string;
  wallet_address: string;
  wallet_network: string;
  support_telegram_url: string;
}

export default function Pay() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { deviceId } = useCurrentUser();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [settings, setSettings] = useState<PaymentSettings>({
    qr_image_url: '',
    payment_instructions: '',
    support_contact: '',
    payment_link: '',
    wallet_address: '',
    wallet_network: '',
    support_telegram_url: '',
  });
  const [marking, setMarking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    const fetchOrder = async () => {
      const { data } = await supabase.rpc('get_my_order', { p_order_id: orderId, p_device_id: deviceId });
      if (cancelled) return;
      if (data && data.length > 0) setOrder(data[0] as OrderRow);
    };

    (async () => {
      const settingsRes = await supabase.rpc('get_public_payment_settings');
      if (!cancelled && settingsRes.data) {
        const rows = settingsRes.data as { key: string; value: string | null }[];
        const s = rows.reduce((acc, r) => {
          acc[r.key] = r.value ?? '';
          return acc;
        }, {} as Record<string, string>);
        let qr = s.qr_image_url || '';
        const qrPath = s.qr_image_path || '';
        if (qrPath && !qr) {
          const { data: signed } = await supabase.storage
            .from('payment-qr')
            .createSignedUrl(qrPath, 60 * 60 * 24 * 7);
          qr = signed?.signedUrl || '';
        }
        if (!cancelled) {
          setSettings({
            qr_image_url: qr,
            payment_instructions: s.payment_instructions || '',
            support_contact: s.support_contact || '',
            payment_link: s.payment_link || '',
            wallet_address: s.wallet_address || '',
            wallet_network: s.wallet_network || '',
            support_telegram_url: s.support_telegram_url || 'https://t.me/D_METRIUS',
          });
        }
      }
      await fetchOrder();
      if (!cancelled) setLoading(false);
    })();

    // Поллинг статуса + авто-сверка TRON каждые 15 секунд, пока заказ 'new'
    const interval = setInterval(() => {
      setOrder((current) => {
        if (!current || current.status !== 'new') return current;
        fetchOrder();
        supabase.functions.invoke('verify-tron-payment', {
          body: { order_id: current.id },
        }).catch(() => {});
        return current;
      });
    }, 15000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchOrder();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [orderId, deviceId]);

  // Курс USDT → RUB (для удобства)
  const [rubRate, setRubRate] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=rub')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setRubRate(d?.tether?.rub ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Заказ не найден</p>
        <Button onClick={() => navigate('/tariffs')}>К тарифам</Button>
      </div>
    );
  }

  const tariff = getTariff(order.tariff_code);
  const isPaid = order.status !== 'new';
  // TRON URI: некоторые кошельки (TronLink, Trust) автозаполняют сумму
  const tronUri = settings.wallet_address
    ? `tron:${settings.wallet_address}?amount=${order.price_usd}&token=USDT`
    : `analizpro:order:${order.id}:amount:${order.price_usd}USD`;

  const copyAll = () => {
    if (settings.wallet_address) {
      navigator.clipboard.writeText(settings.wallet_address);
      toast.success(`Адрес и сумма $${order.price_usd} USDT скопированы`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pt-16 lg:pt-0 pb-6 lg:pb-12">
      <DesktopNav />

      <div className="relative max-w-[480px] lg:max-w-2xl mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <div className="lg:hidden">
          <Header />
        </div>

        <Button
          variant="ghost"
          onClick={() => navigate('/tariffs')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          К тарифам
        </Button>

        <Card className="p-6 lg:p-8 border-2 border-border/50 bg-card/95">
          <div className="text-center mb-6">
            <h1 className="text-2xl lg:text-3xl font-black mb-2">Оплата заказа</h1>
            <p className="text-muted-foreground">{tariff?.title ?? order.tariff_code}</p>
          </div>

          {isPaid ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Спасибо!</h2>
              <p className="text-muted-foreground mb-6">
                Мы проверяем оплату. Как только расшифровки будут активированы, вы сможете воспользоваться ими — а готовые отчёты появятся в разделе «Мои отчёты».
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate('/my-reports')} className="bg-gradient-to-r from-primary to-accent">
                  Перейти в «Мои отчёты»
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  На главную
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl p-6 flex justify-center mb-6 shadow-sm">
                {settings.qr_image_url ? (
                  <img
                    src={settings.qr_image_url}
                    alt="QR оплаты"
                    className="w-64 h-64 object-contain"
                  />
                ) : (
                  <QRCodeSVG value={qrUrl} size={256} level="H" includeMargin />
                )}
              </div>

              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-1">Сумма к оплате</p>
                <p className="text-4xl lg:text-5xl font-black text-primary">
                  ${order.price_usd}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  № заказа: <code>{order.id.slice(0, 8)}</code>
                </p>
              </div>

              {settings.wallet_address && (
                <div className="mb-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Адрес кошелька {settings.wallet_network && `· ${settings.wallet_network}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs lg:text-sm font-mono break-all">
                      {settings.wallet_address}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(settings.wallet_address);
                        toast.success('Адрес скопирован');
                      }}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {settings.payment_link && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full mb-4 h-11"
                >
                  <a href={settings.payment_link} target="_blank" rel="noopener noreferrer">
                    Альтернативная ссылка на оплату
                  </a>
                </Button>
              )}

              <div className="p-4 bg-muted/50 rounded-xl mb-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {(settings.payment_instructions ||
                  'Отсканируйте QR-код и переведите сумму [price_usd] USDT на указанные реквизиты или свяжитесь с поддержкой для альтернативы.')
                  .split('[price_usd]').join(String(order.price_usd))
                  .split('[wallet]').join(settings.wallet_address)
                  .split('[network]').join(settings.wallet_network)}
              </div>

              <Button
                onClick={async () => {
                  setMarking(true);
                  try {
                    const { error } = await supabase.rpc('mark_order_paid_by_user', {
                      p_order_id: order.id,
                      p_device_id: deviceId,
                    });
                    if (error) throw error;
                    toast.success('Спасибо! Заказ передан администратору на активацию.');
                    const { data } = await supabase.rpc('get_my_order', {
                      p_order_id: order.id,
                      p_device_id: deviceId,
                    });
                    if (data && data.length > 0) setOrder(data[0] as OrderRow);
                    // Уведомление админу в Telegram (best-effort)
                    supabase.functions.invoke('notify-admin-order', {
                      body: { order_id: order.id },
                    }).catch(() => {});
                  } catch (e: any) {
                    toast.error(e.message || 'Не удалось отправить');
                  } finally {
                    setMarking(false);
                  }
                }}
                disabled={marking}
                className="w-full h-12 mb-3 bg-gradient-to-r from-primary to-accent font-bold text-base"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                {marking ? 'Отправка...' : 'Я оплатил'}
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full h-11 mb-4 gap-2"
              >
                <a
                  href={settings.support_telegram_url || 'https://t.me/D_METRIUS'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Написать в поддержку
                </a>
              </Button>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs text-center text-muted-foreground">
                После оплаты нажмите «Я оплатил» — администратор проверит платёж и активирует расшифровки. Уведомление придёт автоматически.
              </div>
            </>
          )}
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
