const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { v4: uuidv4 } = require("uuid");

const threatIntelSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    type: {
      type: String,
      required: true,
      enum: [
        "ip",
        "domain",
        "ip_range",
        "user_agent",
        "pattern",
        "hash",
        "url",
      ],
      index: true,
    },
    value: {
      type: String,
      required: true,
      index: true,
    },
    risk: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    category: {
      type: String,
      enum: [
        "malware",
        "phishing",
        "botnet",
        "scanner",
        "spam",
        "exploit",
        "ddos",
        "tor_exit",
        "vpn",
        "proxy",
        "crawler",
        "suspicious",
      ],
      index: true,
    },
    source: {
      type: String,
      required: true,
      enum: ["internal", "external", "manual", "partner"],
      index: true,
    },
    sourceDetails: {
      name: String,
      url: String,
      confidence: Number,
      lastUpdated: Date,
    },
    description: {
      type: String,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
      index: true,
    },
    addedBy: {
      type: String,
      ref: "User",
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    references: [
      {
        type: String,
        url: String,
        description: String,
      },
    ],
    affectedSystems: [
      {
        system: String,
        firstSeen: Date,
        lastSeen: Date,
        count: Number,
      },
    ],
    mitigation: {
      type: String,
    },
    relatedIntelIds: [
      {
        type: String,
        ref: "ThreatIntel",
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
threatIntelSchema.index({ type: 1, value: 1 }, { unique: true });
threatIntelSchema.index({ risk: 1, lastSeen: -1 });
threatIntelSchema.index({ category: 1, isActive: 1 });
threatIntelSchema.index({ source: 1, confidence: -1 });

// Text index for search
threatIntelSchema.index({ value: "text", description: "text", tags: "text" });

// Virtuals
threatIntelSchema.virtual("formatted").get(function () {
  return {
    id: this._id,
    type: this.type,
    value: this.value,
    risk: this.risk,
    category: this.category,
    source: this.source,
    description: this.description,
    firstSeen: this.firstSeen,
    lastSeen: this.lastSeen,
    isActive: this.isActive,
    expiresAt: this.expiresAt,
    confidence: this.confidence,
    tags: this.tags,
    mitigation: this.mitigation,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

threatIntelSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Methods
threatIntelSchema.methods.updateLastSeen = async function () {
  this.lastSeen = new Date();
  await this.save();
  return this;
};

threatIntelSchema.methods.deactivate = async function () {
  this.isActive = false;
  await this.save();
  return this;
};

threatIntelSchema.methods.activate = async function () {
  this.isActive = true;
  await this.save();
  return this;
};

threatIntelSchema.methods.addTag = async function (tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    await this.save();
  }
  return this;
};

threatIntelSchema.methods.addAffectedSystem = async function (system) {
  const existing = this.affectedSystems.find((s) => s.system === system);

  if (existing) {
    existing.lastSeen = new Date();
    existing.count += 1;
  } else {
    this.affectedSystems.push({
      system,
      firstSeen: new Date(),
      lastSeen: new Date(),
      count: 1,
    });
  }

  await this.save();
  return this;
};

// Static methods
threatIntelSchema.statics.findByValue = async function (type, value) {
  return await this.findOne({ type, value, isActive: true });
};

threatIntelSchema.statics.checkIP = async function (ipAddress) {
  // Check exact IP match
  const exactMatch = await this.findOne({
    type: "ip",
    value: ipAddress,
    isActive: true,
  });

  if (exactMatch) {
    return exactMatch;
  }

  // Check IP range matches (simplified - in production use proper IP range matching)
  const rangeMatches = await this.find({
    type: "ip_range",
    isActive: true,
  });

  for (const range of rangeMatches) {
    if (isIPInRange(ipAddress, range.value)) {
      return range;
    }
  }

  return null;
};

threatIntelSchema.statics.getActiveIntel = async function (filters = {}) {
  const query = { isActive: true };

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.risk) {
    query.risk = filters.risk;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.source) {
    query.source = filters.source;
  }

  if (filters.minConfidence) {
    query.confidence = { $gte: filters.minConfidence };
  }

  if (filters.tags) {
    query.tags = { $in: filters.tags };
  }

  return await this.find(query)
    .sort({ risk: -1, confidence: -1 })
    .limit(filters.limit || 100)
    .lean();
};

threatIntelSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
        expired: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$expiresAt", null] },
                  { $gt: [new Date(), "$expiresAt"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        byRisk: {
          $push: {
            risk: "$risk",
            count: 1,
          },
        },
        byType: {
          $push: {
            type: "$type",
            count: 1,
          },
        },
        byCategory: {
          $push: {
            category: "$category",
            count: 1,
          },
        },
      },
    },
    {
      $project: {
        total: 1,
        active: 1,
        expired: 1,
        byRisk: {
          $arrayToObject: {
            $map: {
              input: "$byRisk",
              as: "item",
              in: {
                k: "$$item.risk",
                v: { $sum: "$$item.count" },
              },
            },
          },
        },
        byType: {
          $arrayToObject: {
            $map: {
              input: "$byType",
              as: "item",
              in: {
                k: "$$item.type",
                v: { $sum: "$$item.count" },
              },
            },
          },
        },
        byCategory: {
          $arrayToObject: {
            $map: {
              input: "$byCategory",
              as: "item",
              in: {
                k: { $ifNull: ["$$item.category", "unknown"] },
                v: { $sum: "$$item.count" },
              },
            },
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      total: 0,
      active: 0,
      expired: 0,
      byRisk: {},
      byType: {},
      byCategory: {},
    }
  );
};

threatIntelSchema.statics.cleanupExpired = async function () {
  const result = await this.updateMany(
    {
      isActive: true,
      expiresAt: { $lt: new Date() },
    },
    {
      $set: { isActive: false },
    }
  );

  return {
    deactivatedCount: result.modifiedCount,
    timestamp: new Date(),
  };
};

// Helper function for IP range checking (simplified)
function isIPInRange(ip, range) {
  // Simplified implementation
  // In production, use proper IP address range checking library
  if (range.includes("/")) {
    // CIDR notation
    const [rangeIp, prefix] = range.split("/");
    // Implement CIDR check here
  } else if (range.includes("-")) {
    // Range notation
    const [startIp, endIp] = range.split("-");
    // Implement range check here
  }
  return false;
}

// Add pagination plugin
threatIntelSchema.plugin(mongoosePaginate);

const ThreatIntel = mongoose.model("ThreatIntel", threatIntelSchema);

module.exports = ThreatIntel;
