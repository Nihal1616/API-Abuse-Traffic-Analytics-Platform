import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TimeSeriesData } from '@/types/security';
import { format } from 'date-fns';

interface TrafficChartProps {
  data: TimeSeriesData[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      time: format(item.timestamp, 'HH:mm'),
    }));
  }, [data]);

  return (
    <div className="metric-card h-[320px]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Traffic Overview</h3>
          <p className="text-sm text-muted-foreground">Last 24 hours</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Requests</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-threat" />
            <span className="text-muted-foreground">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Anomalies</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(186, 100%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(186, 100%, 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="anomaliesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="hsl(215, 20%, 55%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(215, 20%, 55%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(222, 47%, 8%)',
              border: '1px solid hsl(222, 30%, 18%)',
              borderRadius: '8px',
              boxShadow: '0 4px 24px hsl(222, 47%, 4%, 0.5)',
            }}
            labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
            itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
          />
          <Area
            type="monotone"
            dataKey="requests"
            stroke="hsl(186, 100%, 50%)"
            strokeWidth={2}
            fill="url(#requestsGradient)"
            name="Requests"
          />
          <Area
            type="monotone"
            dataKey="blocked"
            stroke="hsl(0, 72%, 51%)"
            strokeWidth={2}
            fill="url(#blockedGradient)"
            name="Blocked"
          />
          <Area
            type="monotone"
            dataKey="anomalies"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth={2}
            fill="url(#anomaliesGradient)"
            name="Anomalies"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
