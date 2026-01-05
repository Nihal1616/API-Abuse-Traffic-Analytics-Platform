require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");
const { requestTracker } = require("./middleware/request-tracker");

const securityRoutes = require("./routes/security");
const metricsRoutes = require("./routes/metrics");
const adminRoutes = require("./routes/admin");

const app = express();

/** Trust proxy headers from Render / Cloudflare */
app.set("trust proxy", true);

// Debug incoming IP
app.use((req, res, next) => {
  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.ip;
  console.log("Incoming IP:", ip);
  next();
});

app.use(requestTracker);

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://api-abuse-traffic-analytics-platform.onrender.com",
      "https://api-abuse-traffic-platform.web.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(compression());
app.use(morgan("dev"));

/** Key generator */
const getClientIp = (req) =>
  req.headers["cf-connecting-ip"] ||
  req.headers["x-forwarded-for"]?.split(",")[0] ||
  req.ip ||
  "unknown";

/** Read-only limiter (dashboard) */
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
});

/** Sensitive actions limiter */
const actionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many sensitive actions. Please slow down.",
    }),
});

/** Apply rate limits */
app.use("/api/metrics", readLimiter);
app.use("/api/security/traffic", readLimiter);
app.use("/api/security/anomalies", readLimiter);
app.use("/api/security/threat-actors", readLimiter);

app.use("/api/security/actions", actionLimiter);
app.use("/api/admin", actionLimiter);

/** Routes */
app.use("/api/security", securityRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

module.exports = app;
