import { Shield, Bell, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  criticalAlerts: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({ criticalAlerts, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Shield className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  API<span className="text-primary">Shield</span>
                </h1>
                <p className="text-xs text-muted-foreground">Security & Observability</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 ml-8">
              <Badge variant="success" className="font-mono">
                <span className="status-pulse bg-success mr-2" />
                LIVE
              </Badge>
              <span className="text-sm text-muted-foreground">
                Last sync: <span className="font-mono">2s ago</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <div className="relative">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              {criticalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-threat text-xs font-bold text-threat-foreground">
                  {criticalAlerts}
                </span>
              )}
            </div>

            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
