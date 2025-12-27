import axios from "axios";
import { io, Socket } from "socket.io-client";
import {
  TimeSeriesData,
  AnomalyEvent,
  ActionRecommendation,
  ThreatActor,
  Endpoint,
  SecurityMetrics,
  ApiLog,
} from "@/types/security";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Socket.IO connection
let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Security API
export const securityApi = {
  // Traffic data
  getTrafficData: async (hours: number = 24): Promise<TimeSeriesData[]> => {
    const response = await api.get(`/security/traffic?hours=${hours}`);
    return response.data.data;
  },

  // Anomalies
  getAnomalies: async (
    limit: number = 50,
    severity?: string,
    type?: string
  ): Promise<AnomalyEvent[]> => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (severity) params.append("severity", severity);
    if (type) params.append("type", type);

    const response = await api.get(`/security/anomalies?${params.toString()}`);
    return response.data.data;
  },

  getLatestAnomalies: async (limit: number = 10): Promise<AnomalyEvent[]> => {
    const response = await api.get(`/security/anomalies/latest?limit=${limit}`);
    return response.data.data;
  },

  // Threat actors
  getThreatActors: async (
    limit: number = 20,
    status?: string,
    minScore?: number
  ): Promise<ThreatActor[]> => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (status) params.append("status", status);
    if (minScore) params.append("minScore", minScore.toString());

    const response = await api.get(
      `/security/threat-actors?${params.toString()}`
    );
    return response.data.data;
  },

  getTopThreatActors: async (limit: number = 10): Promise<ThreatActor[]> => {
    const response = await api.get(
      `/security/threat-actors/top?limit=${limit}`
    );
    return response.data.data;
  },

  // Endpoints
  getEndpoints: async (): Promise<Endpoint[]> => {
    const response = await api.get("/security/endpoints");
    return response.data.data;
  },

  // Action recommendations
  getActionRecommendations: async (
    limit: number = 5,
    minConfidence: number = 50
  ): Promise<ActionRecommendation[]> => {
    const response = await api.get(
      `/security/recommendations?limit=${limit}&minConfidence=${minConfidence}`
    );
    return response.data.data;
  },

  // Security actions
  blockThreatActor: async (
    ip: string,
    reason: string,
    duration: string = "24h"
  ): Promise<any> => {
    const response = await api.post("/security/actions/block", {
      ip,
      reason,
      duration,
    });
    return response.data;
  },

  throttleTraffic: async (
    endpoint: string,
    rateLimit: number,
    duration: string = "1h"
  ): Promise<any> => {
    const response = await api.post("/security/actions/throttle", {
      endpoint,
      rateLimit,
      duration,
    });
    return response.data;
  },

  applyRecommendation: async (
    recommendationId: string,
    action: string,
    target: string
  ): Promise<any> => {
    const response = await api.post("/security/actions/apply", {
      recommendationId,
      action,
      target,
    });
    return response.data;
  },

  // Security analytics
  getSecuritySummary: async (timeRange: string = "24h"): Promise<any> => {
    const response = await api.get(
      `/security/analytics/summary?range=${timeRange}`
    );
    return response.data.data;
  },

  getSecurityTimeline: async (limit: number = 100): Promise<any[]> => {
    const response = await api.get(
      `/security/analytics/timeline?limit=${limit}`
    );
    return response.data.data;
  },
};

// Metrics API
export const metricsApi = {
  // Dashboard metrics
  getDashboardMetrics: async (): Promise<any> => {
    const response = await api.get("/metrics/dashboard");
    return response.data.data;
  },

  getOverviewMetrics: async (): Promise<any> => {
    const response = await api.get("/metrics/overview");
    return response.data.data;
  },

  getMetricsSummary: async (): Promise<any> => {
    const response = await api.get("/metrics/summary");
    return response.data.data;
  },

  // Time series data
  getTimeSeriesData: async (
    hours: number = 24,
    interval: string = "hour",
    metric: string = "requests"
  ): Promise<any[]> => {
    const response = await api.get(
      `/metrics/timeseries?hours=${hours}&interval=${interval}&metric=${metric}`
    );
    return response.data.data;
  },

  getRealTimeMetrics: async (): Promise<any> => {
    const response = await api.get("/metrics/timeseries/realtime");
    return response.data.data;
  },

  getHistoricalData: async (days: number = 30): Promise<any[]> => {
    const response = await api.get(
      `/metrics/timeseries/historical?days=${days}`
    );
    return response.data.data;
  },

  // Performance metrics
  getPerformanceMetrics: async (): Promise<any> => {
    const response = await api.get("/metrics/performance");
    return response.data.data;
  },

  getEndpointPerformance: async (): Promise<any[]> => {
    const response = await api.get("/metrics/performance/endpoints");
    return response.data.data;
  },

  // Security metrics
  getSecurityMetrics: async (): Promise<any> => {
    const response = await api.get("/metrics/security");
    return response.data.data;
  },

  getBlockedRequests: async (hours: number = 24): Promise<any[]> => {
    const response = await api.get(`/metrics/security/blocked?hours=${hours}`);
    return response.data.data;
  },

  getThreatMetrics: async (): Promise<any> => {
    const response = await api.get("/metrics/security/threats");
    return response.data.data;
  },
};

// Admin API (if needed)
export const adminApi = {
  login: async (email: string, password: string): Promise<any> => {
    const response = await api.post("/admin/login", { email, password });
    return response.data;
  },

  getSystemHealth: async (): Promise<any> => {
    const response = await api.get("/admin/system/health");
    return response.data.data;
  },

  getSystemStats: async (): Promise<any> => {
    const response = await api.get("/admin/system/stats");
    return response.data.data;
  },
};

// Real-time event types
export type RealTimeEvent = {
  type:
    | "new_anomaly"
    | "threat_detected"
    | "ip_blocked"
    | "traffic_spike"
    | "system_alert";
  data: any;
  timestamp: string;
};

// Socket.IO event handlers
export const setupSocketListeners = (
  onNewAnomaly: (anomaly: AnomalyEvent) => void,
  onThreatDetected: (threat: ThreatActor) => void,
  onIpBlocked: (data: any) => void,
  onTrafficUpdate: (data: any) => void,
  onSystemAlert: (alert: any) => void
): Socket => {
  const socket = connectSocket();

  socket.on("connect", () => {
    console.log("Connected to WebSocket server");

    // Subscribe to channels
    socket.emit("subscribe", "anomalies");
    socket.emit("subscribe", "threats");
    socket.emit("subscribe", "blocks");
    socket.emit("subscribe", "traffic");
    socket.emit("subscribe", "alerts");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket server");
  });

  socket.on("connect_error", (error) => {
    console.error("WebSocket connection error:", error);
  });

  // Event handlers
  socket.on("new_anomaly", (data: any) => {
    onNewAnomaly(data.data);
  });

  socket.on("threat_detected", (data: any) => {
    onThreatDetected(data.data);
  });

  socket.on("ip_blocked", (data: any) => {
    onIpBlocked(data);
  });

  socket.on("traffic_update", (data: any) => {
    onTrafficUpdate(data);
  });

  socket.on("system_alert", (data: any) => {
    onSystemAlert(data);
  });

  return socket;
};

export default api;
