import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  BarChart3, 
  Users, 
  Activity, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Home,
  MapPin,
  Eye,
  Building2,
  Link2,
  Copy,
  ArrowLeft,
  Loader2,
  Crown
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PartnerStats } from "@/components/PartnerStats";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { OrdersAdmin } from "@/components/OrdersAdmin";
import { AdsAdmin } from "@/components/AdsAdmin";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface AnalysisStats {
  total_analyses: number;
  today_analyses: number;
  normal_count: number;
  warning_count: number;
  critical_count: number;
  avg_age: number;
  total_visits: number;
  visits_last_30_days: number;
  male_count: number;
  female_count: number;
  top_cities: { city: string; count: number }[];
}

interface VisitsByDay {
  visit_date: string;
  visit_count: number;
}

interface Partner {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
}

interface PartnerSubscription {
  plan_type: string;
  analyses_limit: number;
  analyses_used: number;
  price: number;
  is_active: boolean;
  activated_at: string;
  requested_plan?: string | null;
}

// Dictionary for translating English city names to Russian
const cityTranslations: Record<string, string> = {
  "Moscow": "Москва",
  "Saint Petersburg": "Санкт-Петербург",
  "Novosibirsk": "Новосибирск",
  "Yekaterinburg": "Екатеринбург",
  "Kazan": "Казань",
  "Nizhny Novgorod": "Нижний Новгород",
  "Chelyabinsk": "Челябинск",
  "Samara": "Самара",
  "Omsk": "Омск",
  "Rostov-on-Don": "Ростов-на-Дону",
  "Ufa": "Уфа",
  "Krasnoyarsk": "Красноярск",
  "Perm": "Пермь",
  "Voronezh": "Воронеж",
  "Volgograd": "Волгоград",
  "Krasnodar": "Краснодар",
  "Saratov": "Саратов",
  "Tyumen": "Тюмень",
  "Tolyatti": "Тольятти",
  "Izhevsk": "Ижевск",
  "Barnaul": "Барнаул",
  "Ulyanovsk": "Ульяновск",
  "Irkutsk": "Иркутск",
  "Khabarovsk": "Хабаровск",
  "Yaroslavl": "Ярославль",
  "Vladivostok": "Владивосток",
  "Makhachkala": "Махачкала",
  "Tomsk": "Томск",
  "Orenburg": "Оренбург",
  "Kemerovo": "Кемерово",
  "Novokuznetsk": "Новокузнецк",
  "Ryazan": "Рязань",
  "Astrakhan": "Астрахань",
  "Naberezhnyye Chelny": "Набережные Челны",
  "Penza": "Пенза",
  "Kirov": "Киров",
  "Lipetsk": "Липецк",
  "Cheboksary": "Чебоксары",
  "Balashikha": "Балашиха",
  "Kaliningrad": "Калининград",
  "Tula": "Тула",
  "Kursk": "Курск",
  "Sochi": "Сочи",
  "Stavropol": "Ставрополь",
  "Bryansk": "Брянск",
  "Ivanovo": "Иваново",
  "Belgorod": "Белгород",
  "Surgut": "Сургут",
  "Vladimir": "Владимир",
  "Arkhangelsk": "Архангельск",
  "Chita": "Чита",
  "Kaluga": "Калуга",
  "Smolensk": "Смоленск",
  "Saransk": "Саранск",
  "Vologda": "Вологда",
  "Tver": "Тверь",
  "Yoshkar-Ola": "Йошкар-Ола",
  "Almaty": "Алматы",
  "Nur-Sultan": "Нур-Султан",
  "Astana": "Астана",
  "Bishkek": "Бишкек",
  "Tashkent": "Ташкент",
  "Minsk": "Минск",
  "Kyiv": "Киев",
  "Kiev": "Киев"
};

