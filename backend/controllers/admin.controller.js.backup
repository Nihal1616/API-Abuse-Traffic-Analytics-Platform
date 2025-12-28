const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");
const { v4: uuidv4 } = require("uuid");

class AdminController {
  constructor() {
    // Mock admin users (in production, use database)
    this.adminUsers = new Map([
      [
        "admin@apishield.com",
        {
          id: "admin_001",
          email: "admin@apishield.com",
          passwordHash:
            "$2a$12$K8L9r7t6s5v4w3y2z1x0c.vb/nmkl,jhgfdsaqwertyuiop", // "admin123"
          role: "admin",
          name: "System Administrator",
          lastLogin: null,
          createdAt: new Date(),
          permissions: ["all"],
        },
      ],
      [
        "security@apishield.com",
        {
          id: "admin_002",
          email: "security@apishield.com",
          passwordHash:
            "$2a$12$K8L9r7t6s5v4w3y2z1x0c.vb/nmkl,jhgfdsaqwertyuiop", // "security123"
          role: "security",
          name: "Security Analyst",
          lastLogin: null,
          createdAt: new Date(),
          permissions: ["view", "monitor", "block"],
        },
      ],
    ]);

    // Mock system configuration
    this.systemConfig = {
      security: {
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 100,
          burstLimit: 20,
        },
        ipBlocking: {
          enabled: true,
          autoBlockThreshold: 90,
          blockDuration: "24h",
        },
        anomalyDetection: {
          enabled: true,
          sensitivity: "medium",
          alertThreshold: 75,
        },
        logging: {
          enabled: true,
          retentionDays: 30,
          alertLevel: "medium",
        },
      },
      monitoring: {
        endpoints: [
          { path: "/api/v1/auth/login", priority: "high" },
          { path: "/api/v1/users", priority: "medium" },
          { path: "/api/v1/orders", priority: "medium" },
        ],
        checkInterval: 60, // seconds
        alertChannels: ["email", "slack"],
      },
      notifications: {
        email: {
          enabled: true,
          from: "alerts@apishield.com",
          recipients: ["admin@apishield.com"],
        },
        slack: {
          enabled: false,
          webhookUrl: "",
        },
        thresholds: {
          critical: 90,
          high: 70,
          medium: 50,
        },
      },
      general: {
        maintenanceMode: false,
        apiVersion: "1.0.0",
        timezone: "UTC",
        dataRetention: 90, // days
      },
    };

