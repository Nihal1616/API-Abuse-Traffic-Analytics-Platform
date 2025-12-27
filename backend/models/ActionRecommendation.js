const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { v4: uuidv4 } = require("uuid");

const actionRecommendationSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    action: {
      type: String,
      required: true,
      enum: ["block", "throttle", "challenge", "monitor", "whitelist", "alert"],
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["ip", "endpoint", "user", "country", "asn", "user_agent"],
      index: true,
    },
    target: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 75,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    estimatedImpact: {
      type: String,
    },
    collateralDamage: {
      affectedUsers: {
        type: Number,
        default: 0,
      },
      affectedRequests: {
        type: Number,
        default: 0,
      },
      legitimateTrafficPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      businessImpact: {
        type: String,
        enum: ["none", "low", "medium", "high", "critical"],
        default: "low",
      },
    },
    source: {
      type: String,
      enum: ["ai", "rule", "manual", "analyst"],
      default: "ai",
      index: true,
    },
    sourceDetails: {
      ruleId: String,
      anomalyId: String,
      threatActorId: String,
      triggeredBy: String,
    },
    status: {
      type: String,
      enum: ["pending", "applied", "rejected", "expired", "scheduled"],
      default: "pending",
      index: true,
    },
    appliedBy: {
      type: String,
      ref: "User",
    },
    appliedAt: {
      type: Date,
    },
    rejectedBy: {
      type: String,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    executionDetails: {
      executionTime: Number,
      success: Boolean,
      error: String,
      affectedCount: Number,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tags: {
      type: [String],
      default: [],
    },
    relatedEntities: [
      {
        type: String,
        refPath: "relatedEntityModel",
      },
    ],
    relatedEntityModel: {
      type: String,
      enum: ["Anomaly", "ThreatActor", "ApiRequest"],
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
actionRecommendationSchema.index({ status: 1, priority: -1 });
actionRecommendationSchema.index({ confidence: -1, createdAt: -1 });
actionRecommendationSchema.index({ action: 1, status: 1 });
actionRecommendationSchema.index({ targetType: 1, target: 1 });

// Virtuals
actionRecommendationSchema.virtual("formatted").get(function () {
  return {
    id: this._id,
    action: this.action,
    targetType: this.targetType,
    target: this.target,
    reason: this.reason,
    confidence: this.confidence,
    priority: this.priority,
    estimatedImpact: this.estimatedImpact,
    collateralDamage: this.collateralDamage,
    source: this.source,
    status: this.status,
    appliedAt: this.appliedAt,
    expiresAt: this.expiresAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

actionRecommendationSchema.virtual("isActive").get(function () {
  return this.status === "pending" || this.status === "scheduled";
});

actionRecommendationSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Methods
actionRecommendationSchema.methods.apply = async function (
  appliedBy,
  executionDetails = {}
) {
  this.status = "applied";
  this.appliedBy = appliedBy;
  this.appliedAt = new Date();
  this.executionDetails = executionDetails;

  await this.save();
  return this;
};

actionRecommendationSchema.methods.reject = async function (
  rejectedBy,
  reason = ""
) {
  this.status = "rejected";
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;

  await this.save();
  return this;
};

actionRecommendationSchema.methods.schedule = async function (executeAt) {
  this.status = "scheduled";
  this.expiresAt = executeAt;

  await this.save();
  return this;
};

actionRecommendationSchema.methods.addTag = async function (tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    await this.save();
  }
  return this;
};

// Static methods
actionRecommendationSchema.statics.getPendingRecommendations = async function (
  limit = 20,
  minConfidence = 50
) {
  return await this.aggregate([
    {
      $match: {
        status: "pending",
        confidence: { $gte: minConfidence },
      },
    },
    { $sort: { priority: -1, confidence: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "appliedBy",
        foreignField: "_id",
        as: "appliedByUser",
      },
    },
    { $unwind: { path: "$appliedByUser", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        action: 1,
        targetType: 1,
        target: 1,
        reason: 1,
        confidence: 1,
        priority: 1,
        estimatedImpact: 1,
        collateralDamage: 1,
        source: 1,
        status: 1,
        createdAt: 1,
        appliedBy: {
          name: "$appliedByUser.name",
          email: "$appliedByUser.email",
        },
      },
    },
  ]);
};

actionRecommendationSchema.statics.getStatistics = async function (
  timeRange = "7d"
) {
  const timeFilter = getTimeFilter(timeRange);

  const stats = await this.aggregate([
    { $match: { createdAt: timeFilter } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        applied: { $sum: { $cond: [{ $eq: ["$status", "applied"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } },
        avgConfidence: { $avg: "$confidence" },
      },
    },
    {
      $project: {
        total: 1,
        pending: 1,
        applied: 1,
        rejected: 1,
        expired: 1,
        appliedRate: {
          $cond: [
            { $eq: ["$total", 0] },
            0,
            { $multiply: [{ $divide: ["$applied", "$total"] }, 100] },
          ],
        },
        avgConfidence: { $round: ["$avgConfidence", 2] },
      },
    },
  ]);

  const byAction = await this.aggregate([
    { $match: { createdAt: timeFilter } },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
        applied: { $sum: { $cond: [{ $eq: ["$status", "applied"] }, 1, 0] } },
        avgConfidence: { $avg: "$confidence" },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        action: "$_id",
        count: 1,
        applied: 1,
        appliedRate: {
          $cond: [
            { $eq: ["$count", 0] },
            0,
            { $multiply: [{ $divide: ["$applied", "$count"] }, 100] },
          ],
        },
        avgConfidence: { $round: ["$avgConfidence", 2] },
        _id: 0,
      },
    },
  ]);

  const bySource = await this.aggregate([
    { $match: { createdAt: timeFilter } },
    {
      $group: {
        _id: "$source",
        count: { $sum: 1 },
        avgConfidence: { $avg: "$confidence" },
      },
    },
    {
      $project: {
        source: "$_id",
        count: 1,
        avgConfidence: { $round: ["$avgConfidence", 2] },
        _id: 0,
      },
    },
  ]);

  return {
    ...stats[0],
    byAction,
    bySource,
  };
};

actionRecommendationSchema.statics.cleanupExpired = async function () {
  const result = await this.updateMany(
    {
      status: "pending",
      expiresAt: { $lt: new Date() },
    },
    {
      $set: { status: "expired" },
    }
  );

  return {
    expiredCount: result.modifiedCount,
    timestamp: new Date(),
  };
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
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { $gte: startTime };
}

// Add pagination plugin
actionRecommendationSchema.plugin(mongoosePaginate);

const ActionRecommendation = mongoose.model(
  "ActionRecommendation",
  actionRecommendationSchema
);

module.exports = ActionRecommendation;
