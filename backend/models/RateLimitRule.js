const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const rateLimitRuleSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    zone: {
      type: String,
      required: true,
      index: true,
    },
    rate: {
      type: String,
      required: true, // e.g., "100r/m" for 100 requests per minute
    },
    burst: {
      type: Number,
      default: 0,
    },
    nodelay: {
      type: Boolean,
      default: false,
    },
    pathPattern: {
      type: String,
      index: true,
    },
    methods: {
      type: [String],
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD", "ALL"],
      default: ["ALL"],
    },
    conditions: {
      ipWhitelist: [String],
      ipBlacklist: [String],
      userAgentPatterns: [String],
      refererPatterns: [String],
      countryWhitelist: [String],
      countryBlacklist: [String],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    stats: {
      hits: {
        type: Number,
        default: 0,
      },
      blocks: {
        type: Number,
        default: 0,
      },
      lastHit: {
        type: Date,
      },
      lastBlock: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
rateLimitRuleSchema.index({ isActive: 1, priority: -1 });
rateLimitRuleSchema.index({ pathPattern: 1, methods: 1 });

// Methods
rateLimitRuleSchema.methods.incrementHits = async function () {
  this.stats.hits += 1;
  this.stats.lastHit = new Date();
  await this.save();
  return this;
};

rateLimitRuleSchema.methods.incrementBlocks = async function () {
  this.stats.blocks += 1;
  this.stats.lastBlock = new Date();
  await this.save();
  return this;
};

rateLimitRuleSchema.methods.deactivate = async function () {
  this.isActive = false;
  await this.save();
  return this;
};

rateLimitRuleSchema.methods.activate = async function () {
  this.isActive = true;
  await this.save();
  return this;
};

rateLimitRuleSchema.methods.matchesRequest = function (req) {
  // Check if rule is active
  if (!this.isActive) return false;

  // Check path pattern
  if (this.pathPattern && !new RegExp(this.pathPattern).test(req.path)) {
    return false;
  }

  // Check methods
  if (!this.methods.includes("ALL") && !this.methods.includes(req.method)) {
    return false;
  }

  // Check IP whitelist/blacklist
  const clientIp = req.ip;
  if (
    this.conditions.ipBlacklist &&
    this.conditions.ipBlacklist.includes(clientIp)
  ) {
    return false;
  }

  if (
    this.conditions.ipWhitelist &&
    this.conditions.ipWhitelist.includes(clientIp)
  ) {
    return true;
  }

  // Check user agent patterns
  if (
    this.conditions.userAgentPatterns &&
    this.conditions.userAgentPatterns.length > 0
  ) {
    const userAgent = req.get("User-Agent") || "";
    const matches = this.conditions.userAgentPatterns.some((pattern) =>
      new RegExp(pattern).test(userAgent)
    );
    if (!matches) return false;
  }

  // Check referer patterns
  if (
    this.conditions.refererPatterns &&
    this.conditions.refererPatterns.length > 0
  ) {
    const referer = req.get("Referer") || "";
    const matches = this.conditions.refererPatterns.some((pattern) =>
      new RegExp(pattern).test(referer)
    );
    if (!matches) return false;
  }

  return true;
};

// Static methods
rateLimitRuleSchema.statics.findMatchingRules = async function (req) {
  const rules = await this.find({ isActive: true }).sort({ priority: -1 });
  return rules.filter((rule) => rule.matchesRequest(req));
};

rateLimitRuleSchema.statics.getActiveRules = async function () {
  return await this.find({ isActive: true }).sort({
    priority: -1,
    createdAt: -1,
  });
};

rateLimitRuleSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
        totalHits: { $sum: "$stats.hits" },
        totalBlocks: { $sum: "$stats.blocks" },
        avgHits: { $avg: "$stats.hits" },
        avgBlocks: { $avg: "$stats.blocks" },
      },
    },
    {
      $project: {
        total: 1,
        active: 1,
        inactive: { $subtract: ["$total", "$active"] },
        totalHits: 1,
        totalBlocks: 1,
        blockRate: {
          $cond: [
            { $eq: ["$totalHits", 0] },
            0,
            { $multiply: [{ $divide: ["$totalBlocks", "$totalHits"] }, 100] },
          ],
        },
        avgHits: { $round: ["$avgHits", 2] },
        avgBlocks: { $round: ["$avgBlocks", 2] },
      },
    },
  ]);

  const topRules = await this.aggregate([
    { $match: { isActive: true } },
    { $sort: { "stats.hits": -1 } },
    { $limit: 10 },
    {
      $project: {
        name: 1,
        description: 1,
        zone: 1,
        rate: 1,
        hits: "$stats.hits",
        blocks: "$stats.blocks",
        blockRate: {
          $cond: [
            { $eq: ["$stats.hits", 0] },
            0,
            { $multiply: [{ $divide: ["$stats.blocks", "$stats.hits"] }, 100] },
          ],
        },
        lastHit: "$stats.lastHit",
        lastBlock: "$stats.lastBlock",
      },
    },
  ]);

  return {
    ...stats[0],
    topRules,
  };
};

const RateLimitRule = mongoose.model("RateLimitRule", rateLimitRuleSchema);

module.exports = RateLimitRule;
