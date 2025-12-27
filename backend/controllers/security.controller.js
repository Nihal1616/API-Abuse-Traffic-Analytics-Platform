const DataGeneratorService = require("../services/data-generator.service");
const AnomalyDetectorService = require("../services/anomaly-detector.service");
const ThreatIntelligenceService = require("../services/threat-intelligence.service");
const logger = require("../utils/logger");

class SecurityController {
  constructor() {
    this.dataGenerator = new DataGeneratorService();
    this.anomalyDetector = new AnomalyDetectorService();
    this.threatIntel = new ThreatIntelligenceService();
  }

  // Get traffic data for charts
  async getTrafficData(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const data = this.dataGenerator.generateTimeSeriesData(hours);

      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting traffic data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch traffic data",
      });
    }
  }

  // Get anomaly events
  async getAnomalies(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const severity = req.query.severity;
      const type = req.query.type;

      let anomalies = this.dataGenerator.generateAnomalyEvents(limit);

      if (severity) {
        anomalies = anomalies.filter((a) => a.severity === severity);
      }

      if (type) {
        anomalies = anomalies.filter((a) => a.type === type);
      }

      res.json({
        success: true,
        data: anomalies,
        count: anomalies.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting anomalies:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch anomalies",
      });
    }
  }

  // Get latest anomalies (for real-time updates)
  async getLatestAnomalies(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const anomalies = this.dataGenerator.generateAnomalyEvents(limit);

      // Emit real-time event
      const io = req.app.get("io");
      if (io) {
        io.to("anomalies").emit("new_anomaly", {
          data: anomalies[0],
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: anomalies,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting latest anomalies:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch latest anomalies",
      });
    }
  }

  // Get threat actors
  async getThreatActors(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;
      const minScore = parseInt(req.query.minScore) || 0;

      let actors = this.dataGenerator.generateThreatActors(limit);

      if (status) {
        actors = actors.filter((a) => a.status === status);
      }

      actors = actors.filter((a) => a.threatScore >= minScore);

      res.json({
        success: true,
        data: actors,
        count: actors.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting threat actors:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch threat actors",
      });
    }
  }

  // Get top threat actors
  async getTopThreatActors(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const actors = this.dataGenerator
        .generateThreatActors(limit)
        .sort((a, b) => b.threatScore - a.threatScore)
        .slice(0, limit);

      res.json({
        success: true,
        data: actors,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting top threat actors:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch top threat actors",
      });
    }
  }

  // Get endpoints
  async getEndpoints(req, res) {
    try {
      const endpoints = this.dataGenerator.generateEndpoints();

      res.json({
        success: true,
        data: endpoints,
        count: endpoints.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting endpoints:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch endpoints",
      });
    }
  }

  // Get endpoint health
  async getEndpointHealth(req, res) {
    try {
      const endpointId = req.params.id;
      const endpoints = this.dataGenerator.generateEndpoints();
      const endpoint = endpoints.find((e) => e.id === endpointId);

      if (!endpoint) {
        return res.status(404).json({
          success: false,
          error: "Endpoint not found",
        });
      }

      // Generate health metrics
      const health = {
        endpoint,
        metrics: {
          uptime: Math.random() * 20 + 80, // 80-100%
          errorRate: endpoint.errorRate,
          responseTime: endpoint.avgResponseTime,
          requestsPerMinute: endpoint.requestsPerMinute,
          anomalyScore: endpoint.anomalyScore,
          lastCheck: new Date().toISOString(),
        },
        status:
          endpoint.anomalyScore > 80
            ? "critical"
            : endpoint.anomalyScore > 50
            ? "warning"
            : "healthy",
      };

      res.json({
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting endpoint health:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch endpoint health",
      });
    }
  }

  // Get action recommendations
  async getActionRecommendations(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const minConfidence = parseInt(req.query.minConfidence) || 50;

      let recommendations =
        this.dataGenerator.generateActionRecommendations(limit);
      recommendations = recommendations.filter(
        (r) => r.confidence >= minConfidence
      );

      res.json({
        success: true,
        data: recommendations,
        count: recommendations.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting recommendations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch recommendations",
      });
    }
  }

  // Block threat actor
  async blockThreatActor(req, res) {
    try {
      const { ip, reason, duration } = req.body;

      if (!ip) {
        return res.status(400).json({
          success: false,
          error: "IP address is required",
        });
      }

      // In a real implementation, this would block the IP in the firewall/WAF
      logger.info(
        `Blocking IP: ${ip}, Reason: ${reason}, Duration: ${duration}`
      );

      // Emit real-time event
      const io = req.app.get("io");
      if (io) {
        io.to("blocks").emit("ip_blocked", {
          ip,
          reason,
          duration,
          timestamp: new Date().toISOString(),
          actionBy: req.user?.id || "system",
        });
      }

      res.json({
        success: true,
        message: `IP ${ip} has been blocked`,
        data: { ip, blockedAt: new Date().toISOString() },
      });
    } catch (error) {
      logger.error("Error blocking threat actor:", error);
      res.status(500).json({
        success: false,
        error: "Failed to block threat actor",
      });
    }
  }

  // Throttle traffic
  async throttleTraffic(req, res) {
    try {
      const { endpoint, rateLimit, duration } = req.body;

      if (!endpoint || !rateLimit) {
        return res.status(400).json({
          success: false,
          error: "Endpoint and rate limit are required",
        });
      }

      logger.info(
        `Throttling endpoint: ${endpoint}, Rate: ${rateLimit}/min, Duration: ${duration}`
      );

      res.json({
        success: true,
        message: `Endpoint ${endpoint} has been throttled to ${rateLimit} requests per minute`,
        data: { endpoint, rateLimit, throttledAt: new Date().toISOString() },
      });
    } catch (error) {
      logger.error("Error throttling traffic:", error);
      res.status(500).json({
        success: false,
        error: "Failed to throttle traffic",
      });
    }
  }

  // Monitor endpoint
  async monitorEndpoint(req, res) {
    try {
      const { endpoint, alertThreshold, monitoringType } = req.body;

      if (!endpoint) {
        return res.status(400).json({
          success: false,
          error: "Endpoint is required",
        });
      }

      logger.info(
        `Monitoring endpoint: ${endpoint}, Threshold: ${alertThreshold}, Type: ${monitoringType}`
      );

      res.json({
        success: true,
        message: `Endpoint ${endpoint} is now being monitored`,
        data: {
          endpoint,
          alertThreshold,
          monitoringType,
          monitoringStartedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error monitoring endpoint:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start monitoring",
      });
    }
  }

  // Apply recommendation
  async applyRecommendation(req, res) {
    try {
      const { recommendationId, action, target } = req.body;

      if (!recommendationId || !action || !target) {
        return res.status(400).json({
          success: false,
          error: "Recommendation ID, action, and target are required",
        });
      }

      logger.info(
        `Applying recommendation: ${recommendationId}, Action: ${action}, Target: ${target}`
      );

      // Simulate recommendation application
      const result = {
        id: recommendationId,
        action,
        target,
        appliedAt: new Date().toISOString(),
        status: "applied",
        estimatedEffectiveness: Math.floor(Math.random() * 30) + 70, // 70-100%
      };

      res.json({
        success: true,
        message: `Recommendation ${recommendationId} has been applied`,
        data: result,
      });
    } catch (error) {
      logger.error("Error applying recommendation:", error);
      res.status(500).json({
        success: false,
        error: "Failed to apply recommendation",
      });
    }
  }

  // Get security summary
  async getSecuritySummary(req, res) {
    try {
      const timeRange = req.query.range || "24h";

      const summary = {
        totalRequests: Math.floor(Math.random() * 1000000) + 500000,
        blockedRequests: Math.floor(Math.random() * 50000) + 10000,
        anomalyCount: Math.floor(Math.random() * 1000) + 100,
        threatActorsDetected: Math.floor(Math.random() * 50) + 10,
        avgResponseTime: Math.floor(Math.random() * 100) + 50,
        errorRate: (Math.random() * 5).toFixed(2),
        uptime: (Math.random() * 5 + 95).toFixed(2),
        timestamp: new Date().toISOString(),
        timeRange,
      };

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error("Error getting security summary:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch security summary",
      });
    }
  }

  // Get security timeline
  async getSecurityTimeline(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const events = [];

      for (let i = 0; i < limit; i++) {
        const hoursAgo = Math.random() * 48;
        const eventTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

        events.push({
          id: `event_${i}`,
          timestamp: eventTime.toISOString(),
          type: ["block", "anomaly", "threat", "alert"][
            Math.floor(Math.random() * 4)
          ],
          severity: ["low", "medium", "high", "critical"][
            Math.floor(Math.random() * 4)
          ],
          description: `Security event ${i + 1} detected`,
          source: Math.random() > 0.5 ? "automated" : "manual",
          actionTaken: Math.random() > 0.3 ? "blocked" : "monitored",
        });
      }

      events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      res.json({
        success: true,
        data: events.slice(0, limit),
        count: events.length,
      });
    } catch (error) {
      logger.error("Error getting security timeline:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch security timeline",
      });
    }
  }

  // Get security trends
  async getSecurityTrends(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const trends = [];

      for (let i = days; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);

        trends.push({
          date: date.toISOString().split("T")[0],
          attacks: Math.floor(Math.random() * 1000) + 100,
          blocks: Math.floor(Math.random() * 500) + 50,
          anomalies: Math.floor(Math.random() * 200) + 20,
          threats: Math.floor(Math.random() * 50) + 5,
          responseTime: Math.floor(Math.random() * 50) + 50,
        });
      }

      res.json({
        success: true,
        data: trends,
        period: `${days} days`,
      });
    } catch (error) {
      logger.error("Error getting security trends:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch security trends",
      });
    }
  }

  // Handle security alert webhook
  async handleSecurityAlert(req, res) {
    try {
      const alert = req.body;

      logger.info("Received security alert:", alert);

      // Process the alert
      const processedAlert = {
        ...alert,
        receivedAt: new Date().toISOString(),
        processed: true,
        alertId: `alert_${Date.now()}`,
      };

      // Emit real-time alert
      const io = req.app.get("io");
      if (io) {
        io.to("alerts").emit("security_alert", processedAlert);
      }

      res.json({
        success: true,
        message: "Alert received and processed",
        data: processedAlert,
      });
    } catch (error) {
      logger.error("Error handling security alert:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process alert",
      });
    }
  }

  // SSE endpoint for real-time events
  async getSecurityEvents(req, res) {
    try {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });

      const clientId = Date.now();
      logger.info(`New SSE client connected: ${clientId}`);

      // Send initial data
      res.write(
        `data: ${JSON.stringify({
          type: "connected",
          clientId,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      // Send periodic updates
      const intervalId = setInterval(() => {
        const event = {
          type: "heartbeat",
          data: {
            timestamp: new Date().toISOString(),
            activeConnections: Math.floor(Math.random() * 100) + 50,
            eventsProcessed: Math.floor(Math.random() * 1000) + 500,
          },
        };

        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }, 30000); // Every 30 seconds

      // Handle client disconnect
      req.on("close", () => {
        clearInterval(intervalId);
        logger.info(`SSE client disconnected: ${clientId}`);
      });
    } catch (error) {
      logger.error("Error in SSE endpoint:", error);
      res.status(500).end();
    }
  }
}

module.exports = new SecurityController();
