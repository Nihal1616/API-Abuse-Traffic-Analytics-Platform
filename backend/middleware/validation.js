const Joi = require("joi");

// Validation schemas
const schemas = {
  // Authentication
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  // User management
  createUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required(),
    role: Joi.string().valid("admin", "security", "viewer").required(),
    permissions: Joi.array().items(Joi.string()),
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2),
    role: Joi.string().valid("admin", "security", "viewer"),
    permissions: Joi.array().items(Joi.string()),
    password: Joi.string().min(8),
  }),

  // Security actions
  blockIP: Joi.object({
    ip: Joi.string().ip().required(),
    reason: Joi.string().min(5).required(),
    duration: Joi.string().valid("1h", "6h", "24h", "7d", "permanent"),
  }),

  throttleTraffic: Joi.object({
    endpoint: Joi.string()
      .pattern(/^\/api\/.*/)
      .required(),
    rateLimit: Joi.number().min(1).required(),
    duration: Joi.string().valid("15m", "1h", "6h", "24h"),
  }),

  applyRecommendation: Joi.object({
    recommendationId: Joi.string().uuid().required(),
    action: Joi.string()
      .valid("block", "throttle", "challenge", "monitor", "whitelist")
      .required(),
    target: Joi.string().required(),
  }),

  // Configuration
  updateConfig: Joi.object({
    security: Joi.object({
      rateLimiting: Joi.object({
        enabled: Joi.boolean(),
        requestsPerMinute: Joi.number().min(1),
        burstLimit: Joi.number().min(1),
      }),
      ipBlocking: Joi.object({
        enabled: Joi.boolean(),
        autoBlockThreshold: Joi.number().min(0).max(100),
        blockDuration: Joi.string(),
      }),
      anomalyDetection: Joi.object({
        enabled: Joi.boolean(),
        sensitivity: Joi.string().valid("low", "medium", "high"),
        alertThreshold: Joi.number().min(0).max(100),
      }),
    }),
    notifications: Joi.object({
      email: Joi.object({
        enabled: Joi.boolean(),
        from: Joi.string().email(),
        recipients: Joi.array().items(Joi.string().email()),
      }),
      slack: Joi.object({
        enabled: Joi.boolean(),
        webhookUrl: Joi.string().uri(),
      }),
    }),
  }),

  // Threat intelligence
  addThreatIntel: Joi.object({
    type: Joi.string()
      .valid("ip", "domain", "ip_range", "user_agent", "pattern")
      .required(),
    value: Joi.string().required(),
    risk: Joi.string().valid("low", "medium", "high", "critical").required(),
    source: Joi.string(),
    description: Joi.string(),
  }),

  // API request validation
  apiRequest: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")),
    limit: Joi.number().min(1).max(1000),
    page: Joi.number().min(1),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid("asc", "desc"),
  }),
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      return res.status(500).json({
        success: false,
        error: `Validation schema '${schemaName}' not found`,
      });
    }

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
  };
};

// Query parameter validation
const validateQuery = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: "Query validation failed",
        details: errors,
      });
    }

    req.validatedQuery = value;
    next();
  };
};

// Path parameter validation
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
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
        error: "Path parameter validation failed",
        details: errors,
      });
    }

    req.validatedParams = value;
    next();
  };
};

// Custom validators
const customValidators = {
  // Validate IP address or CIDR
  ipOrCidr: (value, helpers) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

    if (ipRegex.test(value) || cidrRegex.test(value)) {
      return value;
    }

    return helpers.error("any.invalid");
  },

  // Validate date range
  dateRange: (value, helpers) => {
    const { startDate, endDate } = value;

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return helpers.error("date.rangeInvalid");
    }

    return value;
  },

  // Validate pagination
  pagination: (value, helpers) => {
    const { page, limit } = value;

    if (page && page < 1) {
      return helpers.error("number.min", { limit: 1 });
    }

    if (limit && (limit < 1 || limit > 1000)) {
      return helpers.error("number.range", { min: 1, max: 1000 });
    }

    return value;
  },
};

// Export everything
module.exports = {
  schemas,
  validate,
  validateQuery,
  validateParams,
  customValidators,

  // Common validation middleware
  validateApiRequest: validate("apiRequest"),
  validateAdminRequest: validate("updateConfig"),
};
