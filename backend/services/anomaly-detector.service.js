const logger = require("../utils/logger");
const { v4: uuidv4 } = require("uuid");
const { subMinutes } = require("date-fns");

class AnomalyDetectorService {
  constructor() {
    this.rules = [
      { name: "rate_spike", threshold: 500, timeWindow: 60 }, // requests per minute
      { name: "error_spike", threshold: 0.1, timeWindow: 60 }, // error rate
      { name: "geo_anomaly", threshold: 3, timeWindow: 300 }, // new countries
      { name: "credential_stuffing", threshold: 10, timeWindow: 60 }, // failed logins
      { name: "scraping", threshold: 100, timeWindow: 300 }, // requests per endpoint
      { name: "ddos", threshold: 1000, timeWindow: 60 }, // total requests
    ];

    this.anomalyHistory = new Map();
  }

  // Analyze request data for anomalies
  analyzeRequests(requests) {
    const anomalies = [];
    const now = new Date();

    // Group requests by time windows
    const timeWindows = this.createTimeWindows(requests, 60); // 60-second windows

    // Check each rule
    this.rules.forEach((rule) => {
      const ruleAnomalies = this.checkRule(rule, timeWindows, requests);
      anomalies.push(...ruleAnomalies);
    });

    // Check for pattern anomalies
    const patternAnomalies = this.detectPatternAnomalies(requests);
    anomalies.push(...patternAnomalies);

    // Deduplicate and return
    return this.deduplicateAnomalies(anomalies);
  }

  // Create time windows for analysis
  createTimeWindows(requests, windowSeconds) {
    const windows = new Map();
    const now = Date.now();

    requests.forEach((request) => {
      const windowStart =
        Math.floor(request.timestamp / (windowSeconds * 1000)) *
        windowSeconds *
        1000;
      const key = `window_${windowStart}`;

      if (!windows.has(key)) {
        windows.set(key, {
          startTime: new Date(windowStart),
          endTime: new Date(windowStart + windowSeconds * 1000),
          requests: [],
          stats: {
            total: 0,
            errors: 0,
            byEndpoint: new Map(),
            byCountry: new Map(),
            byIp: new Map(),
          },
        });
      }

      const window = windows.get(key);
      window.requests.push(request);
      window.stats.total++;

      if (request.statusCode >= 400) window.stats.errors++;

      // Count by endpoint
      const endpointCount = window.stats.byEndpoint.get(request.endpoint) || 0;
      window.stats.byEndpoint.set(request.endpoint, endpointCount + 1);

      // Count by country
      if (request.country) {
        const countryCount = window.stats.byCountry.get(request.country) || 0;
        window.stats.byCountry.set(request.country, countryCount + 1);
      }

      // Count by IP
      const ipCount = window.stats.byIp.get(request.ip) || 0;
      window.stats.byIp.set(request.ip, ipCount + 1);
    });

    return Array.from(windows.values());
  }