const translateCity = (city: string | null): string => {
  if (!city) return 'Неизвестно';
  return cityTranslations[city] || city;
};

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [visitsByDay, setVisitsByDay] = useState<VisitsByDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerStats, setPartnerStats] = useState<AnalysisStats | null>(null);
  const [partnerVisitsByDay, setPartnerVisitsByDay] = useState<VisitsByDay[]>([]);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerSubscription, setPartnerSubscription] = useState<PartnerSubscription | null>(null);
  const [partnersSubscriptions, setPartnersSubscriptions] = useState<Record<string, PartnerSubscription>>({});

  const partnerRegisterUrl = `${window.location.origin}/partner/register`;

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Необходима авторизация");
        navigate("/");
        return;
      }

      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roles) {
        toast.error("Доступ запрещен");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await Promise.all([loadStats(), loadVisitsByDay(), loadPartners(), loadAllSubscriptions()]);
    } catch (error) {
      console.error("Admin check error:", error);
      toast.error("Ошибка проверки доступа");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc("get_analysis_stats");

      if (error) throw error;

      if (data && data.length > 0) {
        const rawStats = data[0];
        // Parse top_cities if it's a string
        const topCities = typeof rawStats.top_cities === 'string' 
          ? JSON.parse(rawStats.top_cities) 
          : rawStats.top_cities || [];
        
        setStats({
          ...rawStats,
          top_cities: topCities
        });
      }
    } catch (error) {
      console.error("Stats loading error:", error);
      toast.error("Ошибка загрузки статистики");
    }
  };

  const loadVisitsByDay = async () => {
    try {
      const { data, error } = await supabase.rpc("get_visits_by_day");

      if (error) throw error;

      if (data) {
        setVisitsByDay(data);
      }
    } catch (error) {
      console.error("Visits by day loading error:", error);
    }
  };

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, slug, contact_email, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Partners loading error:", error);
    }
  };

  const loadAllSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_subscriptions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const subsMap: Record<string, PartnerSubscription> = {};
      (data || []).forEach((sub: PartnerSubscription & { partner_id: string }) => {
        subsMap[sub.partner_id] = sub;
      });
      setPartnersSubscriptions(subsMap);
    } catch (error) {
      console.error("Subscriptions loading error:", error);
    }
  };

  const handleSelectPartner = async (partner: Partner) => {
    setSelectedPartner(partner);
    setPartnerLoading(true);

    try {
      const [statsResult, visitsResult, subscriptionResult] = await Promise.all([
        supabase.rpc('get_partner_stats', { p_partner_id: partner.id }),
        supabase.rpc('get_partner_visits_by_day', { p_partner_id: partner.id }),
        supabase.rpc('get_partner_subscription', { p_partner_id: partner.id })
      ]);

      if (statsResult.data && statsResult.data.length > 0) {
        const rawStats = statsResult.data[0];
        const topCities = typeof rawStats.top_cities === 'string' 
          ? JSON.parse(rawStats.top_cities) 
          : rawStats.top_cities || [];
        
        setPartnerStats({
          ...rawStats,
          top_cities: topCities
        });
      }

      setPartnerVisitsByDay(visitsResult.data || []);
      
      if (subscriptionResult.data && subscriptionResult.data.length > 0) {
        setPartnerSubscription(subscriptionResult.data[0] as PartnerSubscription);
      } else {
        setPartnerSubscription(null);
      }
    } catch (error) {
      console.error("Partner stats loading error:", error);
      toast.error("Ошибка загрузки статистики партнёра");
    } finally {
      setPartnerLoading(false);
    }
  };

  const handleBackFromPartner = () => {
    setSelectedPartner(null);
    setPartnerStats(null);
    setPartnerVisitsByDay([]);
    setPartnerSubscription(null);
  };

  const handleSubscriptionUpdate = async () => {
    if (selectedPartner) {
      const { data } = await supabase.rpc('get_partner_subscription', { 
        p_partner_id: selectedPartner.id 
      });
      if (data && data.length > 0) {
        setPartnerSubscription(data[0] as PartnerSubscription);
      }
    }
    await loadAllSubscriptions();
  };

  const copyPartnerLink = () => {
    navigator.clipboard.writeText(partnerRegisterUrl);
    toast.success("Ссылка скопирована!");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из системы");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const genderData = stats ? [
    { name: 'Мужчины', value: stats.male_count, color: 'hsl(210, 100%, 50%)' },
    { name: 'Женщины', value: stats.female_count, color: 'hsl(330, 100%, 60%)' },
  ] : [];

  const chartData = visitsByDay.map(item => ({
    date: new Date(item.visit_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
    visits: Number(item.visit_count)
  }));

  const chartConfig = {
    visits: {
      label: "Визиты",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-6 px-4 sm:py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-primary mb-2">
              Админ-панель
            </h1>
            <p className="text-muted-foreground">Статистика анализов АнализПро</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              На главную
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </Button>
          </div>
        </div>

        <Tabs defaultValue="orders" className="mb-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="orders" className="py-2.5">Заказы</TabsTrigger>
            <TabsTrigger value="payment" className="py-2.5">Настройки оплаты</TabsTrigger>
            <TabsTrigger value="ads" className="py-2.5">Реклама</TabsTrigger>
            <TabsTrigger value="stats" className="py-2.5">Статистика</TabsTrigger>
            <TabsTrigger value="partners" className="py-2.5">Для партнёров</TabsTrigger>
          </TabsList>

          <TabsContent value="ads" className="mt-6">
            <AdsAdmin />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {/* B2C Orders */}
            <OrdersAdmin section="orders" />
          </TabsContent>

          <TabsContent value="payment" className="mt-6">
            <OrdersAdmin section="settings" />
          </TabsContent>


          <TabsContent value="partners" className="mt-6">
        <Card className="p-6 border-2 border-primary/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Link2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Ссылка для регистрации партнёров</h3>
                <code className="text-sm text-muted-foreground break-all">{partnerRegisterUrl}</code>
              </div>
            </div>
            <Button onClick={copyPartnerLink} variant="outline" className="gap-2 shrink-0">
              <Copy className="w-4 h-4" />
              Копировать
            </Button>
          </div>
        </Card>

        {/* Partners List */}
        <Card className="p-6 border-2 border-border mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Клиники-партнёры ({partners.length})
          </h2>
          {partners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map((partner) => (
                <Card 
                  key={partner.id}
                  onClick={() => handleSelectPartner(partner)}
                  className={`p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                    partner.is_active ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{partner.name}</h4>
                      <p className="text-xs text-muted-foreground">/c/{partner.slug}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      partner.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {partner.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>

                  {/* Subscription badge */}
                    {partnersSubscriptions[partner.id] ? (
                    <div className="mb-2">
                      <SubscriptionBadge 
                        planType={partnersSubscriptions[partner.id].plan_type}
                        analysesUsed={partnersSubscriptions[partner.id].analyses_used}
                        analysesLimit={partnersSubscriptions[partner.id].analyses_limit}
                        compact
                      />
                      {partnersSubscriptions[partner.id].requested_plan && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          Заявка на тариф!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-2 flex items-center gap-1 text-xs text-yellow-600">
                      <AlertTriangle className="w-3 h-3" />
                      Нет подписки
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Добавлен: {new Date(partner.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Пока нет зарегистрированных партнёров
            </p>
          )}
        </Card>

        {/* Partner Stats Modal/Section */}
        {selectedPartner && (
          <Card className="p-6 border-2 border-primary/30 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleBackFromPartner}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h2 className="text-xl font-bold">{selectedPartner.name}</h2>
                  <p className="text-sm text-muted-foreground">/c/{selectedPartner.slug}</p>
                </div>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${
                selectedPartner.is_active 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {selectedPartner.is_active ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            
            {partnerLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Subscription Manager */}
                <SubscriptionManager 
                  partnerId={selectedPartner.id}
                  partnerName={selectedPartner.name}
                  subscription={partnerSubscription}
                  onUpdate={handleSubscriptionUpdate}
                />
                
                {/* Partner Stats */}
                <PartnerStats stats={partnerStats} visitsByDay={partnerVisitsByDay} />
              </div>
            )}
          </Card>
        )}
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
        {/* Stats Grid */}
        {stats && (
          <>
            {/* Visits Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Visits */}
              <Card className="p-6 border-2 border-primary/20 hover:border-primary/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Eye className="w-6 h-6 text-primary" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">
                  {stats.total_visits.toLocaleString()}
                </h3>
                <p className="text-sm text-muted-foreground">Всего визитов</p>
              </Card>

              {/* Visits Last 30 Days */}
              <Card className="p-6 border-2 border-accent/20 hover:border-accent/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <Calendar className="w-6 h-6 text-accent" />
                  </div>
                  <Activity className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">
                  {stats.visits_last_30_days.toLocaleString()}
                </h3>
                <p className="text-sm text-muted-foreground">За 30 дней</p>
              </Card>

              {/* Male Count */}
              <Card className="p-6 border-2 border-blue-200 hover:border-blue-300 transition-all bg-blue-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <span className="text-2xl">👨</span>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-blue-700 mb-1">
                  {stats.male_count.toLocaleString()}
                </h3>
                <p className="text-sm text-blue-600">Мужчин</p>
                {(stats.male_count + stats.female_count) > 0 && (
                  <p className="text-xs text-blue-500 mt-1">
                    {((stats.male_count / (stats.male_count + stats.female_count)) * 100).toFixed(1)}%
                  </p>
                )}
              </Card>

              {/* Female Count */}
              <Card className="p-6 border-2 border-pink-200 hover:border-pink-300 transition-all bg-pink-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-pink-100 rounded-xl">
                    <span className="text-2xl">👩</span>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-pink-700 mb-1">
                  {stats.female_count.toLocaleString()}
                </h3>
                <p className="text-sm text-pink-600">Женщин</p>
                {(stats.male_count + stats.female_count) > 0 && (
                  <p className="text-xs text-pink-500 mt-1">
                    {((stats.female_count / (stats.male_count + stats.female_count)) * 100).toFixed(1)}%
                  </p>
                )}
              </Card>
            </div>

            {/* Analyses Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Total Analyses */}
              <Card className="p-6 border-2 border-primary/20 hover:border-primary/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">
                  {stats.total_analyses.toLocaleString()}
                </h3>
                <p className="text-sm text-muted-foreground">Всего анализов</p>
              </Card>

              {/* Today's Analyses */}
              <Card className="p-6 border-2 border-accent/20 hover:border-accent/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <Calendar className="w-6 h-6 text-accent" />
                  </div>
                  <Activity className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">
                  {stats.today_analyses.toLocaleString()}
                </h3>
                <p className="text-sm text-muted-foreground">Анализов сегодня</p>
              </Card>

              {/* Average Age */}
              <Card className="p-6 border-2 border-border hover:border-primary/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-muted rounded-xl">
                    <Users className="w-6 h-6 text-foreground" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">
                  {stats.avg_age ? stats.avg_age.toFixed(1) : "—"}
                </h3>
                <p className="text-sm text-muted-foreground">Средний возраст</p>
              </Card>
            </div>

            {/* Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Normal Results */}
              <Card className="p-6 border-2 border-green-200 hover:border-green-300 transition-all bg-green-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-green-700 mb-1">
                  {stats.normal_count.toLocaleString()}
                </h3>
                <p className="text-sm text-green-600">Норма</p>
                {stats.total_analyses > 0 && (
                  <p className="text-xs text-green-500 mt-1">
                    {((stats.normal_count / stats.total_analyses) * 100).toFixed(1)}%
                  </p>
                )}
              </Card>

              {/* Warning Results */}
              <Card className="p-6 border-2 border-yellow-200 hover:border-yellow-300 transition-all bg-yellow-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-yellow-700 mb-1">
                  {stats.warning_count.toLocaleString()}
                </h3>
                <p className="text-sm text-yellow-600">Обратить внимание</p>
                {stats.total_analyses > 0 && (
                  <p className="text-xs text-yellow-500 mt-1">
                    {((stats.warning_count / stats.total_analyses) * 100).toFixed(1)}%
                  </p>
                )}
              </Card>

              {/* Critical Results */}
              <Card className="p-6 border-2 border-red-200 hover:border-red-300 transition-all bg-red-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-red-700 mb-1">
                  {stats.critical_count.toLocaleString()}
                </h3>
                <p className="text-sm text-red-600">Критично</p>
                {stats.total_analyses > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    {((stats.critical_count / stats.total_analyses) * 100).toFixed(1)}%
                  </p>
                )}
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Visits Chart */}
              <Card className="p-6 border-2 border-border">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Визиты за 30 дней
                </h2>
                <div className="h-64">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <BarChart data={chartData}>
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="visits" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </Card>

              {/* Gender Pie Chart */}
              <Card className="p-6 border-2 border-border">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Распределение по полу
                </h2>
                <div className="h-64 flex items-center justify-center">
                  {(stats.male_count + stats.female_count) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">Нет данных</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Top Cities */}
            <Card className="p-6 border-2 border-border mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Топ-5 городов
              </h2>
              {stats.top_cities && stats.top_cities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {stats.top_cities.map((cityData, index) => (
                    <div 
                      key={index} 
                      className="p-4 bg-muted/50 rounded-xl border border-border text-center"
                    >
                      <p className="text-2xl font-bold text-foreground mb-1">
                        {cityData.count}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {translateCity(cityData.city)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Данные о городах пока не собраны
                </p>
              )}
            </Card>
          </>
        )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="p-6 border-2 border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Информация о системе
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Статистика обновляется в реальном времени</p>
            <p>• Все анализы логируются в базе данных</p>
            <p>• Геолокация определяется по IP-адресу</p>
            <p>• Данные защищены Row Level Security (RLS)</p>
            <p>• Доступ к панели только у администраторов</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
