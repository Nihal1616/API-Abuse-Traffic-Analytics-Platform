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
app.set("trust proxy", 1);

// Middlewares
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

// Rate limiters
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many sensitive actions. Please slow down.",
    });
  },
});

// Apply rate limiting
app.use("/api/metrics", readLimiter);
app.use("/api/security", readLimiter);
app.use("/api/security/actions", strictLimiter);
app.use("/api/admin", strictLimiter);

// Routes
app.use("/api/security", securityRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

module.exports = app;
