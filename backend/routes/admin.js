const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const {
  authenticateAdmin,
  validateAdminRequest,
} = require("../middleware/auth");

// Admin authentication
router.post("/login", adminController.login);
router.post("/logout", authenticateAdmin, adminController.logout);
router.get("/session", authenticateAdmin, adminController.getSession);

// System configuration
router.get("/config", authenticateAdmin, adminController.getConfig);
router.put(
  "/config",
  authenticateAdmin,
  validateAdminRequest,
  adminController.updateConfig
);
router.get(
  "/config/security",
  authenticateAdmin,
  adminController.getSecurityConfig
);

// User management
router.get("/users", authenticateAdmin, adminController.getUsers);
router.post(
  "/users",
  authenticateAdmin,
  validateAdminRequest,
  adminController.createUser
);
router.put(
  "/users/:id",
  authenticateAdmin,
  validateAdminRequest,
  adminController.updateUser
);
router.delete("/users/:id", authenticateAdmin, adminController.deleteUser);

// Audit logs
router.get("/audit", authenticateAdmin, adminController.getAuditLogs);
router.get("/audit/:id", authenticateAdmin, adminController.getAuditLog);
router.get("/audit/export", authenticateAdmin, adminController.exportAuditLogs);

// System monitoring
router.get(
  "/system/health",
  authenticateAdmin,
  adminController.getSystemHealth
);
router.get("/system/stats", authenticateAdmin, adminController.getSystemStats);
router.get("/system/logs", authenticateAdmin, adminController.getSystemLogs);
router.get(
  "/system/alerts",
  authenticateAdmin,
  adminController.getSystemAlerts
);

// Backup and restore
router.post("/backup", authenticateAdmin, adminController.createBackup);
router.post("/restore", authenticateAdmin, adminController.restoreBackup);
router.get("/backups", authenticateAdmin, adminController.getBackups);

// Threat intelligence management
router.get(
  "/threat-intel",
  authenticateAdmin,
  adminController.getThreatIntelligence
);
router.post(
  "/threat-intel",
  authenticateAdmin,
  validateAdminRequest,
  adminController.addThreatIntel
);
router.delete(
  "/threat-intel/:id",
  authenticateAdmin,
  adminController.removeThreatIntel
);

// Rate limit management
router.get("/rate-limits", authenticateAdmin, adminController.getRateLimits);
router.put(
  "/rate-limits",
  authenticateAdmin,
  validateAdminRequest,
  adminController.updateRateLimits
);

module.exports = router;
