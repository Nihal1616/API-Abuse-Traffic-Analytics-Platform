const DataGeneratorService = require("../services/data-generator.service");
const logger = require("../utils/logger");

class MetricsController {
  constructor() {
    this.dataGenerator = new DataGeneratorService();
  }

  // Get dashboard metrics
  async getDashboardMetrics(req, res) {
    try {
      const metrics = {
        traffic: this.dataGenerator.generateTimeSeriesData(24),
        anomalies: this.dataGenerator.generateAnomalyEvents(10),
        threatActors: this.dataGenerator.generateThreatActors(8),
        recommendations: this.dataGenerator.generateActionRecommendations(5),
        summary: {
          totalRequests: 1254308,
          blockedRequests: 45231,
          anomalyCount: 342,
          threatActorsDetected: 28,
          avgResponseTime: 87,
          errorRate: 1.2,
          uptime: 99.95,
          dataProcessedGB: 245.6,
        },
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error("Error getting dashboard metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch dashboard metrics",
      });
    }
  }

  // Get overview metrics
  async getOverviewMetrics(req, res) {
    try {
      const overview = {
        requests: {
          total: Math.floor(Math.random() * 1000000) + 500000,
          successful: Math.floor(Math.random() * 900000) + 450000,
          failed: Math.floor(Math.random() * 50000) + 5000,
          blocked: Math.floor(Math.random() * 30000) + 2000,
        },
        performance: {
          avgResponseTime: Math.floor(Math.random() * 100) + 50,
          p95ResponseTime: Math.floor(Math.random() * 200) + 100,
          p99ResponseTime: Math.floor(Math.random() * 500) + 200,
          requestsPerSecond: Math.floor(Math.random() * 100) + 50,
        },
        security: {
          threatsBlocked: Math.floor(Math.random() * 5000) + 1000,
          anomaliesDetected: Math.floor(Math.random() * 1000) + 100,
          activeThreats: Math.floor(Math.random() * 50) + 10,
          threatScore: Math.floor(Math.random() * 40) + 60,
        },
        system: {
          cpuUsage: (Math.random() * 30 + 10).toFixed(1),
          memoryUsage: (Math.random() * 40 + 30).toFixed(1),
          diskUsage: (Math.random() * 50 + 30).toFixed(1),
          uptime: (Math.random() * 100 + 900).toFixed(0),
        },
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      logger.error("Error getting overview metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch overview metrics",
      });
    }
  }

  // Get metrics summary
  async getMetricsSummary(req, res) {
    try {
      const summary = {
        period: req.query.period || "24h",
        data: {
          requests: {
            count: 1254308,
            trend: 12.5,
            direction: "up",
          },
          errors: {
            count: 15052,
            rate: 1.2,
            trend: -5.3,
            direction: "down",
          },
          responseTime: {
            avg: 87,
            p95: 245,
            p99: 512,
            trend: -2.1,
            direction: "down",
          },
          threats: {
            detected: 342,
            blocked: 312,
            rate: 91.2,
            trend: 8.7,
            direction: "up",
          },
        },
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error("Error getting metrics summary:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch metrics summary",
      });
    }
  }

