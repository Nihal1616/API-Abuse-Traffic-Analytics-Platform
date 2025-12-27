const logger = require("../utils/logger");
const { v4: uuidv4 } = require("uuid");
const { subHours, subDays } = require("date-fns");

class ThreatIntelligenceService {
  constructor() {
    this.threatActors = new Map();
    this.ipReputation = new Map();
    this.knownThreats = new Map();
    this.behaviorProfiles = new Map();

    this.loadThreatData();
    this.initializeMockData();
  }

  // Load threat intelligence data
  loadThreatData() {
    // In production, this would load from external threat intelligence feeds
    this.knownThreats.set("TOR_EXIT_NODE", {
      type: "proxy",
      risk: "medium",
      description: "Tor exit node",
      mitigation: "Monitor or block if suspicious",
    });

    this.knownThreats.set("VPN_PROVIDER", {
      type: "proxy",
      risk: "low",
      description: "Commercial VPN service",
      mitigation: "Additional verification may be required",
    });

    this.knownThreats.set("CLOUD_PROVIDER", {
      type: "hosting",
      risk: "low",
      description: "Cloud hosting provider",
      mitigation: "Monitor for automated traffic",
    });

    this.knownThreats.set("BOTNET", {
      type: "malware",
      risk: "high",
      description: "Known botnet infrastructure",
      mitigation: "Block immediately",
    });

    this.knownThreats.set("SCANNER", {
      type: "reconnaissance",
      risk: "medium",
      description: "Network scanning tool",
      mitigation: "Block and monitor for further activity",
    });
  }