  // Check specific rule
  checkRule(rule, timeWindows, requests) {
    const anomalies = [];

    switch (rule.name) {
      case "rate_spike":
        timeWindows.forEach((window) => {
          const requestsPerSecond = window.stats.total / 60;
          if (requestsPerSecond > rule.threshold) {
            anomalies.push(
              this.createAnomaly(
                "rate_spike",
                "high",
                `High request rate detected: ${Math.round(
                  requestsPerSecond
                )} req/sec`,
                window.startTime,
                "/api/*",
                "multiple",
                rule
              )
            );
          }
        });
        break;

      case "error_spike":
        timeWindows.forEach((window) => {
          const errorRate = window.stats.errors / window.stats.total;
          if (errorRate > rule.threshold) {
            anomalies.push(
              this.createAnomaly(
                "pattern_anomaly",
                "medium",
                `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
                window.startTime,
                "/api/*",
                "multiple",
                rule
              )
            );
          }
        });
        break;

      case "geo_anomaly":
        timeWindows.forEach((window) => {
          if (window.stats.byCountry.size > rule.threshold) {
            anomalies.push(
              this.createAnomaly(
                "geo_anomaly",
                "medium",
                `Multiple countries detected: ${window.stats.byCountry.size} countries`,
                window.startTime,
                "/api/*",
                "multiple",
                rule
              )
            );
          }
        });
        break;

      case "credential_stuffing":
        // Check for multiple failed auth attempts from same IP
        const authFailures = requests.filter(
          (r) => r.endpoint.includes("/auth") && r.statusCode === 401
        );

        const failuresByIp = new Map();
        authFailures.forEach((failure) => {
          const count = failuresByIp.get(failure.ip) || 0;
          failuresByIp.set(failure.ip, count + 1);
        });

        failuresByIp.forEach((count, ip) => {
          if (count > rule.threshold) {
            anomalies.push(
              this.createAnomaly(
                "credential_stuffing",
                "high",
                `Credential stuffing detected from ${ip}: ${count} failed attempts`,
                new Date(),
                "/api/auth/login",
                ip,
                rule
              )
            );
          }
        });
        break;

      case "scraping":
        timeWindows.forEach((window) => {
          window.stats.byEndpoint.forEach((count, endpoint) => {
            if (count > rule.threshold) {
              anomalies.push(
                this.createAnomaly(
                  "scraping",
                  "medium",
                  `Possible scraping detected on ${endpoint}: ${count} requests`,
                  window.startTime,
                  endpoint,
                  "multiple",
                  rule
                )
              );
            }
          });
        });
        break;

      case "ddos":
        timeWindows.forEach((window) => {
          if (window.stats.total > rule.threshold) {
            anomalies.push(
              this.createAnomaly(
                "ddos",
                "critical",
                `Possible DDoS attack detected: ${window.stats.total} requests`,
                window.startTime,
                "/api/*",
                "multiple",
                rule
              )
            );
          }
        });
        break;
    }

    return anomalies;
  }

  // Detect pattern anomalies using statistical methods
  detectPatternAnomalies(requests) {
    const anomalies = [];
    const now = new Date();
    const oneHourAgo = subMinutes(now, 60);

    // Filter recent requests
    const recentRequests = requests.filter(
      (r) => new Date(r.timestamp) > oneHourAgo
    );

    if (recentRequests.length === 0) return anomalies;

    // Calculate baseline statistics
    const baseline = this.calculateBaseline(recentRequests);

    // Check current window against baseline
    const currentWindow = this.createTimeWindows(
      recentRequests.slice(-300), // Last 5 minutes
      300
    )[0];

    if (currentWindow) {
      // Check for deviations from baseline
      const deviation = this.calculateDeviation(currentWindow.stats, baseline);

      if (deviation.total > 3) {
        anomalies.push(
          this.createAnomaly(
            "pattern_anomaly",
            "high",
            `Statistical anomaly detected: ${deviation.total.toFixed(
              1
            )}σ deviation`,
            now,
            "/api/*",
            "multiple",
            { name: "statistical", threshold: 3 }
          )
        );
      }
    }

    return anomalies;
  }

  // Calculate baseline statistics
  calculateBaseline(requests) {
    const windows = this.createTimeWindows(requests, 300); // 5-minute windows

    const stats = {
      total: [],
      errorRate: [],
      endpoints: new Set(),
      countries: new Set(),
    };

    windows.forEach((window) => {
      stats.total.push(window.stats.total);
      stats.errorRate.push(
        window.stats.errors / Math.max(window.stats.total, 1)
      );

      window.stats.byEndpoint.forEach((_, endpoint) =>
        stats.endpoints.add(endpoint)
      );
      window.stats.byCountry.forEach((_, country) =>
        stats.countries.add(country)
      );
    });

    // Calculate mean and standard deviation
    const calculateStats = (values) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      return { mean, stdDev };
    };

    return {
      total: calculateStats(stats.total),
      errorRate: calculateStats(stats.errorRate),
      uniqueEndpoints: stats.endpoints.size,
      uniqueCountries: stats.countries.size,
    };
  }

  // Calculate deviation from baseline
  calculateDeviation(current, baseline) {
    const deviations = {};

    // Total requests deviation
    if (baseline.total.stdDev > 0) {
      deviations.total =
        Math.abs(current.total - baseline.total.mean) / baseline.total.stdDev;
    }

    // Error rate deviation
    const currentErrorRate = current.errors / Math.max(current.total, 1);
    if (baseline.errorRate.stdDev > 0) {
      deviations.errorRate =
        Math.abs(currentErrorRate - baseline.errorRate.mean) /
        baseline.errorRate.stdDev;
    }

    // Endpoint diversity deviation
    deviations.endpoints =
      current.byEndpoint.size / Math.max(baseline.uniqueEndpoints, 1);

    // Country diversity deviation
    deviations.countries =
      current.byCountry.size / Math.max(baseline.uniqueCountries, 1);

    // Overall deviation (weighted average)
    deviations.overall =
      (deviations.total || 0) * 0.4 +
      (deviations.errorRate || 0) * 0.3 +
      deviations.endpoints * 0.2 +
      deviations.countries * 0.1;

    return deviations;
  }

  // Create anomaly object
  createAnomaly(
    type,
    severity,
    description,
    timestamp,
    endpoint,
    sourceIp,
    rule
  ) {
    const anomalyId = uuidv4();

    const recommendations = {
      rate_spike:
        "Consider implementing rate limiting or increasing existing limits.",
      pattern_anomaly:
        "Review traffic patterns and investigate potential attacks.",
      geo_anomaly:
        "Consider geo-blocking or implementing additional verification.",
      credential_stuffing:
        "Implement account lockout and IP blocking mechanisms.",
      scraping: "Add bot detection and implement request throttling.",
      ddos: "Activate DDoS protection and consider scaling resources.",
    };

    return {
      id: anomalyId,
      type,
      severity,
      description,
      timestamp,
      endpoint,
      sourceIp,
      recommendation:
        recommendations[type] ||
        "Investigate the anomaly and take appropriate action.",
      rule: rule.name,
      confidence: this.calculateConfidence(severity),
      collateralDamage: {
        legitimateTrafficPercent: Math.random() * 15,
        affectedUsers: Math.floor(Math.random() * 1000),
      },
      metadata: {
        detectedAt: new Date().toISOString(),
        ruleThreshold: rule.threshold,
        timeWindow: rule.timeWindow,
      },
    };
  }

  // Calculate confidence score based on severity
  calculateConfidence(severity) {
    const baseConfidence = {
      critical: 95,
      high: 85,
      medium: 70,
      low: 60,
    };

    return baseConfidence[severity] || 65;
  }

  // Deduplicate similar anomalies
  deduplicateAnomalies(anomalies) {
    const uniqueAnomalies = new Map();

    anomalies.forEach((anomaly) => {
      const key = `${anomaly.type}_${anomaly.endpoint}_${
        anomaly.sourceIp
      }_${Math.floor(anomaly.timestamp.getTime() / (5 * 60 * 1000))}`;

      if (!uniqueAnomalies.has(key)) {
        uniqueAnomalies.set(key, anomaly);
      } else {
        // Merge with existing anomaly
        const existing = uniqueAnomalies.get(key);
        if (
          this.getSeverityLevel(anomaly.severity) >
          this.getSeverityLevel(existing.severity)
        ) {
          existing.severity = anomaly.severity;
        }
        existing.confidence = Math.max(existing.confidence, anomaly.confidence);
      }
    });

    // Store in history
    uniqueAnomalies.forEach((anomaly) => {
      this.anomalyHistory.set(anomaly.id, {
        ...anomaly,
        status: "detected",
        updatedAt: new Date(),
      });
    });

    return Array.from(uniqueAnomalies.values()).sort(
      (a, b) =>
        this.getSeverityLevel(b.severity) - this.getSeverityLevel(a.severity)
    );
  }

  // Get severity level as number
  getSeverityLevel(severity) {
    const levels = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return levels[severity] || 0;
  }

  // Get anomaly history
  getAnomalyHistory(limit = 100) {
    return Array.from(this.anomalyHistory.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // Update anomaly status
  updateAnomalyStatus(anomalyId, status, notes = "") {
    if (this.anomalyHistory.has(anomalyId)) {
      const anomaly = this.anomalyHistory.get(anomalyId);
      anomaly.status = status;
      anomaly.notes = notes;
      anomaly.updatedAt = new Date();

      if (status === "resolved") {
        anomaly.resolvedAt = new Date();
      }

      this.anomalyHistory.set(anomalyId, anomaly);
      return true;
    }
    return false;
  }

  // Get anomaly statistics
  getAnomalyStatistics(timeRange = "24h") {
    const now = new Date();
    let cutoffTime;

    switch (timeRange) {
      case "1h":
        cutoffTime = subMinutes(now, 60);
        break;
      case "6h":
        cutoffTime = subMinutes(now, 360);
        break;
      case "24h":
        cutoffTime = subMinutes(now, 1440);
        break;
      case "7d":
        cutoffTime = subMinutes(now, 10080);
        break;
      default:
        cutoffTime = subMinutes(now, 1440);
    }

    const recentAnomalies = Array.from(this.anomalyHistory.values()).filter(
      (a) => new Date(a.timestamp) > cutoffTime
    );

    const stats = {
      total: recentAnomalies.length,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      byType: new Map(),
      byEndpoint: new Map(),
      trend: 0,
    };

    recentAnomalies.forEach((anomaly) => {
      stats.bySeverity[anomaly.severity]++;

      const typeCount = stats.byType.get(anomaly.type) || 0;
      stats.byType.set(anomaly.type, typeCount + 1);

      const endpointCount = stats.byEndpoint.get(anomaly.endpoint) || 0;
      stats.byEndpoint.set(anomaly.endpoint, endpointCount + 1);
    });

    // Calculate trend (compare with previous period)
    const previousCutoff = new Date(
      cutoffTime.getTime() - (now.getTime() - cutoffTime.getTime())
    );
    const previousAnomalies = Array.from(this.anomalyHistory.values()).filter(
      (a) =>
        new Date(a.timestamp) > previousCutoff &&
        new Date(a.timestamp) <= cutoffTime
    );

    if (previousAnomalies.length > 0) {
      stats.trend =
        ((recentAnomalies.length - previousAnomalies.length) /
          previousAnomalies.length) *
        100;
    }

    return stats;
  }

  // Generate simulated request data for testing
  generateTestRequests(count = 1000) {
    const requests = [];
    const now = Date.now();
    const endpoints = [
      "/api/v1/users",
      "/api/v1/products",
      "/api/v1/auth/login",
      "/api/v1/orders",
    ];
    const countries = ["US", "CN", "GB", "DE", "FR", "JP", "IN", "BR"];
    const statusCodes = [200, 200, 200, 200, 404, 401, 500]; // Weighted distribution

    for (let i = 0; i < count; i++) {
      const timestamp = now - Math.random() * 3600000; // Within last hour
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}`;
      const country = countries[Math.floor(Math.random() * countries.length)];
      const statusCode =
        statusCodes[Math.floor(Math.random() * statusCodes.length)];

      requests.push({
        id: uuidv4(),
        timestamp: new Date(timestamp),
        endpoint,
        ip,
        country,
        statusCode,
        method: ["GET", "POST", "PUT", "DELETE"][Math.floor(Math.random() * 4)],
        userAgent: `Test Agent ${Math.floor(Math.random() * 100)}`,
        responseTime: Math.random() * 1000,
      });
    }

    // Add some anomalies
    for (let i = 0; i < 10; i++) {
      const anomalyIndex = Math.floor(Math.random() * requests.length);
      requests[anomalyIndex].statusCode = 401; // Failed auth
      requests[anomalyIndex].endpoint = "/api/v1/auth/login";
      requests[anomalyIndex].ip = "10.0.0.1"; // Same IP for credential stuffing
    }

    return requests;
  }
}

module.exports = AnomalyDetectorService;
