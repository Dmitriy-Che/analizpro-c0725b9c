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
      const settingsRes = await supabase.from('payment_settings').select('key,value');
      if (!cancelled && settingsRes.data) {
        const s = settingsRes.data.reduce((acc, r) => {
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

    // Поллинг статуса заказа каждые 5 секунд, пока он 'new'.
    // Останавливаем, как только статус изменится (paid/processed/cancelled).
    const interval = setInterval(() => {
      setOrder((current) => {
        if (!current || current.status !== 'new') return current;
        fetchOrder();
        return current;
      });
    }, 5000);

    // Обновляем при возврате на вкладку
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
  const qrUrl =
    settings.qr_image_url ||
    `analizpro:order:${order.id}:amount:${order.price_usd}USD`;

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

              {settings.payment_link && (
                <Button
                  asChild
                  className="w-full mb-4 h-12 bg-gradient-to-r from-primary to-accent font-bold"
                >
                  <a href={settings.payment_link} target="_blank" rel="noopener noreferrer">
                    Перейти к оплате по ссылке
                  </a>
                </Button>
              )}

              <div className="p-4 bg-muted/50 rounded-xl mb-6 text-sm text-muted-foreground leading-relaxed">
                {settings.payment_instructions ||
                  'Отсканируйте QR-код своим банковским приложением и переведите указанную сумму.'}
                {settings.support_contact && (
                  <div className="mt-3 flex items-center gap-2">
                    Поддержка:{' '}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(settings.support_contact);
                        toast.success('Скопировано');
                      }}
                      className="text-primary font-semibold inline-flex items-center gap-1"
                    >
                      {settings.support_contact} <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-center">
                <p className="font-semibold text-primary mb-1">
                  Подтверждение оплаты — автоматически
                </p>
                <p className="text-muted-foreground text-xs">
                  Как только платёж поступит, расшифровки активируются сами, и мы пришлём уведомление. Закрывать страницу не обязательно.
                </p>
              </div>

            </>
          )}
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
