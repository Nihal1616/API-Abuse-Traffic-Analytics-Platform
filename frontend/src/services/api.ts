import axios from "axios";
import { io, Socket } from "socket.io-client";
import {
  TimeSeriesData,
  AnomalyEvent,
  ActionRecommendation,
  ThreatActor,
  Endpoint,
} from "@/types/security";

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Socket.IO
let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

// ---------------- Security API ----------------

export const securityApi = {
  getTrafficData: async (hours = 24): Promise<TimeSeriesData[]> => {
    const r = await api.get(`/security/traffic?hours=${hours}`);
    return r.data.data;
  },

  getLatestAnomalies: async (limit = 10): Promise<AnomalyEvent[]> => {
    const r = await api.get(`/security/anomalies/latest?limit=${limit}`);
    return r.data.data;
  },

  getThreatActors: async (limit = 20): Promise<ThreatActor[]> => {
    const r = await api.get(`/security/threat-actors?limit=${limit}`);
    return r.data.data;
  },

  blockThreatActor: async (ip: string, reason: string, duration = "24h") => {
    return api.post("/security/actions/block", { ip, reason, duration });
  },

  applyRecommendation: async (
    recommendationId: string,
    action: string,
    target: string
  ) => {
    return api.post("/security/actions/apply", {
      recommendationId,
      action,
      target,
    });
  },
};

// ---------------- Metrics API ----------------

export const metricsApi = {
  getDashboardMetrics: async () => {
    const r = await api.get("/metrics/dashboard");
    return r.data.data;
  },
};

// ---------------- Socket Events ----------------

export const setupSocketListeners = (
  onNewAnomaly: (a: AnomalyEvent) => void,
  onMetricsUpdate: (m: any) => void
) => {
  const s = connectSocket();

  s.on("new_anomaly", (payload) => onNewAnomaly(payload.data));
  s.on("metrics_update", onMetricsUpdate);

  return s;
};

export default api;
