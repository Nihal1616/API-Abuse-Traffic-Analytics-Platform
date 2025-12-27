import { ThreatActor } from '@/types/security';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Shield, ShieldAlert, Eye, Ban, Clock, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ThreatActorsListProps {
  actors: ThreatActor[];
  onBlock?: (actor: ThreatActor) => void;
  onMonitor?: (actor: ThreatActor) => void;
}

export function ThreatActorsList({ actors, onBlock, onMonitor }: ThreatActorsListProps) {
  const getStatusBadge = (status: ThreatActor['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="threat">Active Threat</Badge>;
      case 'blocked':
        return <Badge variant="success">Blocked</Badge>;
      case 'monitoring':
        return <Badge variant="warning">Monitoring</Badge>;
    }
  };

  const getThreatScoreColor = (score: number) => {
    if (score >= 90) return 'text-threat';
    if (score >= 70) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className="metric-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-threat" />
            Top Threat Actors
          </h3>
          <p className="text-sm text-muted-foreground">Active abusers requiring attention</p>
        </div>
        <Badge variant="info">{actors.length} detected</Badge>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
        {actors.map((actor, index) => (
          <div
            key={actor.id}
            className={cn(
              'group relative rounded-lg border border-border bg-secondary/30 p-4 transition-all duration-200',
              'hover:border-primary/30 hover:bg-secondary/50',
              index === 0 && 'border-threat/30 bg-threat/5'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <code className="font-mono text-sm font-semibold text-foreground">
                    {actor.ip}
                  </code>
                  {getStatusBadge(actor.status)}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {actor.country}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requests</p>
                    <p className="font-mono font-semibold">
                      {actor.requestCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Blocked</p>
                    <p className="font-mono font-semibold text-threat">
                      {actor.blockedCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last seen</p>
                    <p className="font-mono text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(actor.lastSeen, { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {actor.attackTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Threat Score
                  </p>
                  <p
                    className={cn(
                      'text-2xl font-bold font-mono',
                      getThreatScoreColor(actor.threatScore)
                    )}
                  >
                    {actor.threatScore}
                  </p>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {actor.status !== 'blocked' && (
                    <Button
                      size="sm"
                      variant="threat"
                      onClick={() => onBlock?.(actor)}
                    >
                      <Ban className="h-3 w-3" />
                      Block
                    </Button>
                  )}
                  {actor.status !== 'monitoring' && actor.status !== 'blocked' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMonitor?.(actor)}
                    >
                      <Eye className="h-3 w-3" />
                      Monitor
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {actor.status === 'active' && actor.threatScore >= 90 && (
              <div className="absolute top-2 right-2">
                <span className="status-pulse bg-threat">
                  <span className="status-pulse bg-threat absolute" />
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
