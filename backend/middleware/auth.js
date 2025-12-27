const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

// Admin authentication
const authenticateAdmin = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }
    next();
  });
};

// API key authentication
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: "Invalid API key",
    });
  }

  next();
};

// Validate admin request
const validateAdminRequest = (req, res, next) => {
  const { action, target, reason } = req.body;

  if (!action || !target) {
    return res.status(400).json({
      success: false,
      error: "Action and target are required",
    });
  }

  if (["block", "throttle", "delete"].includes(action) && !reason) {
    return res.status(400).json({
      success: false,
      error: "Reason is required for this action",
    });
  }

  next();
};

module.exports = {
  authenticate,
  authenticateAdmin,
  authenticateApiKey,
  validateAdminRequest,
};
