const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { v4: uuidv4 } = require("uuid");

const anomalySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    type: {
      type: String,
      required: true,
      enum: [
        "rate_spike",
        "pattern_anomaly",
        "geo_anomaly",
        "credential_stuffing",
        "scraping",
        "ddos",
        "behavior_anomaly",
        "response_time_anomaly",
        "error_rate_spike",
        "unauthorized_access",
        "data_exfiltration",
      ],
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      index: true,
    },
    sourceIp: {
      type: String,
      index: true,
    },
    threatActorId: {
      type: String,
      ref: "ThreatActor",
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
      index: true,
    },
    recommendation: {
      type: String,
    },
    collateralDamage: {
      legitimateTrafficPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      affectedUsers: {
        type: Number,
        default: 0,
      },
      estimatedDamage: String,
    },
    status: {
      type: String,
      enum: [
        "detected",
        "investigating",
        "resolved",
        "false_positive",
        "ignored",
      ],
      default: "detected",
      index: true,
    },
    assignedTo: {
      type: String,
      ref: "User",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: String,
      ref: "User",
    },
    resolutionNotes: {
      type: String,
    },
    relatedAnomalyIds: [
      {
        type: String,
        ref: "Anomaly",
      },
    ],
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    detectionRules: [
      {
        ruleId: String,
        ruleName: String,
        threshold: Number,
        actualValue: Number,
        triggeredAt: Date,
      },
    ],
    metrics: {
      requestCount: Number,
      errorCount: Number,
      responseTimeAvg: Number,
      responseTimeMax: Number,
      uniqueIPs: Number,
      uniqueEndpoints: Number,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes
anomalySchema.index({ timestamp: -1, severity: 1 });
anomalySchema.index({ type: 1, timestamp: -1 });
anomalySchema.index({ status: 1, timestamp: -1 });
anomalySchema.index({ severity: 1, confidence: -1 });
anomalySchema.index({ sourceIp: 1, timestamp: -1 });

// Virtuals
anomalySchema.virtual("formatted").get(function () {
  return {
    id: this._id,
    type: this.type,
    severity: this.severity,
    title: this.title,
    description: this.description,
    timestamp: this.timestamp,
    endpoint: this.endpoint,
    sourceIp: this.sourceIp,
    confidence: this.confidence,
    recommendation: this.recommendation,
    collateralDamage: this.collateralDamage,
    status: this.status,
    priority: this.priority,
    resolvedAt: this.resolvedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

anomalySchema.virtual("isOpen").get(function () {
  return this.status === "detected" || this.status === "investigating";
});

anomalySchema.virtual("isResolved").get(function () {
  return this.status === "resolved";
});

anomalySchema.virtual("duration").get(function () {
  if (!this.resolvedAt || !this.timestamp) return null;
  return this.resolvedAt.getTime() - this.timestamp.getTime();
});

// Methods
anomalySchema.methods.resolve = async function (resolvedBy, notes = "") {
  this.status = "resolved";
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  this.resolutionNotes = notes;

  await this.save();
  return this;
};

anomalySchema.methods.assign = async function (userId) {
  this.assignedTo = userId;
  this.status = "investigating";

  await this.save();
  return this;
};

anomalySchema.methods.markAsFalsePositive = async function (reason = "") {
  this.status = "false_positive";
  this.resolvedAt = new Date();
  this.resolutionNotes = reason || "Marked as false positive";

  await this.save();
  return this;
};

anomalySchema.methods.addRelatedAnomaly = async function (anomalyId) {
  if (!this.relatedAnomalyIds.includes(anomalyId)) {
    this.relatedAnomalyIds.push(anomalyId);
    await this.save();
  }
  return this;
};

// Static methods
anomalySchema.statics.getRecentAnomalies = async function (
  limit = 50,
  filters = {}
) {
  const matchStage = {};

  if (filters.severity) {
    matchStage.severity = filters.severity;
  }

  if (filters.type) {
    matchStage.type = filters.type;
  }

  if (filters.status) {
    matchStage.status = filters.status;
  }

  if (filters.startDate) {
    matchStage.timestamp = { $gte: new Date(filters.startDate) };
  }

  if (filters.endDate) {
    matchStage.timestamp = matchStage.timestamp || {};
    matchStage.timestamp.$lte = new Date(filters.endDate);
  }

  return await this.aggregate([
    { $match: matchStage },
    { $sort: { timestamp: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "threatactors",
        localField: "threatActorId",
        foreignField: "_id",
        as: "threatActor",
      },
    },
    { $unwind: { path: "$threatActor", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        type: 1,
        severity: 1,
        title: 1,
        description: 1,
        timestamp: 1,
        endpoint: 1,
        sourceIp: 1,
        confidence: 1,
        recommendation: 1,
        collateralDamage: 1,
        status: 1,
        priority: 1,
        resolvedAt: 1,
        threatActor: {
          ipAddress: 1,
          threatScore: 1,
          countryCode: 1,
        },
      },
    },
  ]);
};

anomalySchema.statics.getStatistics = async function (timeRange = "24h") {
  const timeFilter = getTimeFilter(timeRange);

  const stats = await this.aggregate([
    { $match: { timestamp: timeFilter.timestamp } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        detected: { $sum: { $cond: [{ $eq: ["$status", "detected"] }, 1, 0] } },
        investigating: {
          $sum: { $cond: [{ $eq: ["$status", "investigating"] }, 1, 0] },
        },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        falsePositive: {
          $sum: { $cond: [{ $eq: ["$status", "false_positive"] }, 1, 0] },
        },
        critical: {
          $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] },
        },
        high: { $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ["$severity", "medium"] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ["$severity", "low"] }, 1, 0] } },
        avgConfidence: { $avg: "$confidence" },
      },
    },
    {
      $project: {
        total: 1,
        detected: 1,
        investigating: 1,
        resolved: 1,
        falsePositive: 1,
        open: { $add: ["$detected", "$investigating"] },
        closed: { $add: ["$resolved", "$falsePositive"] },
        critical: 1,
        high: 1,
        medium: 1,
        low: 1,
        avgConfidence: { $round: ["$avgConfidence", 2] },
      },
    },
  ]);

  const byType = await this.aggregate([
    { $match: { timestamp: timeFilter.timestamp } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        avgConfidence: { $avg: "$confidence" },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        type: "$_id",
        count: 1,
        avgConfidence: { $round: ["$avgConfidence", 2] },
        _id: 0,
      },
    },
  ]);

  const byEndpoint = await this.aggregate([
    { $match: { timestamp: timeFilter.timestamp, endpoint: { $ne: null } } },
    {
      $group: {
        _id: "$endpoint",
        count: { $sum: 1 },
        avgConfidence: { $avg: "$confidence" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        endpoint: "$_id",
        count: 1,
        avgConfidence: { $round: ["$avgConfidence", 2] },
        _id: 0,
      },
    },
  ]);

  return {
    ...stats[0],
    byType,
    byEndpoint,
  };
};

anomalySchema.statics.getTrend = async function (days = 7) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  return await this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$timestamp",
            timezone: "UTC",
          },
        },
        count: { $sum: 1 },
        critical: {
          $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] },
        },
        high: { $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: "$_id",
        count: 1,
        critical: 1,
        high: 1,
        _id: 0,
      },
    },
  ]);
};

// Helper function for time filters
function getTimeFilter(timeRange) {
  const now = new Date();
  let startTime;

  switch (timeRange) {
    case "1h":
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "6h":
      startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      break;
    case "24h":
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return { timestamp: { $gte: startTime } };
}

// Add pagination plugin
anomalySchema.plugin(mongoosePaginate);

const Anomaly = mongoose.model("Anomaly", anomalySchema);

module.exports = Anomaly;
