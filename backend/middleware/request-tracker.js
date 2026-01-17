const logger = require("../utils/logger");

let requestMetrics = {
  totalRequests: 0,
  requestsByEndpoint: {},
  requestsByIP: {},
  requestsByHour: {},
  blockedRequests: 0,
  responseTimes: [],
  lastReset: Date.now(),
};

setInterval(() => {
  requestMetrics = {
    totalRequests: 0,
    requestsByEndpoint: {},
    requestsByIP: {},
    requestsByHour: {},
    blockedRequests: 0,
    responseTimes: [],
    lastReset: Date.now(),
  };
  logger.info("Request metrics reset");
}, 60 * 60 * 1000);

const requestTracker = (req, res, next) => {
    console.log("requestTracker hit:", req.method, req.originalUrl);
  const startTime = Date.now();
  const endpoint = req.originalUrl.split("?")[0];
  const clientIP = req.ip || "unknown";

  requestMetrics.totalRequests++;
  requestMetrics.requestsByEndpoint[endpoint] =
    (requestMetrics.requestsByEndpoint[endpoint] || 0) + 1;
  requestMetrics.requestsByIP[clientIP] =
    (requestMetrics.requestsByIP[clientIP] || 0) + 1;

  const hour = new Date().getHours();
  requestMetrics.requestsByHour[hour] =
    (requestMetrics.requestsByHour[hour] || 0) + 1;

  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    requestMetrics.responseTimes.push(responseTime);
    if (requestMetrics.responseTimes.length > 1000)
      requestMetrics.responseTimes.shift();

    if (res.statusCode === 429 || res.statusCode === 403) {
      requestMetrics.blockedRequests++;
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("metrics_update", getRequestMetrics());
    }

    logger.info(
      `${req.method} ${endpoint} ${res.statusCode} ${responseTime}ms ${clientIP}`
    );
  });

  next();
};

const getRequestMetrics = () => {
  const avgResponseTime =
    requestMetrics.responseTimes.length > 0
      ? requestMetrics.responseTimes.reduce((a, b) => a + b, 0) /
        requestMetrics.responseTimes.length
      : 0;

  return {
    totalRequests: requestMetrics.totalRequests,
    requestsByEndpoint: requestMetrics.requestsByEndpoint,
    requestsByIP: requestMetrics.requestsByIP,
    requestsByHour: requestMetrics.requestsByHour,
    blockedRequests: requestMetrics.blockedRequests,
    avgResponseTime: Math.round(avgResponseTime),
    lastReset: requestMetrics.lastReset,
  };
};

module.exports = { requestTracker, getRequestMetrics };
