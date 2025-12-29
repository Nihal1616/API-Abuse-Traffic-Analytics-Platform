//frontend/src/components/dashboard/MetricCard.tsx

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    isGood?: boolean;
  };
  variant?: 'default' | 'threat' | 'success' | 'warning';
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: 'border-border',
    threat: 'border-threat/30 bg-threat/5',
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
  };

  const trendColor = trend
    ? trend.isGood
      ? 'text-success'
      : trend.direction === 'neutral'
      ? 'text-muted-foreground'
      : 'text-threat'
    : '';

  const TrendIcon = trend?.direction === 'up' 
    ? TrendingUp 
    : trend?.direction === 'down' 
    ? TrendingDown 
    : Minus;

  return (
    <div
      className={cn(
        'metric-card group transition-all duration-300 hover:border-primary/30',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold font-mono tracking-tight glow-text">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-primary/10 p-2 text-primary transition-transform group-hover:scale-110">
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className={cn('mt-3 flex items-center gap-1 text-sm', trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span className="font-mono">{trend.value}%</span>
          <span className="text-muted-foreground">vs last hour</span>
        </div>
      )}
    </div>
  );
}
