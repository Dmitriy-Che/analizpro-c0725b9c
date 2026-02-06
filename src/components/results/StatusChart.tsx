import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface StatusChartProps {
  normalCount: number;
  abnormalCount: number;
  overallStatus: 'normal' | 'warning' | 'critical';
}

export function StatusChart({ normalCount, abnormalCount, overallStatus }: StatusChartProps) {
  const data = [
    { name: 'В норме', value: normalCount, color: '#22c55e' },
    { name: 'Отклонения', value: abnormalCount, color: overallStatus === 'critical' ? '#ef4444' : '#eab308' },
  ].filter(d => d.value > 0);

  const total = normalCount + abnormalCount;
  const normalPct = total > 0 ? Math.round((normalCount / total) * 100) : 0;

  const StatusIcon = overallStatus === 'normal' 
    ? CheckCircle2 
    : overallStatus === 'warning' 
    ? AlertTriangle 
    : AlertCircle;

  const statusText = overallStatus === 'normal' 
    ? 'Всё в норме!' 
    : overallStatus === 'warning' 
    ? 'Есть отклонения' 
    : 'Требуется внимание';

  const statusColor = overallStatus === 'normal' 
    ? 'text-green-600' 
    : overallStatus === 'warning' 
    ? 'text-yellow-600' 
    : 'text-red-600';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [`${value} показателей`, name]}
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <StatusIcon className={`w-8 h-8 ${statusColor}`} />
          <span className="text-xl font-bold mt-1">{normalPct}%</span>
        </div>
      </div>
      
      <p className={`text-sm font-semibold mt-2 ${statusColor}`}>
        {statusText}
      </p>
      
      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
