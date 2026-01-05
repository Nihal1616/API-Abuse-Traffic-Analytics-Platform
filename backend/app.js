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

/** Trust Render + Cloudflare proxy */
app.set("trust proxy", true);

app.use((req, res, next) => {
  console.log("Incoming IP:", req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.ip);
  next();
});

app.use(requestTracker);
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://api-abuse-traffic-analytics-platform.onrender.com",
    "https://api-abuse-traffic-platform.web.app"
  ],
  credentials: true
}));
app.use(express.json());
app.use(compression());
app.use(morgan("dev"));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    const ip =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    console.log("RateLimit key:", ip);
    return ip;
  },

  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests — you are being rate limited."
    });
  }
});

app.use("/api", apiLimiter);

app.use("/api/security", securityRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

module.exports = app;
