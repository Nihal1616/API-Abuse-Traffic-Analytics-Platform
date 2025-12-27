import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/Header';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TrafficChart } from '@/components/dashboard/TrafficChart';
import { ThreatActorsList } from '@/components/dashboard/ThreatActorsList';
import { EndpointsList } from '@/components/dashboard/EndpointsList';
import { AnomalyTimeline } from '@/components/dashboard/AnomalyTimeline';
import { ActionRecommendations } from '@/components/dashboard/ActionRecommendations';
import { 
  mockThreatActors, 
  mockEndpoints, 
  mockAnomalies, 
  mockRecommendations,
  mockMetrics,
  generateTimeSeriesData 
} from '@/data/mockData';
import { ThreatActor, ActionRecommendation } from '@/types/security';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  ShieldAlert, 
  Ban, 
  Clock, 
  Users, 
  Zap,
  AlertTriangle
} from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState(generateTimeSeriesData());
  const [metrics, setMetrics] = useState(mockMetrics);

  const criticalAlerts = mockAnomalies.filter(
    (a) => a.severity === 'critical' || a.severity === 'high'
  ).length;

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 100),
        blockedRequests: prev.blockedRequests + Math.floor(Math.random() * 10),
        requestsPerSecond: 800 + Math.floor(Math.random() * 100),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setTimeSeriesData(generateTimeSeriesData());
    setIsRefreshing(false);
    toast({
      title: 'Dashboard refreshed',
      description: 'All data has been updated.',
    });
  };

  const handleBlockActor = (actor: ThreatActor) => {
    toast({
      title: 'IP Blocked',
      description: `${actor.ip} has been added to the blocklist.`,
      variant: 'destructive',
    });
  };

  const handleMonitorActor = (actor: ThreatActor) => {
    toast({
      title: 'Monitoring enabled',
      description: `${actor.ip} is now being monitored.`,
    });
  };

  const handleApplyAction = (recommendation: ActionRecommendation) => {
    toast({
      title: `Action applied: ${recommendation.action}`,
      description: `${recommendation.action} has been applied to ${recommendation.target}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        criticalAlerts={criticalAlerts}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="container mx-auto px-4 py-6">
        {/* Critical Alert Banner */}
        {criticalAlerts > 0 && (
          <div className="mb-6 rounded-lg border border-threat/30 bg-threat/10 p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-threat animate-pulse" />
              <div>
                <p className="font-semibold text-threat">
                  {criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''} Detected
                </p>
                <p className="text-sm text-muted-foreground">
                  Immediate attention required. Active credential stuffing attack in progress.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="data-grid mb-6">
          <MetricCard
            title="Total Requests"
            value={metrics.totalRequests}
            subtitle="Last 24 hours"
            icon={<Activity className="h-5 w-5" />}
            trend={{ value: 12.5, direction: 'up', isGood: true }}
          />
          <MetricCard
            title="Blocked Requests"
            value={metrics.blockedRequests}
            subtitle="3.1% of total"
            icon={<Ban className="h-5 w-5" />}
            trend={{ value: 45.2, direction: 'up', isGood: false }}
            variant="threat"
          />
          <MetricCard
            title="Anomalies Detected"
            value={metrics.anomalousRequests}
            subtitle="0.4% of total"
            icon={<ShieldAlert className="h-5 w-5" />}
            trend={{ value: 23.1, direction: 'up', isGood: false }}
            variant="warning"
          />
          <MetricCard
            title="Avg Response Time"
            value={`${metrics.avgResponseTime}ms`}
            subtitle="P95: 342ms"
            icon={<Clock className="h-5 w-5" />}
            trend={{ value: 8.3, direction: 'down', isGood: true }}
          />
          <MetricCard
            title="Unique IPs"
            value={metrics.uniqueIps}
            subtitle="Active in last hour"
            icon={<Users className="h-5 w-5" />}
            trend={{ value: 5.7, direction: 'up', isGood: true }}
          />
          <MetricCard
            title="Requests/Second"
            value={metrics.requestsPerSecond}
            subtitle="Current rate"
            icon={<Zap className="h-5 w-5" />}
            trend={{ value: 2.1, direction: 'neutral' }}
            variant="success"
          />
        </div>

        {/* Traffic Chart */}
        <div className="mb-6">
          <TrafficChart data={timeSeriesData} />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ThreatActorsList
            actors={mockThreatActors}
            onBlock={handleBlockActor}
            onMonitor={handleMonitorActor}
          />
          <AnomalyTimeline events={mockAnomalies} />
        </div>

        {/* Endpoints Section */}
        <div className="mt-6">
          <EndpointsList endpoints={mockEndpoints} />
        </div>

        {/* Action Recommendations */}
        <div className="mt-6">
          <ActionRecommendations
            recommendations={mockRecommendations}
            onApply={handleApplyAction}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            APIShield v1.0.0 • Powered by NGINX • MongoDB • Node.js • Docker
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
