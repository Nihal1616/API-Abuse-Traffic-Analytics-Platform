import { Endpoint } from '@/types/security';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, Zap, Clock } from 'lucide-react';

interface EndpointsListProps {
  endpoints: Endpoint[];
}

export function EndpointsList({ endpoints }: EndpointsListProps) {
  const getMethodColor = (method: Endpoint['method']) => {
    const colors = {
      GET: 'bg-success/20 text-success border-success/30',
      POST: 'bg-primary/20 text-primary border-primary/30',
      PUT: 'bg-warning/20 text-warning border-warning/30',
      DELETE: 'bg-threat/20 text-threat border-threat/30',
      PATCH: 'bg-chart-5/20 text-chart-5 border-chart-5/30',
    };
    return colors[method];
  };

  const getAnomalyColor = (score: number) => {
    if (score >= 80) return 'text-threat';
    if (score >= 50) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="metric-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Endpoint Health
          </h3>
          <p className="text-sm text-muted-foreground">Real-time endpoint monitoring</p>
        </div>
      </div>

      <div className="space-y-2">
        {endpoints.map((endpoint, index) => (
          <div
            key={endpoint.id}
            className={cn(
              'group rounded-lg border border-border p-3 transition-all duration-200',
              'hover:border-primary/30 hover:bg-secondary/30',
              endpoint.isUnderAttack && 'border-threat/30 bg-threat/5'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Badge
                  className={cn(
                    'font-mono text-xs px-2 py-0.5',
                    getMethodColor(endpoint.method)
                  )}
                  variant="outline"
                >
                  {endpoint.method}
                </Badge>
                <code className="font-mono text-sm truncate">{endpoint.path}</code>
                {endpoint.isUnderAttack && (
                  <Badge variant="threat" className="animate-pulse">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Under Attack
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    req/min
                  </p>
                  <p className="font-mono font-semibold">
                    {endpoint.requestsPerMinute.toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    avg ms
                  </p>
                  <p className="font-mono font-semibold">
                    {endpoint.avgResponseTime}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">err %</p>
                  <p
                    className={cn(
                      'font-mono font-semibold',
                      endpoint.errorRate > 10 ? 'text-threat' : 'text-muted-foreground'
                    )}
                  >
                    {endpoint.errorRate.toFixed(1)}
                  </p>
                </div>

                <div className="text-right min-w-[60px]">
                  <p className="text-xs text-muted-foreground">anomaly</p>
                  <p
                    className={cn(
                      'font-mono font-bold',
                      getAnomalyColor(endpoint.anomalyScore)
                    )}
                  >
                    {endpoint.anomalyScore}
                  </p>
                </div>
              </div>
            </div>

            {endpoint.topAbusers.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Top abusers:</span>
                {endpoint.topAbusers.slice(0, 2).map((ip) => (
                  <code key={ip} className="font-mono bg-secondary px-1.5 py-0.5 rounded">
                    {ip}
                  </code>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
