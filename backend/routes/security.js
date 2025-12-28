const express = require("express");
const router = express.Router();
const securityController = require("../controllers/security.controller");
const { validateApiRequest } = require("../middleware/validation");

// Real-time data endpoints
router.get("/traffic", securityController.getTrafficData.bind(securityController));
router.get("/anomalies", securityController.getAnomalies.bind(securityController));
router.get("/anomalies/latest", securityController.getLatestAnomalies.bind(securityController));
router.get("/threat-actors", securityController.getThreatActors.bind(securityController));
router.get("/threat-actors/top", securityController.getTopThreatActors.bind(securityController));
router.get("/endpoints", securityController.getEndpoints.bind(securityController));
router.get("/endpoints/:id/health", securityController.getEndpointHealth.bind(securityController));
router.get("/recommendations", securityController.getActionRecommendations.bind(securityController));

// Action endpoints
router.post(
  "/actions/block",
  validateApiRequest,
  securityController.blockThreatActor.bind(securityController)
);
router.post(
  "/actions/throttle",
  validateApiRequest,
  securityController.throttleTraffic.bind(securityController)
);
router.post(
  "/actions/monitor",
  validateApiRequest,
  securityController.monitorEndpoint.bind(securityController)
);
router.post(
  "/actions/apply",
  validateApiRequest,
  securityController.applyRecommendation.bind(securityController)
);

// Analytics endpoints
router.get("/analytics/summary", securityController.getSecuritySummary.bind(securityController));
router.get("/analytics/timeline", securityController.getSecurityTimeline.bind(securityController));
router.get("/analytics/trends", securityController.getSecurityTrends.bind(securityController));

// Webhook for external alerts
router.post("/webhook/alert", securityController.handleSecurityAlert.bind(securityController));

// SSE endpoint for real-time updates
router.get("/events", securityController.getSecurityEvents.bind(securityController));

module.exports = router;
