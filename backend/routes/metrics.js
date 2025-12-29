//backend/routes/metrics.js

const express = require("express");
const router = express.Router();
const metricsController = require("../controllers/metrics.controller");

// Dashboard metrics
router.get("/dashboard", metricsController.getDashboardMetrics);
router.get("/overview", metricsController.getOverviewMetrics);
router.get("/summary", metricsController.getMetricsSummary);

// Time-series data
router.get("/timeseries", metricsController.getTimeSeriesData);
router.get("/timeseries/realtime", metricsController.getRealTimeMetrics);
router.get("/timeseries/historical", metricsController.getHistoricalData);

// Performance metrics
router.get("/performance", metricsController.getPerformanceMetrics);
router.get("/performance/endpoints", metricsController.getEndpointPerformance);
router.get("/performance/latency", metricsController.getLatencyMetrics);

// Error metrics
router.get("/errors", metricsController.getErrorMetrics);
router.get("/errors/rate", metricsController.getErrorRate);
router.get("/errors/types", metricsController.getErrorTypes);

// Security metrics
router.get("/security", metricsController.getSecurityMetrics);
router.get("/security/blocked", metricsController.getBlockedRequests);
router.get("/security/threats", metricsController.getThreatMetrics);

// Export data
router.get("/export", metricsController.exportMetricsData);
router.get("/export/csv", metricsController.exportMetricsCSV);

module.exports = router;
