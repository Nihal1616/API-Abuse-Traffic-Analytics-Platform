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

app.use((req, res, next) => {
  console.log("IP:", req.ip, "Forwarded:", req.headers["x-forwarded-for"]);
  next();
});

app.use(requestTracker);

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: ["http://localhost:5173", "https://api-abuse-traffic-analytics-platform.onrender.com", "https://api-abuse-traffic-platform.web.app"], credentials: true }));
app.use(express.json());
app.use(compression());
app.use(morgan("dev"));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown"
    );
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests — please slow down."
    });
  }
});
app.use("/api", (req, res, next) => {
  console.log("Limiter reached for:", req.path);
  next();
});


app.use("/api", apiLimiter);;


app.use("/api/security", securityRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

module.exports = app;
