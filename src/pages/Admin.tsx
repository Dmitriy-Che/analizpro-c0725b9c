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
  Home
} from "lucide-react";

interface AnalysisStats {
  total_analyses: number;
  today_analyses: number;
  normal_count: number;
  warning_count: number;
  critical_count: number;
  avg_age: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);

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
      await loadStats();
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
        setStats(data[0]);
      }
    } catch (error) {
      console.error("Stats loading error:", error);
      toast.error("Ошибка загрузки статистики");
    }
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

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Analyses */}
            <Card className="p-6 border-2 border-primary/20 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <TrendingUp className="w-5 h-5 text-success" />
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
              <p className="text-sm text-muted-foreground">Сегодня</p>
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
        )}

        {/* Info Card */}
        <Card className="p-6 border-2 border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Информация о системе
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Статистика обновляется в реальном времени</p>
            <p>• Все анализы логируются в базе данных</p>
            <p>• Данные защищены Row Level Security (RLS)</p>
            <p>• Доступ к панели только у администраторов</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
