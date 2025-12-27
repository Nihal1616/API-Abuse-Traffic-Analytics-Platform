const { faker } = require("@faker-js/faker");
const { subHours, subMinutes } = require("date-fns");
const { v4: uuidv4 } = require("uuid");

class DataGeneratorService {
  constructor() {
    this.endpoints = [
      "/api/v1/users",
      "/api/v1/products",
      "/api/v1/orders",
      "/api/v1/auth/login",
      "/api/v1/payments",
      "/api/v1/admin/dashboard",
      "/api/v1/health",
      "/api/v1/config",
    ];

    this.countries = [
      "US",
      "CN",
      "RU",
      "IN",
      "BR",
      "DE",
      "GB",
      "FR",
      "JP",
      "KR",
    ];
    this.attackTypes = [
      "DDoS",
      "SQL Injection",
      "XSS",
      "Credential Stuffing",
      "Scraping",
      "API Abuse",
    ];
  }

  generateTimeSeriesData(hours = 24) {
    const data = [];
    const now = new Date();

    for (let i = hours; i >= 0; i--) {
      const timestamp = subHours(now, i);
      const baseRequests = Math.floor(Math.random() * 5000) + 1000;
      const blocked = Math.floor(Math.random() * baseRequests * 0.1);
      const anomalies = Math.floor(Math.random() * baseRequests * 0.05);

      data.push({
        timestamp,
        requests: baseRequests,
        blocked,
        anomalies,
        responseTime: Math.random() * 200 + 50,
      });
    }

    // Add some spikes
    this.addAnomalies(data);

    return data;
  }

  addAnomalies(data) {
    // Add DDoS spike
    const ddosIndex = Math.floor(Math.random() * data.length);
    data[ddosIndex].requests *= 3;
    data[ddosIndex].blocked *= 2;
    data[ddosIndex].anomalies *= 4;

    // Add anomaly spike
    const anomalyIndex = Math.floor(Math.random() * data.length);
    data[anomalyIndex].anomalies *= 5;
  }

  generateAnomalyEvents(count = 10) {
    const events = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const severity =
        i === 0 ? "critical" : i < 3 ? "high" : i < 6 ? "medium" : "low";

      const types = [
        "rate_spike",
        "pattern_anomaly",
        "geo_anomaly",
        "credential_stuffing",
        "scraping",
        "ddos",
      ];

      events.push({
        id: uuidv4(),
        type: types[Math.floor(Math.random() * types.length)],
        severity,
        description: faker.lorem.sentence(),
        timestamp: subMinutes(now, Math.random() * 120),
        endpoint:
          this.endpoints[Math.floor(Math.random() * this.endpoints.length)],
        sourceIp: faker.internet.ip(),
        recommendation: faker.lorem.paragraph(),
        collateralDamage: {
          legitimateTrafficPercent: Math.random() * 15,
          affectedUsers: Math.floor(Math.random() * 1000),
        },
      });
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  generateActionRecommendations(count = 5) {
    const recommendations = [];
    const actions = ["block", "throttle", "challenge", "monitor", "whitelist"];

    for (let i = 0; i < count; i++) {
      const affectedUsers = Math.floor(Math.random() * 5000);
      const affectedRequests =
        affectedUsers * Math.floor(Math.random() * 10 + 1);

      recommendations.push({
        id: uuidv4(),
        action: actions[Math.floor(Math.random() * actions.length)],
        target: `${faker.internet.ip()}/24`,
        reason: faker.lorem.sentence(),
        confidence: Math.floor(Math.random() * 40) + 60,
        estimatedImpact: faker.lorem.sentence(),
        collateralDamage: {
          affectedUsers,
          affectedRequests,
          legitimateTrafficPercent: Math.random() * 10,
        },
      });
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  generateThreatActors(count = 8) {
    const actors = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const threatScore = i === 0 ? 98 : Math.floor(Math.random() * 40) + 60;
      const status =
        threatScore > 90 ? "active" : i < 2 ? "blocked" : "monitoring";

      actors.push({
        id: uuidv4(),
        ip: faker.internet.ip(),
        country:
          this.countries[Math.floor(Math.random() * this.countries.length)],
        status,
        threatScore,
        requestCount: Math.floor(Math.random() * 100000) + 1000,
        blockedCount: Math.floor(Math.random() * 5000),
        lastSeen: subMinutes(now, Math.random() * 240),
        attackTypes: faker.helpers.arrayElements(
          this.attackTypes,
          Math.floor(Math.random() * 3) + 1
        ),
        firstSeen: subMinutes(now, Math.random() * 1440),
      });
    }

    return actors.sort((a, b) => b.threatScore - a.threatScore);
  }

  generateEndpoints() {
    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    const endpoints = [];

    this.endpoints.forEach((path, index) => {
      const anomalyScore = index === 0 ? 92 : Math.random() * 80;

      endpoints.push({
        id: uuidv4(),
        path,
        method: methods[Math.floor(Math.random() * methods.length)],
        requestsPerMinute: Math.floor(Math.random() * 5000) + 100,
        avgResponseTime: Math.floor(Math.random() * 200) + 50,
        errorRate: (Math.random() * 5).toFixed(1),
        anomalyScore: Math.floor(anomalyScore),
        isUnderAttack: index < 2,
        topAbusers: Array.from({ length: 3 }, () => faker.internet.ip()),
        lastUpdated: new Date(),
      });
    });

    return endpoints;
  }

  generateSecurityMetrics() {
    return {
      totalRequests: Math.floor(Math.random() * 1000000) + 500000,
      blockedRequests: Math.floor(Math.random() * 50000) + 10000,
      anomalyCount: Math.floor(Math.random() * 1000) + 100,
      avgResponseTime: Math.floor(Math.random() * 200) + 50,
      threatActorsDetected: Math.floor(Math.random() * 50) + 10,
      endpointsProtected: this.endpoints.length,
      uptime: (Math.random() * 5 + 95).toFixed(2),
      errorRate: (Math.random() * 3).toFixed(2),
      dataProcessedGB: (Math.random() * 500 + 100).toFixed(1),
    };
  }
}

module.exports = DataGeneratorService;
