const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const redis = require("redis");

// Create Redis client if Redis URL is provided
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
  });
  redisClient.connect().catch(console.error);
}

// Different rate limiters for different endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    }),
  }),
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Dynamic rate limiter based on threat level
const dynamicRateLimiter = (req, res, next) => {
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

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    keyGenerator: (req) => req.ip,
    message: `Rate limit exceeded for threat level: ${threatLevel}`,
    standardHeaders: true,
    legacyHeaders: false,
  })(req, res, next);
};

module.exports = {
  apiLimiter,
  authLimiter,
  strictLimiter,
  dynamicRateLimiter,
};
