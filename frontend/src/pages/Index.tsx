import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/dashboard/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TrafficChart } from "@/components/dashboard/TrafficChart";
import { ThreatActorsList } from "@/components/dashboard/ThreatActorsList";
import { EndpointsList } from "@/components/dashboard/EndpointsList";
import { AnomalyTimeline } from "@/components/dashboard/AnomalyTimeline";
import { ActionRecommendations } from "@/components/dashboard/ActionRecommendations";
import { mockRecommendations } from "@/data/mockData";
import {
  ThreatActor,
  ActionRecommendation,
  AnomalyEvent,
  TimeSeriesData,
  SecurityMetrics,
  Endpoint,
} from "@/types/security";
import { useToast } from "@/hooks/use-toast";
import { securityApi, connectSocket, metricsApi } from "@/services/api";
import {
  Activity,
  ShieldAlert,
  Ban,
  Clock,
  Users,
  Zap,
  AlertTriangle,
} from "lucide-react";

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 5000
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries <= 0) throw err;

    if (err?.response?.status === 429) {
      await new Promise((r) => setTimeout(r, 10000));
    } else {
      await new Promise((r) => setTimeout(r, delay));
    }

    return fetchWithRetry(fn, retries - 1, delay);
  }
}

const Index = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalRequests: 0,
    blockedRequests: 0,
    anomalousRequests: 0,
    avgResponseTime: 0,
    uniqueIps: 0,
    requestsPerSecond: 0,
    errorRate: 0,
    blockRate: 0,
    threatActorsDetected: 0,
    endpointsProtected: 0,
    uptime: 0,
    dataProcessedGB: 0,
  });
  const [threatActors, setThreatActors] = useState<ThreatActor[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);

  const criticalAlerts = useMemo(
    () =>
      anomalies.filter(
        (a) => a.severity === "critical" || a.severity === "high"
      ).length,
    [anomalies]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trafficData, threatData, anomalyData, dashboardMetrics] =
          await Promise.all([
            fetchWithRetry(() => securityApi.getTrafficData(24)),
            fetchWithRetry(() => securityApi.getThreatActors(10)),
            fetchWithRetry(() => securityApi.getLatestAnomalies(20)),
            fetchWithRetry(() => metricsApi.getDashboardMetrics()),
          ]);

        setTimeSeriesData(trafficData);
        setThreatActors(threatData);
        setAnomalies(anomalyData);

        setMetrics({
          totalRequests: dashboardMetrics.summary.totalRequests,
          blockedRequests: dashboardMetrics.summary.blockedRequests,
          anomalousRequests: dashboardMetrics.summary.anomalyCount,
          avgResponseTime: dashboardMetrics.summary.avgResponseTime,
          uniqueIps: dashboardMetrics.summary.uniqueIps || 0,
          requestsPerSecond: dashboardMetrics.summary.requestsPerSecond || 0,
          errorRate: dashboardMetrics.summary.errorRate,
          blockRate: dashboardMetrics.summary.blockRate || 0,
          threatActorsDetected: dashboardMetrics.summary.threatActorsDetected,
          endpointsProtected: dashboardMetrics.summary.endpointsProtected || 0,
          uptime: dashboardMetrics.summary.uptime,
          dataProcessedGB: dashboardMetrics.summary.dataProcessedGB,
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Starting backend...",
          description: "This may take up to 1 minute on first load.",
        });
      }
    };

    fetchData();

    const socket = connectSocket();

    socket.on("anomaly", (newAnomaly: AnomalyEvent) => {
      setAnomalies((prev) => [newAnomaly, ...prev.slice(0, 19)]);
      toast({
        title: "New Anomaly Detected",
        description: `${newAnomaly.type} anomaly from ${newAnomaly.sourceIp}`,
        variant: "destructive",
      });
    });

    socket.on("metrics_update", (updatedMetrics: any) => {
      setMetrics((prev) => ({
        ...prev,
        totalRequests: updatedMetrics.totalRequests,
        blockedRequests: updatedMetrics.blockedRequests,
        avgResponseTime: updatedMetrics.avgResponseTime,
      }));
    });

    socket.on("threat-update", (updatedThreat: ThreatActor) => {
      setThreatActors((prev) =>
        prev.map((t) => (t.id === updatedThreat.id ? updatedThreat : t))
      );
    });

    return () => {
      socket.off("anomaly");
      socket.off("metrics_update");
      socket.off("threat-update");
    };
  }, [toast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [trafficData, threatData, anomalyData, dashboardMetrics] =
        await Promise.all([
          fetchWithRetry(() => securityApi.getTrafficData(24), 3, 3000),
          fetchWithRetry(() => securityApi.getThreatActors(10), 3, 3000),
          fetchWithRetry(() => securityApi.getLatestAnomalies(20), 3, 3000),
          fetchWithRetry(() => metricsApi.getDashboardMetrics(), 3, 3000),
        ]);

      setTimeSeriesData(trafficData);
      setThreatActors(threatData);
      setAnomalies(anomalyData);

      setMetrics({
        totalRequests: dashboardMetrics.summary.totalRequests,
        blockedRequests: dashboardMetrics.summary.blockedRequests,
        anomalousRequests: dashboardMetrics.summary.anomalyCount,
        avgResponseTime: dashboardMetrics.summary.avgResponseTime,
        uniqueIps: dashboardMetrics.summary.uniqueIps || 0,
        requestsPerSecond: dashboardMetrics.summary.requestsPerSecond || 0,
        errorRate: dashboardMetrics.summary.errorRate,
        blockRate: dashboardMetrics.summary.blockRate || 0,
        threatActorsDetected: dashboardMetrics.summary.threatActorsDetected,
        endpointsProtected: dashboardMetrics.summary.endpointsProtected || 0,
        uptime: dashboardMetrics.summary.uptime,
        dataProcessedGB: dashboardMetrics.summary.dataProcessedGB,
      });

      toast({
        title: "Dashboard refreshed",
        description: "All data has been updated.",
      });
    } catch {
      toast({
        title: "Refresh failed",
        description: "Failed to update dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBlockActor = (actor: ThreatActor) => {
    toast({
      title: "IP Blocked",
      description: `${actor.ipAddress} has been added to the blocklist.`,
      variant: "destructive",
    });
  };

  const handleMonitorActor = (actor: ThreatActor) => {
    toast({
      title: "Monitoring enabled",
      description: `${actor.ipAddress} is now being monitored.`,
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
        {criticalAlerts > 0 && (
          <div className="mb-6 rounded-lg border border-threat/30 bg-threat/10 p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-threat animate-pulse" />
              <div>
                <p className="font-semibold text-threat">
                  {criticalAlerts} Critical Alert
                  {criticalAlerts > 1 ? "s" : ""} Detected
                </p>
                <p className="text-sm text-muted-foreground">
                  Immediate attention required.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="data-grid mb-6">
          <MetricCard title="Total Requests" value={metrics.totalRequests} icon={<Activity className="h-5 w-5" />} />
          <MetricCard title="Blocked Requests" value={metrics.blockedRequests} icon={<Ban className="h-5 w-5" />} variant="threat" />
          <MetricCard title="Anomalies Detected" value={metrics.anomalousRequests} icon={<ShieldAlert className="h-5 w-5" />} variant="warning" />
          <MetricCard title="Avg Response Time" value={`${metrics.avgResponseTime}ms`} icon={<Clock className="h-5 w-5" />} />
          <MetricCard title="Unique IPs" value={metrics.uniqueIps} icon={<Users className="h-5 w-5" />} />
          <MetricCard title="Requests/Second" value={metrics.requestsPerSecond} icon={<Zap className="h-5 w-5" />} variant="success" />
        </div>

        <div className="mb-6">
          <TrafficChart data={timeSeriesData} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ThreatActorsList actors={threatActors} onBlock={handleBlockActor} onMonitor={handleMonitorActor} />
          <AnomalyTimeline events={anomalies} />
        </div>

        <div className="mt-6">
          <EndpointsList endpoints={endpoints} />
        </div>

        <div className="mt-6">
          <ActionRecommendations recommendations={mockRecommendations} onApply={handleApplyAction} />
        </div>
      </main>
    </div>
  );
};

export default Index;
