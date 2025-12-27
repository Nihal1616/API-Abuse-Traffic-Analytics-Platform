export interface TimeSeriesData {
  timestamp: Date | string;
  requests: number;
  blocked: number;
  anomalies: number;
  responseTime?: number;
  avgResponseTime?: number;
  maxResponseTime?: number;
  minResponseTime?: number;
}

export interface AnomalyEvent {
  id: string;
  type:
    | "rate_spike"
    | "pattern_anomaly"
    | "geo_anomaly"
    | "credential_stuffing"
    | "scraping"
    | "ddos"
    | "behavior_anomaly"
    | "response_time_anomaly"
    | "error_rate_spike";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  timestamp: Date | string;
  endpoint?: string;
  sourceIp: string;
  recommendation?: string;
  confidence?: number;
  collateralDamage?: {
    legitimateTrafficPercent: number;
    affectedUsers: number;
    estimatedDamage?: string;
  };
  status?: "detected" | "investigating" | "resolved" | "false_positive";
  priority?: "low" | "medium" | "high" | "critical";
  resolvedAt?: Date | string;
  threatActorId?: string;
  threatActor?: {
    ipAddress: string;
    threatScore: number;
    countryCode: string;
  };
}

export interface ActionRecommendation {
  id: string;
  action:
    | "block"
    | "throttle"
    | "challenge"
    | "monitor"
    | "whitelist"
    | "alert";
  targetType: "ip" | "endpoint" | "user" | "country" | "asn" | "user_agent";
  target: string;
  reason: string;
  confidence: number;
  priority: "low" | "medium" | "high" | "critical";
  estimatedImpact?: string;
  collateralDamage: {
    affectedUsers: number;
    affectedRequests: number;
    legitimateTrafficPercent: number;
    businessImpact: "none" | "low" | "medium" | "high" | "critical";
  };
  source?: "ai" | "rule" | "manual" | "analyst";
  status?: "pending" | "applied" | "rejected" | "expired" | "scheduled";
  appliedAt?: Date | string;
  appliedBy?: {
    name: string;
    email: string;
  };
}

export interface ThreatActor {
  id: string;
  ipAddress: string;
  countryCode?: string;
  countryName?: string;
  threatScore: number;
  status: "active" | "blocked" | "monitoring" | "whitelisted" | "investigating";
  requestCount: number;
  blockedCount: number;
  attackTypes: string[];
  firstSeen: Date | string;
  lastSeen: Date | string;
  reputation?: "unknown" | "suspicious" | "malicious" | "trusted" | "neutral";
  tags?: string[];
  blockRate?: number;
  errorRate?: number;
}

export interface Endpoint {
  id: string;
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  requestsPerMinute?: number;
  avgResponseTime: number;
  errorRate: number;
  anomalyScore?: number;
  isUnderAttack?: boolean;
  topAbusers?: string[];
  lastUpdated?: Date | string;
  requestCount?: number;
  errorCount?: number;
  blockedCount?: number;
  uniqueIPCount?: number;
}

export interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  anomalousRequests: number;
  avgResponseTime: number;
  uniqueIps: number;
  requestsPerSecond: number;
  errorRate: number;
  blockRate: number;
  threatActorsDetected: number;
  endpointsProtected: number;
  uptime: number;
  dataProcessedGB: number;
}

export interface ApiLog {
  id: string;
  timestamp: Date | string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  countryCode?: string;
  userAgent?: string;
  isBlocked: boolean;
  threatScore: number;
  anomalyScore: number;
}
