const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { v4: uuidv4 } = require("uuid");

const threatActorSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    countryCode: {
      type: String,
      index: true,
    },
    countryName: {
      type: String,
    },
    city: {
      type: String,
    },
    isp: {
      type: String,
    },
    organization: {
      type: String,
    },
    threatScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "blocked", "monitoring", "whitelisted", "investigating"],
      default: "active",
      index: true,
    },
    requestCount: {
      type: Number,
      default: 0,
    },
    blockedCount: {
      type: Number,
      default: 0,
    },
    errorCount: {
      type: Number,
      default: 0,
    },
    attackTypes: {
      type: [String],
      default: [],
    },
    firstSeen: {
      type: Date,
      required: true,
      index: true,
    },
    lastSeen: {
      type: Date,
      required: true,
      index: true,
    },
    lastBlocked: {
      type: Date,
    },
    reputation: {
      type: String,
      enum: ["unknown", "suspicious", "malicious", "trusted", "neutral"],
      default: "unknown",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
    },
    blockReason: {
      type: String,
    },
    blockDuration: {
      type: String,
      enum: ["1h", "6h", "24h", "7d", "30d", "permanent"],
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    behaviorProfile: {
      requestPattern: String,
      peakHours: [Number],
      targetEndpoints: [String],
      userAgents: [String],
      sessionDuration: Number,
      requestFrequency: Number,
    },
    intelligenceSources: [
      {
        source: String,
        risk: String,
        firstSeen: Date,
        lastSeen: Date,
        confidence: Number,
      },
    ],
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
threatActorSchema.index({ threatScore: -1, lastSeen: -1 });
threatActorSchema.index({ status: 1, threatScore: -1 });
threatActorSchema.index({ countryCode: 1, threatScore: -1 });
threatActorSchema.index({ reputation: 1, threatScore: -1 });

// Virtuals
threatActorSchema.virtual("formatted").get(function () {
  return {
    id: this._id,
    ipAddress: this.ipAddress,
    countryCode: this.countCode,
    countryName: this.countryName,
    threatScore: this.threatScore,
    status: this.status,
    requestCount: this.requestCount,
    blockedCount: this.blockedCount,
    attackTypes: this.attackTypes,
    firstSeen: this.firstSeen,
    lastSeen: this.lastSeen,
    reputation: this.reputation,
    tags: this.tags,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

threatActorSchema.virtual("isActive").get(function () {
  return this.status === "active";
});

threatActorSchema.virtual("isBlocked").get(function () {
  return this.status === "blocked";
});

threatActorSchema.virtual("blockRate").get(function () {
  return this.requestCount > 0
    ? Math.round((this.blockedCount / this.requestCount) * 100)
    : 0;
});

threatActorSchema.virtual("errorRate").get(function () {
  return this.requestCount > 0
    ? Math.round((this.errorCount / this.requestCount) * 100)
    : 0;
});

// Methods
threatActorSchema.methods.updateStats = async function (requestData) {
  this.requestCount += 1;
  this.lastSeen = new Date();

  if (requestData.isBlocked) {
    this.blockedCount += 1;
    this.lastBlocked = new Date();
  }

  if (requestData.statusCode >= 400) {
    this.errorCount += 1;
  }

  await this.save();
};

threatActorSchema.methods.block = async function (
  reason,
  duration = "24h",
  blockedBy = "system"
) {
  this.status = "blocked";
  this.blockReason = reason;
  this.blockDuration = duration;
  this.lastBlocked = new Date();
  this.metadata.set("blockedBy", blockedBy);
  this.metadata.set("blockedAt", new Date().toISOString());

  await this.save();
  return this;
};

threatActorSchema.methods.unblock = async function (unblockedBy = "system") {
  this.status = "active";
  this.blockReason = null;
  this.blockDuration = null;
  this.metadata.set("unblockedBy", unblockedBy);
  this.metadata.set("unblockedAt", new Date().toISOString());

  await this.save();
  return this;
};

threatActorSchema.methods.addAttackType = async function (attackType) {
  if (!this.attackTypes.includes(attackType)) {
    this.attackTypes.push(attackType);
    await this.save();
  }
  return this;
};

threatActorSchema.methods.addTag = async function (tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    await this.save();
  }
  return this;
};

// Static methods
threatActorSchema.statics.findOrCreate = async function (
  ipAddress,
  initialData = {}
) {
  let threatActor = await this.findOne({ ipAddress });

  if (!threatActor) {
    threatActor = new this({
      ipAddress,
      countryCode: initialData.countryCode,
      countryName: initialData.countryName,
      city: initialData.city,
      isp: initialData.isp,
      threatScore: initialData.threatScore || 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
      reputation: initialData.reputation || "unknown",
    });

    await threatActor.save();
  }

  return threatActor;
};

threatActorSchema.statics.getTopThreats = async function (
  limit = 10,
  filters = {}
) {
  const matchStage = {};

  if (filters.minScore) {
    matchStage.threatScore = { $gte: filters.minScore };
  }

  if (filters.status) {
    matchStage.status = filters.status;
  }

  if (filters.countryCode) {
    matchStage.countryCode = filters.countryCode;
  }

  if (filters.reputation) {
    matchStage.reputation = filters.reputation;
  }

  return await this.aggregate([
    { $match: matchStage },
    {
      $project: {
        ipAddress: 1,
        countryCode: 1,
        countryName: 1,
        threatScore: 1,
        status: 1,
        requestCount: 1,
        blockedCount: 1,
        attackTypes: 1,
        firstSeen: 1,
        lastSeen: 1,
        reputation: 1,
        tags: 1,
        blockRate: {
          $cond: [
            { $eq: ["$requestCount", 0] },
            0,
            {
              $multiply: [{ $divide: ["$blockedCount", "$requestCount"] }, 100],
            },
          ],
        },
      },
    },
    { $sort: { threatScore: -1 } },
    { $limit: limit },
  ]);
};

threatActorSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        blocked: { $sum: { $cond: [{ $eq: ["$status", "blocked"] }, 1, 0] } },
        monitoring: {
          $sum: { $cond: [{ $eq: ["$status", "monitoring"] }, 1, 0] },
        },
        avgThreatScore: { $avg: "$threatScore" },
        maxThreatScore: { $max: "$threatScore" },
        minThreatScore: { $min: "$threatScore" },
      },
    },
    {
      $project: {
        total: 1,
        active: 1,
        blocked: 1,
        monitoring: 1,
        avgThreatScore: { $round: ["$avgThreatScore", 2] },
        maxThreatScore: 1,
        minThreatScore: 1,
      },
    },
  ]);

  const byCountry = await this.aggregate([
    {
      $group: {
        _id: "$countryCode",
        count: { $sum: 1 },
        avgThreatScore: { $avg: "$threatScore" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        countryCode: "$_id",
        count: 1,
        avgThreatScore: { $round: ["$avgThreatScore", 2] },
        _id: 0,
      },
    },
  ]);

  const byReputation = await this.aggregate([
    {
      $group: {
        _id: "$reputation",
        count: { $sum: 1 },
        avgThreatScore: { $avg: "$threatScore" },
      },
    },
    {
      $project: {
        reputation: "$_id",
        count: 1,
        avgThreatScore: { $round: ["$avgThreatScore", 2] },
        _id: 0,
      },
    },
  ]);

  return {
    ...stats[0],
    byCountry,
    byReputation,
  };
};

threatActorSchema.statics.cleanupOldActors = async function (
  maxAgeDays = 30,
  minThreatScore = 30
) {
  const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

  const result = await this.deleteMany({
    lastSeen: { $lt: cutoffDate },
    threatScore: { $lt: minThreatScore },
    status: { $ne: "blocked" },
  });

  return {
    deletedCount: result.deletedCount,
    cutoffDate,
    minThreatScore,
  };
};

// Add pagination plugin
threatActorSchema.plugin(mongoosePaginate);

const ThreatActor = mongoose.model("ThreatActor", threatActorSchema);

module.exports = ThreatActor;
