import { Card } from '@/components/ui/card';
import { Users, FileText, Activity, MapPin, UserCheck, UserMinus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PartnerStatsProps {
  stats: {
    total_analyses: number;
    today_analyses: number;
    normal_count: number;
    warning_count: number;
    critical_count: number;
    avg_age: number | null;
    total_visits: number;
    visits_last_30_days: number;
    male_count: number;
    female_count: number;
    top_cities: { city: string; count: number }[];
  } | null;
  visitsByDay: { visit_date: string; visit_count: number }[];
}

export function PartnerStats({ stats, visitsByDay }: PartnerStatsProps) {
  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Загрузка статистики...
      </div>
    );
  }

  const genderData = [
    { name: 'Мужчины', value: stats.male_count, color: 'hsl(var(--primary))' },
    { name: 'Женщины', value: stats.female_count, color: 'hsl(var(--accent))' },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: 'Норма', value: stats.normal_count, color: '#22c55e' },
    { name: 'Внимание', value: stats.warning_count, color: '#eab308' },
    { name: 'Критично', value: stats.critical_count, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const chartData = visitsByDay.map(v => ({
    date: new Date(v.visit_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    visits: v.visit_count
  }));

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-2 border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total_visits}</div>
              <div className="text-xs text-muted-foreground">Всего визитов</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.visits_last_30_days}</div>
              <div className="text-xs text-muted-foreground">За 30 дней</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total_analyses}</div>
              <div className="text-xs text-muted-foreground">Анализов</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <FileText className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.today_analyses}</div>
              <div className="text-xs text-muted-foreground">Сегодня</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Visits Chart */}
        <Card className="p-4 border-2 border-border/50">
          <h3 className="font-semibold mb-4">Динамика визитов (30 дней)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gender Distribution */}
        <Card className="p-4 border-2 border-border/50">
          <h3 className="font-semibold mb-4">Распределение по полу</h3>
          {genderData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="h-[150px] w-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {genderData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Нет данных
            </div>
          )}
        </Card>
      </div>

      {/* Status and Cities Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="p-4 border-2 border-border/50">
          <h3 className="font-semibold mb-4">Статусы анализов</h3>
          {statusData.length > 0 ? (
            <div className="space-y-3">
              {statusData.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm">{status.name}</span>
                  </div>
                  <span className="font-medium">{status.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Нет данных
            </div>
          )}
        </Card>

        {/* Top Cities */}
        <Card className="p-4 border-2 border-border/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Топ городов
          </h3>
          {stats.top_cities && stats.top_cities.length > 0 ? (
            <div className="space-y-2">
              {stats.top_cities.map((city, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm">{city.city}</span>
                  <span className="font-medium text-sm">{city.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Нет данных о городах
            </div>
          )}
        </Card>
      </div>

      {/* Average Age */}
      {stats.avg_age && (
        <Card className="p-4 border-2 border-border/50">
          <div className="flex items-center justify-center gap-4">
            <span className="text-muted-foreground">Средний возраст пациентов:</span>
            <span className="text-2xl font-bold">{stats.avg_age.toFixed(1)} лет</span>
          </div>
        </Card>
      )}
    </div>
  );
}
