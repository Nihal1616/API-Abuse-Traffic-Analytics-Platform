const express = require("express");
const router = express.Router();
const securityController = require("../controllers/security.controller");
const { validateApiRequest } = require("../middleware/validation");

// Real-time data endpoints
router.get("/traffic", securityController.getTrafficData);
router.get("/anomalies", securityController.getAnomalies);
router.get("/anomalies/latest", securityController.getLatestAnomalies);
router.get("/threat-actors", securityController.getThreatActors);
router.get("/threat-actors/top", securityController.getTopThreatActors);
router.get("/endpoints", securityController.getEndpoints);
router.get("/endpoints/:id/health", securityController.getEndpointHealth);
router.get("/recommendations", securityController.getActionRecommendations);

// Action endpoints
router.post(
  "/actions/block",
  validateApiRequest,
  securityController.blockThreatActor
);
router.post(
  "/actions/throttle",
  validateApiRequest,
  securityController.throttleTraffic
);
router.post(
  "/actions/monitor",
  validateApiRequest,
  securityController.monitorEndpoint
);
router.post(
  "/actions/apply",
  validateApiRequest,
  securityController.applyRecommendation
);

// Analytics endpoints
router.get("/analytics/summary", securityController.getSecuritySummary);
router.get("/analytics/timeline", securityController.getSecurityTimeline);
router.get("/analytics/trends", securityController.getSecurityTrends);

// Webhook for external alerts
router.post("/webhook/alert", securityController.handleSecurityAlert);

// SSE endpoint for real-time updates
router.get("/events", securityController.getSecurityEvents);

module.exports = router;
