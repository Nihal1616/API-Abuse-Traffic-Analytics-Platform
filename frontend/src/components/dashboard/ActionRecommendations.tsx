import { ActionRecommendation } from '@/types/security';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Ban, 
  Gauge, 
  ShieldQuestion, 
  Eye, 
  CheckCircle,
  AlertTriangle,
  Users,
  Zap
} from 'lucide-react';

interface ActionRecommendationsProps {
  recommendations: ActionRecommendation[];
  onApply?: (recommendation: ActionRecommendation) => void;
}

export function ActionRecommendations({ recommendations, onApply }: ActionRecommendationsProps) {
  const getActionIcon = (action: ActionRecommendation['action']) => {
    const icons = {
      block: <Ban className="h-4 w-4" />,
      throttle: <Gauge className="h-4 w-4" />,
      challenge: <ShieldQuestion className="h-4 w-4" />,
      monitor: <Eye className="h-4 w-4" />,
      whitelist: <CheckCircle className="h-4 w-4" />,
    };
    return icons[action];
  };

  const getActionColor = (action: ActionRecommendation['action']) => {
    const colors = {
      block: 'border-threat/30 bg-threat/10 text-threat hover:bg-threat/20',
      throttle: 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/20',
      challenge: 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20',
      monitor: 'border-muted-foreground/30 bg-muted/50 text-muted-foreground hover:bg-muted',
      whitelist: 'border-success/30 bg-success/10 text-success hover:bg-success/20',
    };
    return colors[action];
  };

  return (
    <div className="metric-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShieldQuestion className="h-5 w-5 text-primary" />
          Recommended Actions
        </h3>
        <p className="text-sm text-muted-foreground">AI-powered mitigation suggestions</p>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div
            key={rec.id}
            className={cn(
              'rounded-lg border border-border p-4 transition-all duration-200 animate-slide-up',
              'hover:border-primary/30'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-3 py-1.5 font-semibold uppercase text-xs transition-colors',
                    getActionColor(rec.action)
                  )}
                >
                  {getActionIcon(rec.action)}
                  {rec.action}
                </div>
                <code className="font-mono text-sm bg-secondary px-2 py-1 rounded">
                  {rec.target}
                </code>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="font-mono font-bold text-primary">{rec.confidence}%</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>

            {/* Collateral Damage Analysis */}
            <div className="rounded-lg bg-secondary/50 border border-border p-3 mb-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                COLLATERAL DAMAGE ANALYSIS
              </p>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Affected Users
                  </p>
                  <p className={cn(
                    'font-mono font-semibold',
                    rec.collateralDamage.affectedUsers > 100 ? 'text-warning' : 'text-foreground'
                  )}>
                    {rec.collateralDamage.affectedUsers.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Requests
                  </p>
                  <p className="font-mono font-semibold">
                    {rec.collateralDamage.affectedRequests.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Legit Traffic</p>
                  <p className={cn(
                    'font-mono font-semibold',
                    rec.collateralDamage.legitimateTrafficPercent > 20 ? 'text-threat' : 
                    rec.collateralDamage.legitimateTrafficPercent > 5 ? 'text-warning' : 'text-success'
                  )}>
                    {rec.collateralDamage.legitimateTrafficPercent}%
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Legitimate traffic risk</span>
                  <span className={cn(
                    'font-mono',
                    rec.collateralDamage.legitimateTrafficPercent > 20 ? 'text-threat' : 
                    rec.collateralDamage.legitimateTrafficPercent > 5 ? 'text-warning' : 'text-success'
                  )}>
                    {rec.collateralDamage.legitimateTrafficPercent}%
                  </span>
                </div>
                <Progress 
                  value={rec.collateralDamage.legitimateTrafficPercent} 
                  className="h-1.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground italic">
                {rec.estimatedImpact}
              </p>
              <Button
                size="sm"
                variant={rec.action === 'block' ? 'threat' : 'default'}
                onClick={() => onApply?.(rec)}
              >
                Apply {rec.action}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
