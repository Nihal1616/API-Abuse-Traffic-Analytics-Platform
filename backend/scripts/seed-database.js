require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

// Import models
const User = require("../models/User");
const ApiRequest = require("../models/ApiRequest");
const ThreatActor = require("../models/ThreatActor");
const Anomaly = require("../models/Anomaly");
const ActionRecommendation = require("../models/ActionRecommendation");
const SystemConfig = require("../models/SystemConfig");
const ThreatIntel = require("../models/ThreatIntel");
const AuditLog = require("../models/AuditLog");
const RateLimitRule = require("../models/RateLimitRule");

class DatabaseSeeder {
  constructor() {
    this.userCount = 5;
    this.requestCount = 10000;
    this.threatActorCount = 50;
    this.anomalyCount = 200;
    this.recommendationCount = 30;
    this.auditLogCount = 1000;
  }

  async connect() {
    const tried = [];
    const baseLocal = "mongodb://localhost:27017/apishield";
    const primary = process.env.MONGODB_URI;

    if (primary) tried.push(primary);

    // Try admin/root credentials if provided
    if (process.env.MONGO_ROOT_PASSWORD) {
      tried.push(
        `mongodb://admin:${process.env.MONGO_ROOT_PASSWORD}@localhost:27017/apishield?authSource=admin`
      );
    }

    // Try application user if provided by env
    if (process.env.MONGO_PASSWORD) {
      tried.push(
        `mongodb://apishield:${process.env.MONGO_PASSWORD}@localhost:27017/apishield?authSource=apishield`
      );
    }

    // Always include a no-auth local fallback
    tried.push(baseLocal);

    for (const uri of tried) {
      try {
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        logger.info(`Connected to MongoDB for seeding using ${uri}`);
        return;
      } catch (err) {
        logger.warn(`Connection attempt failed for ${uri}: ${err.message}`);
      }
    }

    logger.error("Failed to connect to MongoDB after trying all URIs");
    process.exit(1);
  }

  async clearDatabase() {
    logger.info("Clearing database...");

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    logger.info("Database cleared");
  }

  async seedUsers() {
    logger.info("Seeding users...");

    const users = [
      {
        email: "admin@apishield.com",
        password: "admin123",
        name: "System Administrator",
        role: "admin",
        permissions: ["all"],
      },
      {
        email: "security@apishield.com",
        password: "security123",
        name: "Security Analyst",
        role: "security",
        permissions: ["view", "monitor", "block", "analyze"],
      },
      {
        email: "viewer@apishield.com",
        password: "viewer123",
        name: "View Only User",
        role: "viewer",
        permissions: ["view"],
      },
    ];

    for (const userData of users) {
      const passwordHash = await bcrypt.hash(userData.password, 12);
      await User.create({
        email: userData.email,
        passwordHash,
        name: userData.name,
        role: userData.role,
        permissions: userData.permissions,
        lastLogin: faker.date.recent(),
      });
    }

    // Create additional random users
    for (let i = 0; i < this.userCount - 3; i++) {
      const passwordHash = await bcrypt.hash("password123", 12);
      await User.create({
        email: faker.internet.email(),
        passwordHash,
        name: faker.person.fullName(),
        role: faker.helpers.arrayElement(["viewer", "security"]),
        permissions: faker.helpers.arrayElements(
          ["view", "monitor", "analyze"],
          2
        ),
        lastLogin: faker.date.recent(),
        isActive: faker.datatype.boolean(0.8),
      });
    }

    logger.info(`Created ${this.userCount} users`);
  }

