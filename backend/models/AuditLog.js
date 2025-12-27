const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { v4: uuidv4 } = require("uuid");

const auditLogSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    userId: {
      type: String,
      ref: "User",
      index: true,
    },
    userEmail: {
      type: String,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "login_failed",
        "config_update",
        "config_create",
        "config_delete",
        "user_create",
        "user_update",
        "user_delete",
        "user_deactivate",
        "ip_block",
        "ip_unblock",
        "throttle",
        "challenge",
        "anomaly_resolve",
        "anomaly_ignore",
        "anomaly_assign",
        "recommendation_apply",
        "recommendation_reject",
        "threat_intel_add",
        "threat_intel_remove",
        "threat_intel_update",
        "backup_create",
        "backup_restore",
        "backup_delete",
        "system_restart",
        "system_shutdown",
        "maintenance_mode",
      ],
      index: true,
    },
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    details: {
      type: String,
    },
    ipAddress: {
      type: String,
      index: true,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ["success", "failed", "partial"],
      default: "success",
      index: true,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      default: "info",
      index: true,
    },
    changes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    duration: {
      type: Number, // milliseconds
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
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });

// Virtuals
auditLogSchema.virtual("formatted").get(function () {
  return {
    id: this._id,
    userId: this.userId,
    userEmail: this.userEmail,
    action: this.action,
    resource: this.resource,
    resourceId: this.resourceId,
    details: this.details,
    ipAddress: this.ipAddress,
    status: this.status,
    severity: this.severity,
    changes: this.changes,
    duration: this.duration,
    createdAt: this.createdAt,
  };
});

// Static methods
auditLogSchema.statics.log = async function (logData) {
  const auditLog = new this(logData);
  await auditLog.save();
  return auditLog;
};

auditLogSchema.statics.getLogs = async function (filters = {}) {
  const {
    page = 1,
    limit = 50,
    userId,
    userEmail,
    action,
    resource,
    status,
    severity,
    startDate,
    endDate,
    search,
  } = filters;

  const query = {};

  if (userId) query.userId = userId;
  if (userEmail) query.userEmail = userEmail;
  if (action) query.action = action;
  if (resource) query.resource = resource;
  if (status) query.status = status;
  if (severity) query.severity = severity;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { userEmail: { $regex: search, $options: "i" } },
      { resource: { $regex: search, $options: "i" } },
      { details: { $regex: search, $options: "i" } },
      { ipAddress: { $regex: search, $options: "i" } },
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    lean: true,
  };

  return await this.paginate(query, options);
};

auditLogSchema.statics.getStatistics = async function (timeRange = "24h") {
  const timeFilter = getTimeFilter(timeRange);

  const stats = await this.aggregate([
    { $match: { createdAt: timeFilter } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        success: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        byAction: {
          $push: {
            action: "$action",
            count: 1,
          },
        },
        byUser: {
          $push: {
            userEmail: "$userEmail",
            count: 1,
          },
        },
        bySeverity: {
          $push: {
            severity: "$severity",
            count: 1,
          },
        },
        avgDuration: { $avg: "$duration" },
      },
    },
    {
      $project: {
        total: 1,
        success: 1,
        failed: 1,
        successRate: {
          $cond: [
            { $eq: ["$total", 0] },
            0,
            { $multiply: [{ $divide: ["$success", "$total"] }, 100] },
          ],
        },
        byAction: {
          $arrayToObject: {
            $map: {
              input: "$byAction",
              as: "item",
              in: {
                k: "$$item.action",
                v: { $sum: "$$item.count" },
              },
            },
          },
        },
        byUser: {
          $arrayToObject: {
            $map: {
              input: {
                $slice: [
                  {
                    $sortArray: {
                      input: "$byUser",
                      sortBy: { count: -1 },
                    },
                  },
                  10,
                ],
              },
              as: "item",
              in: {
                k: { $ifNull: ["$$item.userEmail", "anonymous"] },
                v: { $sum: "$$item.count" },
              },
            },
          },
        },
        bySeverity: {
          $arrayToObject: {
            $map: {
              input: "$bySeverity",
              as: "item",
              in: {
                k: "$$item.severity",
                v: { $sum: "$$item.count" },
              },
            },
          },
        },
        avgDuration: { $round: ["$avgDuration", 2] },
      },
    },
  ]);

  const hourlyTrend = await this.aggregate([
    { $match: { createdAt: timeFilter } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d %H:00:00",
            date: "$createdAt",
            timezone: "UTC",
          },
        },
        count: { $sum: 1 },
        success: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        hour: "$_id",
        count: 1,
        success: 1,
        successRate: {
          $cond: [
            { $eq: ["$count", 0] },
            0,
            { $multiply: [{ $divide: ["$success", "$count"] }, 100] },
          ],
        },
        _id: 0,
      },
    },
  ]);

  return {
    ...stats[0],
    hourlyTrend,
  };
};

auditLogSchema.statics.cleanupOldLogs = async function (retentionDays = 90) {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    severity: { $ne: "critical" },
  });

  // Keep critical logs for longer
  const criticalCutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const criticalResult = await this.deleteMany({
    createdAt: { $lt: criticalCutoffDate },
    severity: "critical",
  });

  return {
    deletedCount: result.deletedCount + criticalResult.deletedCount,
    cutoffDate,
    retentionDays,
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
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return { $gte: startTime };
}

// Add pagination plugin
auditLogSchema.plugin(mongoosePaginate);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
