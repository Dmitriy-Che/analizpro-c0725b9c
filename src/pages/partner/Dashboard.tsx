import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { usePartner } from '@/hooks/usePartner';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { PartnerStats } from '@/components/PartnerStats';
import { PartnerSubscriptionCard } from '@/components/PartnerSubscriptionCard';
import { PartnerPlanSelector } from '@/components/PartnerPlanSelector';
import logo from '@/assets/new-logo.png';
import { 
  BarChart3, 
  Settings, 
  QrCode, 
  LogOut, 
  Loader2, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Save,
  Crown
} from 'lucide-react';

interface SubscriptionData {
  plan_type: string;
  analyses_limit: number;
  analyses_used: number;
  price: number;
  is_active: boolean;
  activated_at: string;
  requested_plan?: string | null;
}

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { partner, loading, error, fetchStats, fetchVisitsByDay, fetchSubscription, updatePartner, signOut } = usePartner();
  const [stats, setStats] = useState<any>(null);
  const [visitsByDay, setVisitsByDay] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: ''
  });

  useEffect(() => {
    if (!loading && !partner) {
      navigate('/partner/login');
    }
  }, [loading, partner, navigate]);

  useEffect(() => {
    if (partner) {
      setEditData({
        name: partner.name,
        contact_email: partner.contact_email || '',
        contact_phone: partner.contact_phone || '',
        address: partner.address || ''
      });

      const loadStats = async () => {
        setStatsLoading(true);
        const [statsData, visitsData, subscriptionData] = await Promise.all([
          fetchStats(),
          fetchVisitsByDay(),
          fetchSubscription()
        ]);
        setStats(statsData);
        setVisitsByDay(visitsData);
        setSubscription(subscriptionData);
        setStatsLoading(false);
      };

      loadStats();
    }
  }, [partner]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await updatePartner({
      name: editData.name,
      contact_email: editData.contact_email || null,
      contact_phone: editData.contact_phone || null,
      address: editData.address || null
    });

    if (error) {
      toast.error('Ошибка сохранения');
    } else {
      toast.success('Настройки сохранены');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return null;
  }

  const clinicUrl = `${window.location.origin}/c/${partner.slug}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-8">
      {/* Header */}
      <header className="bg-card/95 border-b-2 border-border/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={partner.logo_url || logo} 
              alt={partner.name} 
              className="w-10 h-10 rounded-full shadow object-contain bg-white"
            />
            <div>
              <h1 className="font-bold">{partner.name}</h1>
              <p className="text-xs text-muted-foreground">Личный кабинет</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Статистика</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-2">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Тариф</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-2">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QR-код</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Настройки</span>
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats">
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Subscription Card */}
                <PartnerSubscriptionCard subscription={subscription} />
                
                {/* Stats */}
                <PartnerStats stats={stats} visitsByDay={visitsByDay} />
              </div>
            )}
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan">
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : subscription ? (
              <div className="space-y-6">
                <PartnerSubscriptionCard subscription={subscription} />
                <PartnerPlanSelector 
                  partnerId={partner.id}
                  currentPlan={subscription.plan_type}
                  requestedPlan={subscription.requested_plan || null}
                  onPlanRequested={async () => {
                    const sub = await fetchSubscription();
                    setSubscription(sub);
                  }}
                />
              </div>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                Нет данных о подписке. Обратитесь к администратору.
              </Card>
            )}
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qr">
            <div className="grid lg:grid-cols-2 gap-6">
              <QRCodeGenerator url={clinicUrl} clinicName={partner.name} />
              
              <Card className="p-6 border-2 border-border/50">
                <h3 className="font-semibold text-lg mb-4">Как использовать</h3>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <span>Скачайте QR-код и распечатайте его</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <span>Разместите в приёмной или у стойки регистрации</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <span>Пациенты сканируют код и получают доступ к сервису</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">4</span>
                    <span>Вся статистика отображается в вашем личном кабинете</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Ваша персональная ссылка:</p>
                  <code className="text-xs break-all text-primary">{clinicUrl}</code>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="p-6 border-2 border-border/50 max-w-xl">
              <h3 className="font-semibold text-lg mb-6">Настройки клиники</h3>
              
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Название клиники
                  </Label>
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editData.contact_email}
                    onChange={(e) => setEditData({ ...editData, contact_email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Телефон
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={editData.contact_phone}
                    onChange={(e) => setEditData({ ...editData, contact_phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Адрес
                  </Label>
                  <Input
                    id="address"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Сохранить
                  </Button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Ваш slug:</strong> {partner.slug}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Slug используется в URL вашей страницы и не может быть изменён
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
