const helmet = require("helmet");

// Custom security headers middleware
const securityHeaders = (req, res, next) => {
  // Apply Helmet defaults
  helmet()(req, res, () => {});

  // Custom security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

  // HSTS header for HTTPS
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Content Security Policy
  const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    manifestSrc: ["'self'"],
  };

  const cspHeader = Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");

  res.setHeader("Content-Security-Policy", cspHeader);

  next();
};

// Rate limiting based on threat level
const adaptiveRateLimit = (req, res, next) => {
  const threatLevel = req.headers["x-threat-level"] || "low";

  let maxRequests;
  switch (threatLevel) {
    case "high":
      maxRequests = 10;
      break;
    case "medium":
      maxRequests = 50;
      break;
    case "low":
    default:
      maxRequests = 100;
  }

  // Simple in-memory rate limiting (in production, use Redis)
  const clientIp = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes

  if (!req.app.locals.rateLimit) {
    req.app.locals.rateLimit = new Map();
  }

  const clientData = req.app.locals.rateLimit.get(clientIp) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + windowMs;
  }

  if (clientData.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
    });
  }

  clientData.count++;
  req.app.locals.rateLimit.set(clientIp, clientData);

  // Add rate limit headers
  res.setHeader("X-RateLimit-Limit", maxRequests);
  res.setHeader("X-RateLimit-Remaining", maxRequests - clientData.count);
  res.setHeader("X-RateLimit-Reset", Math.ceil(clientData.resetTime / 1000));

  next();
};

// Request validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));

        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors,
        });
      }

      req.validatedData = value;
      next();
    } catch (err) {
      logger.error("Request validation error:", err);
      res.status(500).json({
        success: false,
        error: "Validation error",
      });
    }
  };
};

// IP reputation check
const ipReputationCheck = async (req, res, next) => {
  const clientIp = req.ip;

  // Skip for internal IPs
  if (clientIp.startsWith("192.168.") || clientIp === "127.0.0.1") {
    return next();
  }

  try {
    // In production, check against threat intelligence service
    const isSuspicious = await checkIPReputation(clientIp);

    if (isSuspicious) {
      req.threatLevel = "high";
      res.setHeader("X-Threat-Level", "high");
    } else {
      req.threatLevel = "low";
    }

    next();
  } catch (error) {
    logger.error("IP reputation check error:", error);
    next(); // Continue even if check fails
  }
};

// Mock IP reputation check
async function checkIPReputation(ip) {
  // Mock implementation
  const maliciousRanges = ["185.220.101.", "45.155.205.", "103.237.145."];

  return maliciousRanges.some((range) => ip.startsWith(range));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent") || "",
      userId: req.user?.id || "anonymous",
      threatLevel: req.threatLevel || "low",
    };

    // Log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `${logEntry.method} ${logEntry.url} ${logEntry.status} ${logEntry.duration}`
      );
    }

    // TODO: Store in database or log file
  });

  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.url}`,
  });
};

module.exports = {
  securityHeaders,
  adaptiveRateLimit,
  validateRequest,
  ipReputationCheck,
  requestLogger,
  errorHandler,
  notFoundHandler,
};
