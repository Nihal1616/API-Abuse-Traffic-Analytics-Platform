import { AnomalyEvent } from '@/types/security';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { 
  AlertTriangle, 
  Shield, 
  Globe, 
  Key, 
  Search, 
  Zap,
  AlertCircle,
  Info,
  XCircle
} from 'lucide-react';

interface AnomalyTimelineProps {
  events: AnomalyEvent[];
}

export function AnomalyTimeline({ events }: AnomalyTimelineProps) {
  const getTypeIcon = (type: AnomalyEvent['type']) => {
    const icons = {
      rate_spike: <Zap className="h-4 w-4" />,
      pattern_anomaly: <Search className="h-4 w-4" />,
      geo_anomaly: <Globe className="h-4 w-4" />,
      credential_stuffing: <Key className="h-4 w-4" />,
      scraping: <Search className="h-4 w-4" />,
      ddos: <Shield className="h-4 w-4" />,
    };
    return icons[type];
  };

  const getSeverityBadge = (severity: AnomalyEvent['severity']) => {
    const variants: Record<AnomalyEvent['severity'], 'info' | 'warning' | 'threat'> = {
      low: 'info',
      medium: 'warning',
      high: 'threat',
      critical: 'threat',
    };
    return (
      <Badge variant={variants[severity]} className={cn(severity === 'critical' && 'animate-pulse')}>
        {severity}
      </Badge>
    );
  };

  const getSeverityIcon = (severity: AnomalyEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-threat" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-threat" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="metric-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Anomaly Timeline
        </h3>
        <p className="text-sm text-muted-foreground">Recent security events</p>
      </div>

      <div className="relative space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />

        {events.map((event, index) => (
          <div
            key={event.id}
            className={cn(
              'relative pl-8 animate-slide-up',
              index === 0 && 'opacity-100',
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Timeline dot */}
            <div
              className={cn(
                'absolute left-0 top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center',
                'bg-card transition-transform hover:scale-110',
                event.severity === 'critical' || event.severity === 'high'
                  ? 'border-threat'
                  : event.severity === 'medium'
                  ? 'border-warning'
                  : 'border-primary'
              )}
            >
              {getTypeIcon(event.type)}
            </div>

            <div
              className={cn(
                'rounded-lg border border-border bg-secondary/20 p-3 transition-all duration-200',
                'hover:border-primary/30 hover:bg-secondary/40',
                event.severity === 'critical' && 'border-threat/30 bg-threat/5'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(event.severity)}
                  <span className="font-semibold">{event.type.replace('_', ' ')}</span>
                  {getSeverityBadge(event.severity)}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Endpoint: </span>
                  <code className="font-mono text-primary">{event.endpoint}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Source: </span>
                  <code className="font-mono">{event.sourceIp}</code>
                </div>
              </div>

              <div className="mt-3 p-2 rounded bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Recommendation:</p>
                <p className="text-sm">{event.recommendation}</p>
              </div>

              {event.collateralDamage && event.collateralDamage.legitimateTrafficPercent > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  <span>
                    {event.collateralDamage.legitimateTrafficPercent}% legitimate traffic may be affected
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