  async seedThreatActors() {
    logger.info("Seeding threat actors...");

    const countries = [
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
    const attackTypes = [
      "DDoS",
      "SQL Injection",
      "XSS",
      "Credential Stuffing",
      "Scraping",
      "API Abuse",
    ];

    for (let i = 0; i < this.threatActorCount; i++) {
      const threatScore =
        i < 5
          ? faker.number.int({ min: 90, max: 98 })
          : i < 15
          ? faker.number.int({ min: 70, max: 89 })
          : faker.number.int({ min: 30, max: 69 });

      const status =
        threatScore > 90
          ? "active"
          : i < 10
          ? "blocked"
          : i < 20
          ? "monitoring"
          : "active";

      const firstSeen = faker.date.past({ years: 1 });
      const lastSeen = faker.date.between({ from: firstSeen, to: new Date() });

      await ThreatActor.create({
        ipAddress: faker.internet.ip(),
        countryCode: faker.helpers.arrayElement(countries),
        threatScore,
        status,
        requestCount: faker.number.int({ min: 100, max: 100000 }),
        blockedCount: faker.number.int({ min: 10, max: 10000 }),
        errorCount: faker.number.int({ min: 0, max: 5000 }),
        attackTypes: faker.helpers.arrayElements(
          attackTypes,
          faker.number.int({ min: 1, max: 3 })
        ),
        firstSeen,
        lastSeen,
        reputation:
          threatScore > 80
            ? "malicious"
            : threatScore > 60
            ? "suspicious"
            : "neutral",
        tags: faker.helpers.arrayElements(
          ["botnet", "scanner", "proxy", "vpn", "tor"],
          2
        ),
      });
    }

    logger.info(`Created ${this.threatActorCount} threat actors`);
  }

  async seedApiRequests() {
    logger.info("Seeding API requests...");

    const endpoints = [
      "/api/v1/users",
      "/api/v1/products",
      "/api/v1/orders",
      "/api/v1/auth/login",
      "/api/v1/payments",
      "/api/v1/admin/dashboard",
      "/api/v1/health",
      "/api/v1/config",
    ];

    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    const statusCodes = [200, 200, 200, 200, 404, 401, 500, 429, 403];

    const threatActors = await ThreatActor.find().limit(20);
    const threatActorIds = threatActors.map((actor) => actor._id);

    for (let i = 0; i < this.requestCount; i++) {
      const timestamp = faker.date.between({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      });

      const statusCode = faker.helpers.arrayElement(statusCodes);
      const isBlocked =
        statusCode === 429 ||
        statusCode === 403 ||
        faker.datatype.boolean(0.05);
      const threatScore = isBlocked
        ? faker.number.int({ min: 70, max: 95 })
        : statusCode >= 400
        ? faker.number.int({ min: 30, max: 60 })
        : faker.number.int({ min: 0, max: 30 });

      const threatActorId =
        threatScore > 50 ? faker.helpers.arrayElement(threatActorIds) : null;

      await ApiRequest.create({
        timestamp,
        method: faker.helpers.arrayElement(methods),
        endpoint: faker.helpers.arrayElement(endpoints),
        statusCode,
        responseTime: faker.number.int({ min: 50, max: 2000 }),
        ipAddress: faker.internet.ip(),
        countryCode: faker.location.countryCode(),
        userAgent: faker.internet.userAgent(),
        isBlocked,
        threatScore,
        anomalyScore: faker.number.int({ min: 0, max: 100 }),
        threatActorId,
        metadata: {
          sessionId: faker.string.uuid(),
          userId: faker.string.uuid(),
          requestSize: faker.number.int({ min: 100, max: 10000 }),
        },
      });
    }

    logger.info(`Created ${this.requestCount} API requests`);
  }

  async seedAnomalies() {
    logger.info("Seeding anomalies...");

    const types = [
      "rate_spike",
      "pattern_anomaly",
      "geo_anomaly",
      "credential_stuffing",
      "scraping",
      "ddos",
    ];
    const severities = ["low", "medium", "high", "critical"];
    const endpoints = [
      "/api/v1/auth/login",
      "/api/v1/users",
      "/api/v1/products",
      "/api/v1/payments",
    ];

    const threatActors = await ThreatActor.find({
      threatScore: { $gt: 70 },
    }).limit(10);

    for (let i = 0; i < this.anomalyCount; i++) {
      const severity =
        i < 10 ? "critical" : i < 30 ? "high" : i < 80 ? "medium" : "low";

      const status =
        severity === "critical" && i < 5
          ? "detected"
          : i < 50
          ? "resolved"
          : i < 70
          ? "investigating"
          : "false_positive";

      const timestamp = faker.date.recent({ days: 30 });
      const resolvedAt =
        status === "resolved"
          ? faker.date.between({ from: timestamp, to: new Date() })
          : null;

      await Anomaly.create({
        type: faker.helpers.arrayElement(types),
        severity,
        title: `${severity.toUpperCase()} ${faker.helpers
          .arrayElement(types)
          .replace("_", " ")} detected`,
        description: faker.lorem.sentence(),
        timestamp,
        endpoint: faker.helpers.arrayElement(endpoints),
        sourceIp: faker.internet.ip(),
        threatActorId: faker.datatype.boolean(0.3)
          ? faker.helpers.arrayElement(threatActors.map((a) => a._id))
          : null,
        confidence: faker.number.int({ min: 60, max: 95 }),
        recommendation: faker.lorem.paragraph(),
        collateralDamage: {
          legitimateTrafficPercent: faker.number.int({ min: 0, max: 20 }),
          affectedUsers: faker.number.int({ min: 0, max: 1000 }),
          estimatedDamage: faker.lorem.sentence(),
        },
        status,
        priority: severity,
        resolvedAt,
        resolvedBy: status === "resolved" ? "admin@apishield.com" : null,
        resolutionNotes: status === "resolved" ? faker.lorem.sentence() : null,
        metrics: {
          requestCount: faker.number.int({ min: 100, max: 10000 }),
          errorCount: faker.number.int({ min: 0, max: 1000 }),
          responseTimeAvg: faker.number.int({ min: 100, max: 1000 }),
          responseTimeMax: faker.number.int({ min: 500, max: 5000 }),
          uniqueIPs: faker.number.int({ min: 1, max: 100 }),
          uniqueEndpoints: faker.number.int({ min: 1, max: 5 }),
        },
      });
    }

    logger.info(`Created ${this.anomalyCount} anomalies`);
  }

  async seedActionRecommendations() {
    logger.info("Seeding action recommendations...");

    const actions = ["block", "throttle", "challenge", "monitor", "whitelist"];
    const targetTypes = ["ip", "endpoint", "user"];
    const statuses = ["pending", "applied", "rejected", "expired"];

    const anomalies = await Anomaly.find({
      severity: { $in: ["high", "critical"] },
    }).limit(20);

    for (let i = 0; i < this.recommendationCount; i++) {
      const confidence =
        i < 5
          ? faker.number.int({ min: 90, max: 98 })
          : i < 15
          ? faker.number.int({ min: 75, max: 89 })
          : faker.number.int({ min: 50, max: 74 });

      const status =
        confidence > 85
          ? "applied"
          : i < 10
          ? "pending"
          : i < 20
          ? "rejected"
          : "expired";

      const appliedAt = status === "applied" ? faker.date.recent() : null;

      await ActionRecommendation.create({
        action: faker.helpers.arrayElement(actions),
        targetType: faker.helpers.arrayElement(targetTypes),
        target: faker.internet.ip(),
        reason: faker.lorem.sentence(),
        confidence,
        priority: confidence > 80 ? "high" : confidence > 60 ? "medium" : "low",
        estimatedImpact: faker.lorem.sentence(),
        collateralDamage: {
          affectedUsers: faker.number.int({ min: 0, max: 500 }),
          affectedRequests: faker.number.int({ min: 0, max: 10000 }),
          legitimateTrafficPercent: faker.number.int({ min: 0, max: 15 }),
          businessImpact: faker.helpers.arrayElement([
            "none",
            "low",
            "medium",
            "high",
          ]),
        },
        source: faker.helpers.arrayElement(["ai", "rule", "manual"]),
        sourceDetails: {
          anomalyId: faker.datatype.boolean(0.4)
            ? faker.helpers.arrayElement(anomalies.map((a) => a._id))
            : null,
        },
        status,
        appliedBy: status === "applied" ? "admin@apishield.com" : null,
        appliedAt,
        expiresAt: faker.date.future(),
        tags: faker.helpers.arrayElements(
          ["urgent", "review", "auto-generated"],
          2
        ),
      });
    }

    logger.info(`Created ${this.recommendationCount} action recommendations`);
  }

  async seedSystemConfig() {
    logger.info("Seeding system configuration...");

    await SystemConfig.initializeDefaultConfig();
    logger.info("System configuration initialized");
  }

  async seedThreatIntel() {
    logger.info("Seeding threat intelligence...");

    const intelData = [
      {
        type: "ip",
        value: "185.220.101.33",
        risk: "high",
        category: "tor_exit",
        source: "external",
        description: "Tor exit node",
        confidence: 90,
      },
      {
        type: "ip",
        value: "45.155.205.233",
        risk: "critical",
        category: "botnet",
        source: "external",
        description: "Known botnet IP",
        confidence: 95,
      },
      {
        type: "ip_range",
        value: "103.237.145.0/24",
        risk: "medium",
        category: "scanner",
        source: "external",
        description: "Network scanning range",
        confidence: 75,
      },
      {
        type: "domain",
        value: "malicious-site.com",
        risk: "high",
        category: "phishing",
        source: "external",
        description: "Phishing domain",
        confidence: 85,
      },
      {
        type: "user_agent",
        value: "BadBot/1.0",
        risk: "medium",
        category: "crawler",
        source: "internal",
        description: "Malicious crawler",
        confidence: 70,
      },
    ];

    for (const intel of intelData) {
      await ThreatIntel.create({
        ...intel,
        firstSeen: faker.date.past(),
        lastSeen: faker.date.recent(),
        isActive: true,
        tags: [intel.category],
        mitigation: "Block and monitor",
      });
    }

    logger.info("Created threat intelligence entries");
  }

  async seedAuditLogs() {
    logger.info("Seeding audit logs...");

    const actions = [
      "login",
      "logout",
      "config_update",
      "user_create",
      "user_delete",
      "ip_block",
      "rule_update",
    ];
    const resources = [
      "/api/admin/login",
      "/api/admin/config",
      "/api/admin/users",
      "/api/security/actions",
    ];
    const users = await User.find().limit(5);

    for (let i = 0; i < this.auditLogCount; i++) {
      const user = faker.helpers.arrayElement(users);
      const action = faker.helpers.arrayElement(actions);

      await AuditLog.create({
        userId: user._id,
        userEmail: user.email,
        action,
        resource: faker.helpers.arrayElement(resources),
        resourceId: faker.string.uuid(),
        details: `${action} performed by ${user.email}`,
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        status: faker.datatype.boolean(0.9) ? "success" : "failed",
        severity:
          action.includes("delete") || action.includes("block")
            ? "warning"
            : "info",
        changes: {
          field: faker.helpers.arrayElement([
            "email",
            "role",
            "status",
            "config",
          ]),
          oldValue: faker.word.sample(),
          newValue: faker.word.sample(),
        },
        duration: faker.number.int({ min: 10, max: 1000 }),
      });
    }

    logger.info(`Created ${this.auditLogCount} audit logs`);
  }

  async seedRateLimitRules() {
    logger.info("Seeding rate limit rules...");

    const rules = [
      {
        name: "api-global",
        description: "Global API rate limit",
        zone: "api_global",
        rate: "1000r/m",
        burst: 50,
        nodelay: true,
        pathPattern: "^/api/",
        methods: ["ALL"],
        priority: 0,
      },
      {
        name: "auth-strict",
        description: "Strict rate limit for auth endpoints",
        zone: "auth_strict",
        rate: "100r/m",
        burst: 10,
        pathPattern: "^/api/v1/auth/",
        methods: ["POST"],
        priority: 10,
        conditions: {
          ipBlacklist: ["185.220.101.33", "45.155.205.233"],
        },
      },
      {
        name: "admin-protected",
        description: "Protected admin endpoints",
        zone: "admin_protected",
        rate: "50r/m",
        burst: 5,
        pathPattern: "^/api/admin/",
        methods: ["ALL"],
        priority: 20,
        conditions: {
          ipWhitelist: ["192.168.1.0/24", "10.0.0.0/8"],
        },
      },
    ];

    for (const rule of rules) {
      await RateLimitRule.create(rule);
    }

    logger.info("Created rate limit rules");
  }

  async seedAll() {
    try {
      await this.connect();
      await this.clearDatabase();

      await this.seedUsers();
      await this.seedThreatActors();
      await this.seedApiRequests();
      await this.seedAnomalies();
      await this.seedActionRecommendations();
      await this.seedSystemConfig();
      await this.seedThreatIntel();
      await this.seedAuditLogs();
      await this.seedRateLimitRules();

      logger.info("Database seeding completed successfully");
      process.exit(0);
    } catch (error) {
      // Provide actionable guidance for auth failures
      if (
        (error &&
          error.message &&
          error.message.includes("requires authentication")) ||
        error.code === 13 ||
        error.code === 18
      ) {
        logger.error(
          "Database seeding failed due to MongoDB authentication/authorization. Check your .env and docker-compose settings."
        );
        logger.error(
          "If you're running MongoDB via Docker, ensure MONGO_ROOT_PASSWORD and MONGO_PASSWORD in backend/.env match docker-compose.yml and re-initialize the DB."
        );
        logger.error(
          "Alternatively, set MONGODB_URI in backend/.env to a valid URI with credentials: mongodb://user:pass@localhost:27017/apishield?authSource=admin"
        );
      } else {
        logger.error("Database seeding failed:", error);
      }
      process.exit(1);
    }
  }
}

// Run seeder
const seeder = new DatabaseSeeder();
seeder.seedAll();