  // Get time-series data
  async getTimeSeriesData(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const interval = req.query.interval || "hour";
      const metric = req.query.metric || "requests";

      const data = this.dataGenerator.generateTimeSeriesData(hours);

      // Transform data based on requested metric
      let transformedData;
      switch (metric) {
        case "requests":
          transformedData = data.map((d) => ({
            timestamp: d.timestamp,
            value: d.requests,
          }));
          break;
        case "blocked":
          transformedData = data.map((d) => ({
            timestamp: d.timestamp,
            value: d.blocked,
          }));
          break;
        case "anomalies":
          transformedData = data.map((d) => ({
            timestamp: d.timestamp,
            value: d.anomalies,
          }));
          break;
        case "responseTime":
          transformedData = data.map((d) => ({
            timestamp: d.timestamp,
            value: d.responseTime,
          }));
          break;
        default:
          transformedData = data;
      }

      res.json({
        success: true,
        data: transformedData,
        metric,
        interval,
        hours,
      });
    } catch (error) {
      logger.error("Error getting time-series data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch time-series data",
      });
    }
  }

  // Get real-time metrics
  async getRealTimeMetrics(req, res) {
    try {
      const metrics = {
        currentRequestsPerSecond: Math.floor(Math.random() * 100) + 50,
        activeConnections: Math.floor(Math.random() * 500) + 200,
        errorRate: (Math.random() * 2).toFixed(2),
        responseTime: Math.floor(Math.random() * 100) + 50,
        blockedRequests: Math.floor(Math.random() * 100) + 10,
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error("Error getting real-time metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch real-time metrics",
      });
    }
  }

  // Get historical data
  async getHistoricalData(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      const data = [];

      for (let i = days; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);

        data.push({
          date: date.toISOString().split("T")[0],
          requests: Math.floor(Math.random() * 1000000) + 500000,
          blocked: Math.floor(Math.random() * 50000) + 10000,
          anomalies: Math.floor(Math.random() * 1000) + 100,
          responseTime: Math.floor(Math.random() * 50) + 50,
          errorRate: (Math.random() * 3).toFixed(2),
          threatScore: Math.floor(Math.random() * 40) + 60,
        });
      }

      res.json({
        success: true,
        data,
        period: `${days} days`,
      });
    } catch (error) {
      logger.error("Error getting historical data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch historical data",
      });
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(req, res) {
    try {
      const metrics = {
        endpoints: this.dataGenerator.generateEndpoints(),
        responseTimes: {
          avg: 87,
          p50: 65,
          p90: 145,
          p95: 245,
          p99: 512,
          max: 1234,
        },
        throughput: {
          requestsPerSecond: 85,
          megabytesPerSecond: 12.5,
          concurrentUsers: 342,
        },
        availability: {
          uptime: 99.95,
          downtime: 0.05,
          incidents: 3,
          mttr: "15m", // Mean Time To Recovery
        },
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error("Error getting performance metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch performance metrics",
      });
    }
  }

  // Get endpoint performance
  async getEndpointPerformance(req, res) {
    try {
      const endpoints = this.dataGenerator.generateEndpoints();
      const performance = endpoints.map((endpoint) => ({
        ...endpoint,
        performance: {
          availability: (Math.random() * 5 + 95).toFixed(2),
          reliability: (Math.random() * 5 + 95).toFixed(2),
          efficiency: (Math.random() * 10 + 90).toFixed(2),
          lastHealthCheck: new Date().toISOString(),
        },
      }));

      res.json({
        success: true,
        data: performance,
        count: performance.length,
      });
    } catch (error) {
      logger.error("Error getting endpoint performance:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch endpoint performance",
      });
    }
  }

  // Get latency metrics
  async getLatencyMetrics(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const latencyData = [];

      for (let i = hours; i >= 0; i--) {
        const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);

        latencyData.push({
          timestamp,
          avg: Math.floor(Math.random() * 100) + 50,
          p50: Math.floor(Math.random() * 80) + 40,
          p90: Math.floor(Math.random() * 200) + 100,
          p95: Math.floor(Math.random() * 300) + 150,
          p99: Math.floor(Math.random() * 500) + 250,
        });
      }

      res.json({
        success: true,
        data: latencyData,
        hours,
      });
    } catch (error) {
      logger.error("Error getting latency metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch latency metrics",
      });
    }
  }

  // Get error metrics
  async getErrorMetrics(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const errorData = [];
      const errorTypes = ["500", "502", "503", "404", "403", "400", "429"];

      for (let i = hours; i >= 0; i--) {
        const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
        const errors = {};

        errorTypes.forEach((type) => {
          errors[type] = Math.floor(Math.random() * 100);
        });

        errorData.push({
          timestamp,
          total: Object.values(errors).reduce((a, b) => a + b, 0),
          ...errors,
        });
      }

      res.json({
        success: true,
        data: errorData,
        errorTypes,
        hours,
      });
    } catch (error) {
      logger.error("Error getting error metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch error metrics",
      });
    }
  }

  // Get error rate
  async getErrorRate(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const errorRateData = [];

      for (let i = hours; i >= 0; i--) {
        const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);

        errorRateData.push({
          timestamp,
          rate: (Math.random() * 3).toFixed(2),
          errors: Math.floor(Math.random() * 500),
          requests: Math.floor(Math.random() * 50000) + 10000,
        });
      }

      res.json({
        success: true,
        data: errorRateData,
        avgErrorRate: (
          errorRateData.reduce((sum, d) => sum + parseFloat(d.rate), 0) /
          errorRateData.length
        ).toFixed(2),
        hours,
      });
    } catch (error) {
      logger.error("Error getting error rate:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch error rate",
      });
    }
  }

  // Get error types
  async getErrorTypes(req, res) {
    try {
      const errorTypes = [
        {
          code: "500",
          count: 1250,
          description: "Internal Server Error",
          percentage: 35,
        },
        { code: "502", count: 850, description: "Bad Gateway", percentage: 24 },
        {
          code: "503",
          count: 620,
          description: "Service Unavailable",
          percentage: 17,
        },
        { code: "404", count: 450, description: "Not Found", percentage: 13 },
        { code: "403", count: 280, description: "Forbidden", percentage: 8 },
        {
          code: "429",
          count: 120,
          description: "Too Many Requests",
          percentage: 3,
        },
      ];

      res.json({
        success: true,
        data: errorTypes,
        total: errorTypes.reduce((sum, type) => sum + type.count, 0),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting error types:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch error types",
      });
    }
  }

  // Get security metrics
  async getSecurityMetrics(req, res) {
    try {
      const metrics = {
        threats: {
          totalDetected: 342,
          blocked: 312,
          bypassed: 30,
          blockRate: 91.2,
        },
        anomalies: {
          total: 245,
          critical: 12,
          high: 45,
          medium: 98,
          low: 90,
        },
        actors: {
          active: 28,
          blocked: 156,
          monitoring: 42,
        },
        attacks: {
          ddos: 45,
          injection: 28,
          scraping: 89,
          credentialStuffing: 56,
          other: 124,
        },
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error("Error getting security metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch security metrics",
      });
    }
  }

  // Get blocked requests
  async getBlockedRequests(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const blockedData = [];

      for (let i = hours; i >= 0; i--) {
        const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);

        blockedData.push({
          timestamp,
          blocked: Math.floor(Math.random() * 500) + 100,
          reason: {
            rateLimit: Math.floor(Math.random() * 200) + 50,
            maliciousIP: Math.floor(Math.random() * 150) + 30,
            suspiciousPattern: Math.floor(Math.random() * 100) + 20,
            other: Math.floor(Math.random() * 50) + 10,
          },
        });
      }

      res.json({
        success: true,
        data: blockedData,
        totalBlocked: blockedData.reduce((sum, d) => sum + d.blocked, 0),
        hours,
      });
    } catch (error) {
      logger.error("Error getting blocked requests:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch blocked requests",
      });
    }
  }

  // Get threat metrics
  async getThreatMetrics(req, res) {
    try {
      const threatMetrics = {
        score: 78, // Overall threat score 0-100
        trend: 5.2, // Percentage change
        level: "medium", // low/medium/high/critical
        details: {
          ipReputation: 65,
          behaviorAnalysis: 82,
          patternDetection: 71,
          anomalyScore: 88,
        },
        threatsByCountry: [
          { country: "CN", count: 1250, percentage: 32 },
          { country: "US", count: 850, percentage: 22 },
          { country: "RU", count: 620, percentage: 16 },
          { country: "IN", count: 450, percentage: 12 },
          { country: "BR", count: 280, percentage: 7 },
          { country: "Other", count: 350, percentage: 9 },
        ],
        topThreatTypes: [
          { type: "Credential Stuffing", count: 890, percentage: 28 },
          { type: "DDoS", count: 650, percentage: 21 },
          { type: "SQL Injection", count: 520, percentage: 17 },
          { type: "XSS", count: 430, percentage: 14 },
          { type: "Scraping", count: 380, percentage: 12 },
          { type: "Other", count: 230, percentage: 8 },
        ],
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: threatMetrics,
      });
    } catch (error) {
      logger.error("Error getting threat metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch threat metrics",
      });
    }
  }

  // Export metrics data
  async exportMetricsData(req, res) {
    try {
      const format = req.query.format || "json";
      const dataType = req.query.type || "summary";

      let data;
      switch (dataType) {
        case "traffic":
          data = this.dataGenerator.generateTimeSeriesData(168); // 7 days
          break;
        case "anomalies":
          data = this.dataGenerator.generateAnomalyEvents(100);
          break;
        case "threats":
          data = this.dataGenerator.generateThreatActors(50);
          break;
        default:
          data = await this.getOverviewMetrics(req, res);
          data = data.data;
      }

      if (format === "csv") {
        return this.exportMetricsCSV(req, res);
      }

      res.json({
        success: true,
        data,
        format,
        type: dataType,
        exportedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error exporting metrics data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to export metrics data",
      });
    }
  }

  // Export metrics as CSV
  async exportMetricsCSV(req, res) {
    try {
      const dataType = req.query.type || "traffic";
      let csvContent = "";

      switch (dataType) {
        case "traffic":
          const trafficData = this.dataGenerator.generateTimeSeriesData(24);
          csvContent = "timestamp,requests,blocked,anomalies,responseTime\n";
          trafficData.forEach((row) => {
            csvContent += `${row.timestamp.toISOString()},${row.requests},${
              row.blocked
            },${row.anomalies},${row.responseTime}\n`;
          });
          break;

        case "anomalies":
          const anomalies = this.dataGenerator.generateAnomalyEvents(50);
          csvContent = "id,timestamp,type,severity,endpoint,sourceIp\n";
          anomalies.forEach((row) => {
            csvContent += `${row.id},${row.timestamp.toISOString()},${
              row.type
            },${row.severity},${row.endpoint},${row.sourceIp}\n`;
          });
          break;

        default:
          csvContent = "metric,value\n";
          const summary = await this.getOverviewMetrics(req, res);
          Object.entries(summary.data).forEach(([category, metrics]) => {
            Object.entries(metrics).forEach(([key, value]) => {
              csvContent += `${category}.${key},${value}\n`;
            });
          });
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${dataType}_metrics_${Date.now()}.csv`
      );
      res.send(csvContent);
    } catch (error) {
      logger.error("Error exporting CSV:", error);
      res.status(500).json({
        success: false,
        error: "Failed to export CSV",
      });
    }
  }
}

module.exports = new MetricsController();