    // Mock audit logs
    this.auditLogs = [];
    this.initializeAuditLogs();
  }

  // Initialize mock audit logs
  initializeAuditLogs() {
    const actions = [
      "login",
      "logout",
      "config_update",
      "user_create",
      "user_delete",
      "ip_block",
      "rule_update",
    ];
    const users = ["admin@apishield.com", "security@apishield.com", "system"];

    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      this.auditLogs.push({
        id: uuidv4(),
        timestamp,
        userId: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        resource: `/api/${
          ["security", "users", "config"][Math.floor(Math.random() * 3)]
        }`,
        details: `Action performed by user`,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
          Math.random() * 255
        )}`,
        userAgent: `Browser/${Math.floor(Math.random() * 100)}`,
        status: Math.random() > 0.1 ? "success" : "failed",
      });
    }

    // Sort by timestamp (newest first)
    this.auditLogs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Admin login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required",
        });
      }

      const user = this.adminUsers.get(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
      }

      // In production, use bcrypt.compare
      // For demo, we'll use a simple check
      const isValidPassword =
        password === "admin123" || password === "security123";

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
      }

      // Update last login
      user.lastLogin = new Date();

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      // Log the login
      this.addAuditLog({
        userId: user.email,
        action: "login",
        resource: "/api/admin/login",
        details: "Admin login successful",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status: "success",
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
            lastLogin: user.lastLogin,
          },
        },
      });
    } catch (error) {
      logger.error("Admin login error:", error);
      res.status(500).json({
        success: false,
        error: "Login failed",
      });
    }
  }

  // Admin logout
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      // In production, you might blacklist the token

      this.addAuditLog({
        userId: req.user.email,
        action: "logout",
        resource: "/api/admin/logout",
        details: "Admin logout",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status: "success",
      });

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      logger.error("Admin logout error:", error);
      res.status(500).json({
        success: false,
        error: "Logout failed",
      });
    }
  }

  // Get session info
  async getSession(req, res) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user,
          session: {
            issuedAt: new Date(),
            expiresIn: "24h",
          },
        },
      });
    } catch (error) {
      logger.error("Get session error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get session",
      });
    }
  }

  // Get system configuration
  async getConfig(req, res) {
    try {
      res.json({
        success: true,
        data: this.systemConfig,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Get config error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get configuration",
      });
    }
  }

  // Update system configuration
  async updateConfig(req, res) {
    try {
      const updates = req.body;

      if (!updates || typeof updates !== "object") {
        return res.status(400).json({
          success: false,
          error: "Invalid configuration data",
        });
      }

      // Deep merge updates
      this.deepMerge(this.systemConfig, updates);

      // Log the update
      this.addAuditLog({
        userId: req.user.email,
        action: "config_update",
        resource: "/api/admin/config",
        details: "System configuration updated",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status: "success",
        changes: updates,
      });

      res.json({
        success: true,
        data: this.systemConfig,
        message: "Configuration updated successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Update config error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update configuration",
      });
    }
  }

  // Get security configuration
  async getSecurityConfig(req, res) {
    try {
      res.json({
        success: true,
        data: this.systemConfig.security,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Get security config error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get security configuration",
      });
    }
  }

  // Get all users
  async getUsers(req, res) {
    try {
      const users = Array.from(this.adminUsers.values()).map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        permissions: user.permissions,
      }));

      res.json({
        success: true,
        data: users,
        count: users.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Get users error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get users",
      });
    }
  }

  // Create new user
  async createUser(req, res) {
    try {
      const { email, password, name, role, permissions } = req.body;

      if (!email || !password || !name || !role) {
        return res.status(400).json({
          success: false,
          error: "Email, password, name, and role are required",
        });
      }

      if (this.adminUsers.has(email)) {
        return res.status(400).json({
          success: false,
          error: "User already exists",
        });
      }

      // Hash password (in production)
      const passwordHash = await bcrypt.hash(password, 12);

      const newUser = {
        id: uuidv4(),
        email,
        passwordHash,
        name,
        role,
        permissions: permissions || ["view"],
        lastLogin: null,
        createdAt: new Date(),
      };

      this.adminUsers.set(email, newUser);

      // Log the creation
      this.addAuditLog({
        userId: req.user.email,
        action: "user_create",
        resource: "/api/admin/users",
        details: `Created new user: ${email}`,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status: "success",
        changes: { email, role },
      });

      res.status(201).json({
        success: true,
        data: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        message: "User created successfully",
      });
    } catch (error) {
      logger.error("Create user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create user",
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const updates = req.body;

      // Find user by ID
      let userToUpdate = null;
      let userEmail = null;

      for (const [email, user] of this.adminUsers.entries()) {
        if (user.id === userId) {
          userToUpdate = user;
          userEmail = email;
          break;
        }
      }

      if (!userToUpdate) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Don't allow self-demotion
      if (
        req.user.id === userId &&
        updates.role &&
        updates.role !== userToUpdate.role
      ) {
        return res.status(403).json({
          success: false,
          error: "Cannot change your own role",
        });
      }

      // Update user
      if (updates.name) userToUpdate.name = updates.name;
      if (updates.role) userToUpdate.role = updates.role;
      if (updates.permissions) userToUpdate.permissions = updates.permissions;

      if (updates.password) {
        userToUpdate.passwordHash = await bcrypt.hash(updates.password, 12);
      }

      userToUpdate.updatedAt = new Date();

      // Log the update
      this.addAuditLog({
        userId: req.user.email,
        action: "user_update",
        resource: `/api/admin/users/${userId}`,
        details: `Updated user: ${userEmail}`,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status: "success",
        changes: updates,
      });

      res.json({
        success: true,
        data: {
          id: userToUpdate.id,
          email: userEmail,
          name: userToUpdate.name,
          role: userToUpdate.role,
          updatedAt: userToUpdate.updatedAt,
        },
        message: "User updated successfully",
      });
    } catch (error) {
      logger.error("Update user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user",
      });
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      // Find user by ID
      let userToDelete = null;
      let userEmail = null;

      for (const [email, user] of this.adminUsers.entries()) {
        if (user.id === userId) {
          userToDelete = user;
          userEmail = email;
          break;
        }
      }

      if (!userToDelete) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Don't allow self-deletion
      if (req.user.id === userId) {
        return res.status(403).json({
          success: false,
          error: "Cannot delete your own account",
        });
      }

      // Don't allow deletion of last admin
      if (userToDelete.role === "admin") {
        const adminCount = Array.from(this.adminUsers.values()).filter(
          (u) => u.role === "admin"
        ).length;

        if (adminCount <= 1) {
          return res.status(403).json({
            success: false,
            error: "Cannot delete the last admin user",
          });
        }
      }

      // Delete user
      this.adminUsers.delete(userEmail);

      // Log the deletion
      this.addAuditLog({
        userId: req.user.email,
        action: "user_delete",
        resource: `/api/admin/users/${userId}`,
        details: `Deleted user: ${userEmail}`,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status: "success",
        changes: { deletedUser: userEmail },
      });

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      logger.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete user",
      });
    }
  }

  // Get audit logs
  async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        userId,
        startDate,
        endDate,
        status,
      } = req.query;

      let filteredLogs = [...this.auditLogs];

      // Apply filters
      if (action) {
        filteredLogs = filteredLogs.filter((log) => log.action === action);
      }

      if (userId) {
        filteredLogs = filteredLogs.filter((log) => log.userId === userId);
      }

      if (status) {
        filteredLogs = filteredLogs.filter((log) => log.status === status);
      }

      if (startDate) {
        const start = new Date(startDate);
        filteredLogs = filteredLogs.filter(
          (log) => new Date(log.timestamp) >= start
        );
      }

      if (endDate) {
        const end = new Date(endDate);
        filteredLogs = filteredLogs.filter(
          (log) => new Date(log.timestamp) <= end
        );
      }

      // Pagination
      const total = filteredLogs.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);

      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: endIndex < total,
          hasPrev: startIndex > 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Get audit logs error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get audit logs",
      });
    }
  }

  // Get specific audit log
  async getAuditLog(req, res) {
    try {
      const logId = req.params.id;
      const log = this.auditLogs.find((l) => l.id === logId);

      if (!log) {
        return res.status(404).json({
          success: false,
          error: "Audit log not found",
        });
      }

      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      logger.error("Get audit log error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get audit log",
      });
    }
  }

  // Export audit logs
  async exportAuditLogs(req, res) {
    try {
      const format = req.query.format || "json";
      const filteredLogs = this.applyAuditLogFilters(req.query);

      if (format === "csv") {
        let csv =
          "Timestamp,User ID,Action,Resource,Details,IP,User Agent,Status\n";

        filteredLogs.forEach((log) => {
          csv += `${log.timestamp},${log.userId},${log.action},${log.resource},"${log.details}",${log.ip},${log.userAgent},${log.status}\n`;
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=audit_logs_${Date.now()}.csv`
        );
        return res.send(csv);
      }

      res.json({
        success: true,
        data: filteredLogs,
        count: filteredLogs.length,
        exportedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Export audit logs error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to export audit logs",
      });
    }
  }

  // Get system health
  async getSystemHealth(req, res) {
    try {
      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          api: {
            status: "up",
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
          },
          database: {
            status: "up",
            connection: "established",
          },
          redis: {
            status: "up",
            memory: "64MB used",
          },
          monitoring: {
            status: "up",
            metricsCollected: Math.floor(Math.random() * 10000) + 5000,
          },
        },
        metrics: {
          requestsPerMinute: Math.floor(Math.random() * 100) + 50,
          errorRate: (Math.random() * 2).toFixed(2),
          responseTime: Math.floor(Math.random() * 100) + 50,
          activeConnections: Math.floor(Math.random() * 500) + 200,
        },
        alerts: {
          critical: Math.floor(Math.random() * 3),
          warning: Math.floor(Math.random() * 5),
          info: Math.floor(Math.random() * 10),
        },
      };

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      logger.error("Get system health error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get system health",
      });
    }
  }

  // Get system statistics
  async getSystemStats(req, res) {
    try {
      const stats = {
        general: {
          uptime: process.uptime(),
          version: "1.0.0",
          nodeVersion: process.version,
          platform: process.platform,
        },
        performance: {
          cpuUsage: process.cpuUsage(),
          memoryUsage: process.memoryUsage(),
          heapTotal: process.memoryUsage().heapTotal,
          heapUsed: process.memoryUsage().heapUsed,
          rss: process.memoryUsage().rss,
        },
        requests: {
          total: Math.floor(Math.random() * 1000000) + 500000,
          today: Math.floor(Math.random() * 10000) + 5000,
          active: Math.floor(Math.random() * 500) + 100,
        },
        security: {
          threatsBlocked: Math.floor(Math.random() * 5000) + 1000,
          anomaliesDetected: Math.floor(Math.random() * 1000) + 100,
          activeThreats: Math.floor(Math.random() * 50) + 10,
        },
        storage: {
          logsSize: (Math.random() * 1024).toFixed(2) + " MB",
          dataSize: (Math.random() * 5120).toFixed(2) + " MB",
          available: (Math.random() * 10240).toFixed(2) + " MB",
        },
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Get system stats error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get system statistics",
      });
    }
  }

  // Get system logs
  async getSystemLogs(req, res) {
    try {
      const { level, limit = 100 } = req.query;
      const logs = this.generateMockLogs(parseInt(limit));

      if (level) {
        const filteredLogs = logs.filter((log) => log.level === level);
        return res.json({
          success: true,
          data: filteredLogs,
          count: filteredLogs.length,
        });
      }

      res.json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      logger.error("Get system logs error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get system logs",
      });
    }
  }

  // Get system alerts
  async getSystemAlerts(req, res) {
    try {
      const { severity, resolved } = req.query;
      const alerts = this.generateMockAlerts();

      let filteredAlerts = [...alerts];

      if (severity) {
        filteredAlerts = filteredAlerts.filter(
          (alert) => alert.severity === severity
        );
      }

      if (resolved !== undefined) {
        const isResolved = resolved === "true";
        filteredAlerts = filteredAlerts.filter(
          (alert) => alert.resolved === isResolved
        );
      }

      res.json({
        success: true,
        data: filteredAlerts,
        count: filteredAlerts.length,
      });
    } catch (error) {
      logger.error("Get system alerts error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get system alerts",
      });
    }
  }

  // Create backup
  async createBackup(req, res) {
    try {
      const backupId = uuidv4();
      const timestamp = new Date();

      const backup = {
        id: backupId,
        timestamp,
        type: req.body.type || "full",
        size: (Math.random() * 500 + 100).toFixed(2) + " MB",
        status: "completed",
        location: `/backups/${backupId}.tar.gz`,
        includes: ["config", "logs", "audit", "threat_data"],
      };

      // Log the backup
      this.addAuditLog({
        userId: req.user.email,
        action: "backup_create",
        resource: "/api/admin/backup",
        details: `Created backup: ${backupId}`,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status: "success",
        changes: { backupId },
      });

      res.json({
        success: true,
        data: backup,
        message: "Backup created successfully",
      });
    } catch (error) {
      logger.error("Create backup error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create backup",
      });
    }
  }

  // Restore backup
  async restoreBackup(req, res) {
    try {
      const { backupId } = req.body;

      if (!backupId) {
        return res.status(400).json({
          success: false,
          error: "Backup ID is required",
        });
      }

      // Simulate restore
      const restore = {
        id: uuidv4(),
        backupId,
        timestamp: new Date(),
        status: "in_progress",
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      };

      // Log the restore
      this.addAuditLog({
        userId: req.user.email,
        action: "backup_restore",
        resource: "/api/admin/restore",
        details: `Started restore from backup: ${backupId}`,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status: "success",
        changes: { backupId },
      });

      // Simulate async restore completion
      setTimeout(() => {
        restore.status = "completed";
        restore.completedAt = new Date();
      }, 5000);

      res.json({
        success: true,
        data: restore,
        message: "Backup restoration started",
      });
    } catch (error) {
      logger.error("Restore backup error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to restore backup",
      });
    }
  }

  // Get backups
  async getBackups(req, res) {
    try {
      const backups = [
        {
          id: "backup_001",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          type: "full",
          size: "245.6 MB",
          status: "completed",
          location: "/backups/backup_001.tar.gz",
        },
        {
          id: "backup_002",
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          type: "incremental",
          size: "45.2 MB",
          status: "completed",
          location: "/backups/backup_002.tar.gz",
        },
        {
          id: "backup_003",
          timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
          type: "full",
          size: "230.1 MB",
          status: "completed",
          location: "/backups/backup_003.tar.gz",
        },
      ];

      res.json({
        success: true,
        data: backups,
        count: backups.length,
      });
    } catch (error) {
      logger.error("Get backups error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get backups",
      });
    }
  }

  // Get threat intelligence
  async getThreatIntelligence(req, res) {
    try {
      const { limit = 50, type, risk } = req.query;

      const threats = [
        {
          id: "threat_001",
          type: "ip",
          value: "185.220.101.33",
          risk: "high",
          source: "TOR",
          lastSeen: new Date(),
        },
        {
          id: "threat_002",
          type: "ip",
          value: "45.155.205.233",
          risk: "high",
          source: "Botnet",
          lastSeen: new Date(Date.now() - 3600000),
        },
        {
          id: "threat_003",
          type: "domain",
          value: "malicious-site.com",
          risk: "medium",
          source: "Phishing",
          lastSeen: new Date(Date.now() - 7200000),
        },
        {
          id: "threat_004",
          type: "ip_range",
          value: "103.237.145.0/24",
          risk: "medium",
          source: "Scanner",
          lastSeen: new Date(Date.now() - 10800000),
        },
        {
          id: "threat_005",
          type: "user_agent",
          value: "BadBot/1.0",
          risk: "low",
          source: "Scraper",
          lastSeen: new Date(Date.now() - 14400000),
        },
      ];

      let filteredThreats = [...threats];

      if (type) {
        filteredThreats = filteredThreats.filter(
          (threat) => threat.type === type
        );
      }

      if (risk) {
        filteredThreats = filteredThreats.filter(
          (threat) => threat.risk === risk
        );
      }

      res.json({
        success: true,
        data: filteredThreats.slice(0, limit),
        count: filteredThreats.length,
      });
    } catch (error) {
      logger.error("Get threat intelligence error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get threat intelligence",
      });
    }
  }

  // Add threat intelligence
  async addThreatIntel(req, res) {
    try {
      const { type, value, risk, source, description } = req.body;

      if (!type || !value || !risk) {
        return res.status(400).json({
          success: false,
          error: "Type, value, and risk are required",
        });
      }

      const threat = {
        id: uuidv4(),
        type,
        value,
        risk,
        source: source || "manual",
        description,
        addedBy: req.user.email,
        addedAt: new Date(),
        lastSeen: new Date(),
      };

      // Log the addition
      this.addAuditLog({
        userId: req.user.email,
        action: "threat_add",
        resource: "/api/admin/threat-intel",
        details: `Added threat intelligence: ${value}`,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status: "success",
        changes: { threat },
      });

      res.status(201).json({
        success: true,
        data: threat,
        message: "Threat intelligence added successfully",
      });
    } catch (error) {
      logger.error("Add threat intelligence error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add threat intelligence",
      });
    }
  }

  // Remove threat intelligence
  async removeThreatIntel(req, res) {
    try {
      const threatId = req.params.id;

      // Log the removal
      this.addAuditLog({
        userId: req.user.email,
        action: "threat_remove",
        resource: `/api/admin/threat-intel/${threatId}`,
        details: `Removed threat intelligence: ${threatId}`,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status: "success",
        changes: { threatId },
      });

      res.json({
        success: true,
        message: "Threat intelligence removed successfully",
      });
    } catch (error) {
      logger.error("Remove threat intelligence error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to remove threat intelligence",
      });
    }
  }

  // Get rate limits
  async getRateLimits(req, res) {
    try {
      const rateLimits = {
        api: {
          windowMs: 15 * 60 * 1000,
          max: 100,
          message: "Too many requests from this IP",
        },
        auth: {
          windowMs: 60 * 60 * 1000,
          max: 10,
          message: "Too many login attempts",
        },
        strict: {
          windowMs: 60 * 60 * 1000,
          max: 5,
          message: "Rate limit exceeded",
        },
        dynamic: {
          enabled: true,
          baseMax: 100,
          multipliers: {
            low: 1,
            medium: 0.5,
            high: 0.1,
          },
        },
      };

      res.json({
        success: true,
        data: rateLimits,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Get rate limits error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get rate limits",
      });
    }
  }

  // Update rate limits
  async updateRateLimits(req, res) {
    try {
      const updates = req.body;

      // Log the update
      this.addAuditLog({
        userId: req.user.email,
        action: "ratelimit_update",
        resource: "/api/admin/rate-limits",
        details: "Updated rate limits configuration",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status: "success",
        changes: updates,
      });

      res.json({
        success: true,
        message: "Rate limits updated successfully",
        data: updates,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Update rate limits error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update rate limits",
      });
    }
  }

  // Helper: Add audit log
  addAuditLog(logData) {
    const auditLog = {
      id: uuidv4(),
      timestamp: new Date(),
      ...logData,
    };

    this.auditLogs.unshift(auditLog);

    // Keep only last 1000 logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(0, 1000);
    }

    return auditLog;
  }

  // Helper: Deep merge objects
  deepMerge(target, source) {
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (!target[key] || typeof target[key] !== "object") {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  // Helper: Apply audit log filters
  applyAuditLogFilters(filters) {
    let filteredLogs = [...this.auditLogs];

    if (filters.action) {
      filteredLogs = filteredLogs.filter(
        (log) => log.action === filters.action
      );
    }

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(
        (log) => log.userId === filters.userId
      );
    }

    if (filters.status) {
      filteredLogs = filteredLogs.filter(
        (log) => log.status === filters.status
      );
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) >= start
      );
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) <= end
      );
    }

    return filteredLogs;
  }

  // Helper: Generate mock logs
  generateMockLogs(count) {
    const levels = ["error", "warn", "info", "debug"];
    const messages = [
      "Request processed successfully",
      "Authentication attempt failed",
      "Rate limit exceeded for IP",
      "Database connection established",
      "Cache miss for endpoint",
      "Security alert triggered",
      "Backup completed successfully",
      "System health check passed",
      "Error processing webhook",
      "User session expired",
    ];

    const logs = [];

    for (let i = 0; i < count; i++) {
      const hoursAgo = Math.random() * 24;
      const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

      logs.push({
        id: uuidv4(),
        timestamp,
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        source: `service_${Math.floor(Math.random() * 5) + 1}`,
        metadata: {
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
            Math.random() * 255
          )}`,
          endpoint: `/api/v${Math.floor(Math.random() * 3) + 1}/${
            ["users", "products", "orders"][Math.floor(Math.random() * 3)]
          }`,
          duration: Math.random() * 1000,
        },
      });
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Helper: Generate mock alerts
  generateMockAlerts() {
    return [
      {
        id: "alert_001",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        severity: "critical",
        title: "DDoS Attack Detected",
        description: "High volume of requests from multiple IPs",
        source: "anomaly_detector",
        resolved: false,
        actions: ["rate_limit", "ip_block"],
      },
      {
        id: "alert_002",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        severity: "high",
        title: "Credential Stuffing Attempt",
        description: "Multiple failed login attempts from single IP",
        source: "threat_intel",
        resolved: true,
        resolvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        actions: ["ip_block"],
      },
      {
        id: "alert_003",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        severity: "medium",
        title: "Unusual Traffic Pattern",
        description: "Statistical anomaly detected in request patterns",
        source: "analytics",
        resolved: false,
        actions: ["monitor", "analyze"],
      },
      {
        id: "alert_004",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        severity: "low",
        title: "High Error Rate",
        description: "Increased error rate on payment endpoint",
        source: "monitoring",
        resolved: true,
        resolvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
        actions: ["investigate"],
      },
    ];
  }
}

module.exports = new AdminController();