  // Initialize mock data
  initializeMockData() {
    const now = new Date();

    // Mock threat actors
    const mockActors = [
      {
        ip: "185.220.101.33",
        country: "DE",
        threatScore: 92,
        attackTypes: ["DDoS", "Credential Stuffing"],
        firstSeen: subDays(now, 30),
        lastSeen: subHours(now, 2),
      },
      {
        ip: "45.155.205.233",
        country: "RU",
        threatScore: 88,
        attackTypes: ["SQL Injection", "XSS"],
        firstSeen: subDays(now, 15),
        lastSeen: subHours(now, 1),
      },
      {
        ip: "103.237.145.11",
        country: "CN",
        threatScore: 85,
        attackTypes: ["Scraping", "API Abuse"],
        firstSeen: subDays(now, 7),
        lastSeen: subHours(now, 3),
      },
      {
        ip: "194.147.140.10",
        country: "NL",
        threatScore: 78,
        attackTypes: ["Credential Stuffing"],
        firstSeen: subDays(now, 3),
        lastSeen: subHours(now, 4),
      },
    ];

    mockActors.forEach((actor) => {
      this.threatActors.set(actor.ip, {
        ...actor,
        id: uuidv4(),
        status: "active",
        requestCount: Math.floor(Math.random() * 100000) + 10000,
        blockedCount: Math.floor(Math.random() * 5000) + 1000,
        reputation: "malicious",
      });
    });

    // Mock IP reputation
    for (let i = 0; i < 100; i++) {
      const ip = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}`;
      this.ipReputation.set(ip, {
        score: Math.floor(Math.random() * 100),
        category: ["legitimate", "suspicious", "malicious"][
          Math.floor(Math.random() * 3)
        ],
        lastUpdated: now,
        sources: ["internal", "external"][Math.floor(Math.random() * 2)],
      });
    }
  }

  // Analyze IP address
  analyzeIP(ip, requestData = {}) {
    const analysis = {
      ip,
      timestamp: new Date(),
      reputation: this.getIPReputation(ip),
      threatActor: this.threatActors.get(ip),
      knownThreats: this.checkKnownThreats(ip),
      behavior: this.analyzeBehavior(ip, requestData),
      recommendations: [],
      threatScore: 0,
    };

    // Calculate threat score
    analysis.threatScore = this.calculateThreatScore(analysis);

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    // Update behavior profile
    this.updateBehaviorProfile(ip, requestData);

    return analysis;
  }

  // Get IP reputation
  getIPReputation(ip) {
    if (this.ipReputation.has(ip)) {
      return this.ipReputation.get(ip);
    }

    // Default reputation for unknown IPs
    return {
      score: 50,
      category: "unknown",
      lastUpdated: new Date(),
      sources: [],
    };
  }

  // Check known threats
  checkKnownThreats(ip) {
    const threats = [];

    // Check if IP is in known threat databases
    // This is simplified - in production, you would query external APIs
    if (ip.startsWith("185.220.101")) {
      threats.push(this.knownThreats.get("TOR_EXIT_NODE"));
    }

    if (ip.startsWith("45.155.205")) {
      threats.push(this.knownThreats.get("BOTNET"));
    }

    if (ip.startsWith("103.237.145")) {
      threats.push(this.knownThreats.get("SCANNER"));
    }

    return threats;
  }

  // Analyze behavior patterns
  analyzeBehavior(ip, requestData) {
    const profile =
      this.behaviorProfiles.get(ip) || this.createBehaviorProfile(ip);

    if (requestData.endpoint) {
      profile.requestCount++;
      profile.lastRequest = new Date();

      if (requestData.endpoint.includes("/auth")) {
        profile.authAttempts++;
      }

      if (requestData.statusCode >= 400) {
        profile.errorCount++;
      }

      // Update request frequency
      const now = Date.now();
      if (profile.lastRequestTime) {
        const timeDiff = now - profile.lastRequestTime;
        profile.requestFrequency.push(timeDiff);

        // Keep only last 100 measurements
        if (profile.requestFrequency.length > 100) {
          profile.requestFrequency.shift();
        }
      }
      profile.lastRequestTime = now;

      this.behaviorProfiles.set(ip, profile);
    }

    return {
      requestCount: profile.requestCount,
      authAttempts: profile.authAttempts,
      errorRate:
        profile.requestCount > 0
          ? profile.errorCount / profile.requestCount
          : 0,
      avgRequestFrequency: this.calculateAverageFrequency(
        profile.requestFrequency
      ),
      sessionDuration: profile.sessionStart
        ? (Date.now() - profile.sessionStart) / 1000
        : 0,
    };
  }

  // Create behavior profile
  createBehaviorProfile(ip) {
    return {
      ip,
      requestCount: 0,
      authAttempts: 0,
      errorCount: 0,
      requestFrequency: [],
      lastRequestTime: null,
      sessionStart: Date.now(),
      firstSeen: new Date(),
      lastSeen: new Date(),
    };
  }

  // Calculate average request frequency
  calculateAverageFrequency(frequencies) {
    if (frequencies.length === 0) return 0;

    const sum = frequencies.reduce((a, b) => a + b, 0);
    return sum / frequencies.length;
  }

  // Update behavior profile
  updateBehaviorProfile(ip, requestData) {
    if (!this.behaviorProfiles.has(ip)) {
      this.behaviorProfiles.set(ip, this.createBehaviorProfile(ip));
    }

    const profile = this.behaviorProfiles.get(ip);
    profile.lastSeen = new Date();

    if (requestData) {
      if (requestData.userAgent) {
        if (!profile.userAgents) profile.userAgents = new Set();
        profile.userAgents.add(requestData.userAgent);
      }

      if (requestData.country) {
        if (!profile.countries) profile.countries = new Set();
        profile.countries.add(requestData.country);
      }
    }

    this.behaviorProfiles.set(ip, profile);
  }

  // Calculate threat score
  calculateThreatScore(analysis) {
    let score = 0;

    // Reputation score (0-40 points)
    const reputationScore = analysis.reputation.score;
    score += (100 - reputationScore) * 0.4;

    // Known threats (0-30 points)
    if (analysis.knownThreats.length > 0) {
      const maxThreatRisk = Math.max(
        ...analysis.knownThreats.map((t) =>
          t.risk === "high" ? 3 : t.risk === "medium" ? 2 : 1
        )
      );
      score += maxThreatRisk * 10;
    }

    // Behavior analysis (0-20 points)
    const behavior = analysis.behavior;
    if (behavior.errorRate > 0.5) score += 10;
    if (behavior.authAttempts > 10) score += 10;

    // Request frequency (0-10 points)
    if (
      behavior.avgRequestFrequency > 0 &&
      behavior.avgRequestFrequency < 100
    ) {
      // Very frequent requests
      score += 10;
    }

    // Cap at 100
    return Math.min(Math.round(score), 100);
  }

  // Generate recommendations
  generateRecommendations(analysis) {
    const recommendations = [];
    const { threatScore, reputation, knownThreats, behavior } = analysis;

    if (threatScore >= 90) {
      recommendations.push({
        action: "block",
        confidence: 95,
        reason: "High threat score indicates malicious activity",
        priority: "critical",
      });
    } else if (threatScore >= 70) {
      recommendations.push({
        action: "throttle",
        confidence: 80,
        reason: "Suspicious activity detected",
        priority: "high",
      });
    } else if (reputation.category === "malicious") {
      recommendations.push({
        action: "challenge",
        confidence: 75,
        reason: "IP has poor reputation",
        priority: "medium",
      });
    }

    if (knownThreats.length > 0) {
      recommendations.push({
        action: "monitor",
        confidence: 90,
        reason: "IP matches known threat patterns",
        priority: "high",
      });
    }

    if (behavior.errorRate > 0.3) {
      recommendations.push({
        action: "throttle",
        confidence: 70,
        reason: "High error rate suggests probing or scanning",
        priority: "medium",
      });
    }

    // Default recommendation if none others apply
    if (recommendations.length === 0 && threatScore > 50) {
      recommendations.push({
        action: "monitor",
        confidence: 60,
        reason: "Moderate risk level warrants monitoring",
        priority: "low",
      });
    }

    return recommendations;
  }

  // Get all threat actors
  getAllThreatActors(limit = 50, filters = {}) {
    let actors = Array.from(this.threatActors.values());

    // Apply filters
    if (filters.minScore) {
      actors = actors.filter((a) => a.threatScore >= filters.minScore);
    }

    if (filters.country) {
      actors = actors.filter((a) => a.country === filters.country);
    }

    if (filters.status) {
      actors = actors.filter((a) => a.status === filters.status);
    }

    // Sort by threat score (descending)
    actors.sort((a, b) => b.threatScore - a.threatScore);

    return actors.slice(0, limit);
  }

  // Get threat actor by IP
  getThreatActor(ip) {
    return this.threatActors.get(ip);
  }

  // Update threat actor status
  updateThreatActorStatus(ip, status, notes = "") {
    if (this.threatActors.has(ip)) {
      const actor = this.threatActors.get(ip);
      actor.status = status;
      actor.notes = notes;
      actor.updatedAt = new Date();

      if (status === "blocked") {
        actor.blockedAt = new Date();
      }

      this.threatActors.set(ip, actor);
      return true;
    }
    return false;
  }

  // Add new threat actor
  addThreatActor(ip, data) {
    const actor = {
      id: uuidv4(),
      ip,
      threatScore: data.threatScore || this.calculateInitialThreatScore(data),
      country: data.country || "Unknown",
      attackTypes: data.attackTypes || [],
      status: "active",
      requestCount: 0,
      blockedCount: 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
      reputation: data.reputation || "unknown",
      ...data,
    };

    this.threatActors.set(ip, actor);
    return actor;
  }

  // Calculate initial threat score
  calculateInitialThreatScore(data) {
    let score = 50; // Base score

    if (data.reputation === "malicious") score += 30;
    if (data.reputation === "suspicious") score += 15;

    if (data.attackTypes && data.attackTypes.length > 0) {
      score += data.attackTypes.length * 5;
    }

    return Math.min(score, 100);
  }

  // Get threat statistics
  getThreatStatistics(timeRange = "24h") {
    const now = new Date();
    let cutoffTime;

    switch (timeRange) {
      case "1h":
        cutoffTime = subHours(now, 1);
        break;
      case "6h":
        cutoffTime = subHours(now, 6);
        break;
      case "24h":
        cutoffTime = subHours(now, 24);
        break;
      case "7d":
        cutoffTime = subHours(now, 168);
        break;
      default:
        cutoffTime = subHours(now, 24);
    }

    const recentActors = Array.from(this.threatActors.values()).filter(
      (a) => new Date(a.lastSeen) > cutoffTime
    );

    const stats = {
      total: recentActors.length,
      active: recentActors.filter((a) => a.status === "active").length,
      blocked: recentActors.filter((a) => a.status === "blocked").length,
      monitoring: recentActors.filter((a) => a.status === "monitoring").length,
      byCountry: new Map(),
      byAttackType: new Map(),
      avgThreatScore: 0,
      topThreats: [],
    };

    if (recentActors.length > 0) {
      // Calculate statistics
      recentActors.forEach((actor) => {
        // Count by country
        const countryCount = stats.byCountry.get(actor.country) || 0;
        stats.byCountry.set(actor.country, countryCount + 1);

        // Count by attack type
        actor.attackTypes.forEach((type) => {
          const typeCount = stats.byAttackType.get(type) || 0;
          stats.byAttackType.set(type, typeCount + 1);
        });
      });

      // Calculate average threat score
      const totalScore = recentActors.reduce(
        (sum, actor) => sum + actor.threatScore,
        0
      );
      stats.avgThreatScore = Math.round(totalScore / recentActors.length);

      // Get top threats
      stats.topThreats = recentActors
        .sort((a, b) => b.threatScore - a.threatScore)
        .slice(0, 5);
    }

    return stats;
  }

  // Export threat data
  exportThreatData(format = "json") {
    const data = {
      timestamp: new Date().toISOString(),
      threatActors: Array.from(this.threatActors.values()),
      ipReputation: Array.from(this.ipReputation.entries()).map(
        ([ip, data]) => ({ ip, ...data })
      ),
      statistics: this.getThreatStatistics("7d"),
    };

    return format === "csv" ? this.convertToCSV(data) : data;
  }

  // Convert data to CSV
  convertToCSV(data) {
    let csv = "";

    // Threat actors CSV
    csv += "Threat Actors\n";
    csv += "IP,Country,Threat Score,Status,Attack Types,First Seen,Last Seen\n";
    data.threatActors.forEach((actor) => {
      csv += `${actor.ip},${actor.country},${actor.threatScore},${
        actor.status
      },"${actor.attackTypes.join(";")}",${actor.firstSeen},${
        actor.lastSeen
      }\n`;
    });

    // IP reputation CSV
    csv += "\nIP Reputation\n";
    csv += "IP,Score,Category,Last Updated\n";
    data.ipReputation.forEach((reputation) => {
      csv += `${reputation.ip},${reputation.score},${reputation.category},${reputation.lastUpdated}\n`;
    });

    return csv;
  }

  // Clean up old data
  cleanupOldData(maxAgeDays = 30) {
    const cutoffDate = subDays(new Date(), maxAgeDays);
    let cleanedCount = 0;

    // Clean old threat actors
    for (const [ip, actor] of this.threatActors.entries()) {
      if (new Date(actor.lastSeen) < cutoffDate && actor.status !== "blocked") {
        this.threatActors.delete(ip);
        cleanedCount++;
      }
    }

    // Clean old behavior profiles
    for (const [ip, profile] of this.behaviorProfiles.entries()) {
      if (new Date(profile.lastSeen) < cutoffDate) {
        this.behaviorProfiles.delete(ip);
      }
    }

    logger.info(`Cleaned up ${cleanedCount} old threat actors`);
    return cleanedCount;
  }
}

module.exports = ThreatIntelligenceService;
