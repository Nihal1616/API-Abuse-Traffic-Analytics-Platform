import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/Header';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ThreatActorsList } from '@/components/dashboard/ThreatActorsList';
import { EndpointsList } from '@/components/dashboard/EndpointsList';
import { AnomalyTimeline } from '@/components/dashboard/AnomalyTimeline';
import { ActionRecommendations } from '@/components/dashboard/ActionRecommendations';
import { ThreatActor, ActionRecommendation, TimeSeriesData, AnomalyEvent, Endpoint } from '@/types/security';
import { securityApi } from '@/services/api';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [threatActors, setThreatActors] = useState<ThreatActor[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [recommendations, setRecommendations] = useState<ActionRecommendation[]>([]);

  const criticalAlerts = anomalies.filter(
    (a) => a.severity === 'critical' || a.severity === 'high'
  ).length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trafficData, anomaliesData, actorsData, endpointsData, recommendationsData] = await Promise.all([
          securityApi.getTrafficData(24),
          securityApi.getAnomalies(50),
          securityApi.getThreatActors(20),
          securityApi.getEndpoints(20),
          securityApi.getActionRecommendations(10)
        ]);

        setTimeSeriesData(trafficData);
        setAnomalies(anomaliesData);
        setThreatActors(actorsData);
        setEndpoints(endpointsData);
        setRecommendations(recommendationsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Keep empty arrays for now
      }
    };

    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [trafficData, anomaliesData, actorsData, endpointsData, recommendationsData] = await Promise.all([
        securityApi.getTrafficData(24),
        securityApi.getAnomalies(50),
        securityApi.getThreatActors(20),
        securityApi.getEndpoints(20),
        securityApi.getActionRecommendations(10)
      ]);

      setTimeSeriesData(trafficData);
      setAnomalies(anomaliesData);
      setThreatActors(actorsData);
      setEndpoints(endpointsData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
    setIsRefreshing(false);
  };

  const handleBlockActor = (actor: ThreatActor) => {
    console.log('Block actor:', actor);
  };

  const handleMonitorActor = (actor: ThreatActor) => {
    console.log('Monitor actor:', actor);
  };

  const handleApplyAction = (recommendation: ActionRecommendation) => {
    console.log('Apply action:', recommendation);
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
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-semibold text-red-700">
                  {criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''} Detected
                </p>
                <p className="text-sm text-red-600">
                  Immediate attention required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
          <MetricCard
            title="Total Requests"
            value={timeSeriesData.reduce((sum, d) => sum + d.requests, 0) || 0}
            subtitle="Last 24 hours"
            icon={<Activity className="h-5 w-5" />}
          />
          <MetricCard
            title="Blocked Requests"
            value={timeSeriesData.reduce((sum, d) => sum + d.blocked, 0) || 0}
            subtitle="Protected"
            icon={<Ban className="h-5 w-5" />}
            variant="threat"
          />
          <MetricCard
            title="Anomalies Detected"
            value={anomalies.length}
            subtitle="Active threats"
            icon={<ShieldAlert className="h-5 w-5" />}
            variant="warning"
          />
          <MetricCard
            title="Unique IPs"
            value={threatActors.length}
            subtitle="Monitored"
            icon={<Users className="h-5 w-5" />}
          />
          <MetricCard
            title="Endpoints"
            value={endpoints.length}
            subtitle="Protected"
            icon={<Zap className="h-5 w-5" />}
            variant="success"
          />
          <MetricCard
            title="Recommendations"
            value={recommendations.length}
            subtitle="Available"
            icon={<Clock className="h-5 w-5" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ThreatActorsList
            actors={threatActors}
            onBlock={handleBlockActor}
            onMonitor={handleMonitorActor}
          />
          <AnomalyTimeline events={anomalies} />
        </div>

        {/* Endpoints Section */}
        <div className="mt-6">
          <EndpointsList endpoints={endpoints} />
        </div>

        {/* Action Recommendations */}
        <div className="mt-6">
          <ActionRecommendations
            recommendations={recommendations}
            onApply={handleApplyAction}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
