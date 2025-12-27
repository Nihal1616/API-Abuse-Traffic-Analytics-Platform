const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { v4: uuidv4 } = require("uuid");

const apiRequestSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    requestId: {
      type: String,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    statusCode: {
      type: Number,
      required: true,
      index: true,
    },
    responseTime: {
      type: Number, // milliseconds
      min: 0,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    countryCode: {
      type: String,
      index: true,
    },
    userAgent: {
      type: String,
    },
    headers: {
      type: Map,
      of: String,
      default: {},
    },
    queryParams: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    body: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    response: {
      status: Number,
      headers: Map,
      body: mongoose.Schema.Types.Mixed,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    threatScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },
    anomalyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },
    threatActorId: {
      type: String,
      ref: "ThreatActor",
      index: true,
    },
    anomalyIds: [
      {
        type: String,
        ref: "Anomaly",
        index: true,
      },
    ],
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
apiRequestSchema.index({ timestamp: -1, statusCode: 1 });
apiRequestSchema.index({ ipAddress: 1, timestamp: -1 });
apiRequestSchema.index({ endpoint: 1, timestamp: -1 });
apiRequestSchema.index({ threatScore: -1, timestamp: -1 });
apiRequestSchema.index({ isBlocked: 1, timestamp: -1 });
apiRequestSchema.index({ countryCode: 1, timestamp: -1 });

// Text search index
apiRequestSchema.index({ endpoint: "text", userAgent: "text" });

// Virtuals
apiRequestSchema.virtual("isError").get(function () {
  return this.statusCode >= 400;
});

apiRequestSchema.virtual("isSuccess").get(function () {
  return this.statusCode >= 200 && this.statusCode < 300;
});

apiRequestSchema.virtual("formatted").get(function () {
  return {
    id: this._id,
    timestamp: this.timestamp,
    method: this.method,
    endpoint: this.endpoint,
    statusCode: this.statusCode,
    responseTime: this.responseTime,
    ipAddress: this.ipAddress,
    countryCode: this.countryCode,
    isBlocked: this.isBlocked,
    threatScore: this.threatScore,
    anomalyScore: this.anomalyScore,
    userAgent: this.userAgent,
    processedAt: this.processedAt,
  };
});

// Static methods
apiRequestSchema.statics.getTimeSeriesData = async function (
  startTime,
  endTime,
  interval = "hour"
) {
  const matchStage = {
    timestamp: {
      $gte: startTime,
      $lte: endTime,
    },
  };

  const groupStage = {
    _id: {
      $dateToString: {
        format: interval === "hour" ? "%Y-%m-%d %H:00:00" : "%Y-%m-%d 00:00:00",
        date: "$timestamp",
        timezone: "UTC",
      },
    },
    requests: { $sum: 1 },
    blocked: { $sum: { $cond: [{ $eq: ["$isBlocked", true] }, 1, 0] } },
    errors: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
    avgResponseTime: { $avg: "$responseTime" },
    maxResponseTime: { $max: "$responseTime" },
    minResponseTime: { $min: "$responseTime" },
  };

  const result = await this.aggregate([
    { $match: matchStage },
    { $group: groupStage },
    { $sort: { _id: 1 } },
    {
      $project: {
        timestamp: "$_id",
        requests: 1,
        blocked: 1,
        errors: 1,
        avgResponseTime: { $round: ["$avgResponseTime", 2] },
        maxResponseTime: 1,
        minResponseTime: 1,
        _id: 0,
      },
    },
  ]);

  return result;
};

apiRequestSchema.statics.getEndpointStats = async function (timeRange = "24h") {
  const timeFilter = getTimeFilter(timeRange);

  return await this.aggregate([
    { $match: timeFilter },
    {
      $group: {
        _id: "$endpoint",
        requestCount: { $sum: 1 },
        errorCount: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
        blockedCount: {
          $sum: { $cond: [{ $eq: ["$isBlocked", true] }, 1, 0] },
        },
        avgResponseTime: { $avg: "$responseTime" },
        maxResponseTime: { $max: "$responseTime" },
        uniqueIPs: { $addToSet: "$ipAddress" },
      },
    },
    {
      $project: {
        endpoint: "$_id",
        requestCount: 1,
        errorCount: 1,
        blockedCount: 1,
        errorRate: {
          $round: [
            { $multiply: [{ $divide: ["$errorCount", "$requestCount"] }, 100] },
            2,
          ],
        },
        avgResponseTime: { $round: ["$avgResponseTime", 2] },
        maxResponseTime: 1,
        uniqueIPCount: { $size: "$uniqueIPs" },
        _id: 0,
      },
    },
    { $sort: { requestCount: -1 } },
    { $limit: 20 },
  ]);
};

apiRequestSchema.statics.getIPStats = async function (timeRange = "24h") {
  const timeFilter = getTimeFilter(timeRange);

  return await this.aggregate([
    { $match: timeFilter },
    {
      $group: {
        _id: "$ipAddress",
        requestCount: { $sum: 1 },
        errorCount: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
        blockedCount: {
          $sum: { $cond: [{ $eq: ["$isBlocked", true] }, 1, 0] },
        },
        avgThreatScore: { $avg: "$threatScore" },
        endpoints: { $addToSet: "$endpoint" },
        lastRequest: { $max: "$timestamp" },
        firstRequest: { $min: "$timestamp" },
      },
    },
    {
      $project: {
        ipAddress: "$_id",
        requestCount: 1,
        errorCount: 1,
        blockedCount: 1,
        errorRate: {
          $round: [
            { $multiply: [{ $divide: ["$errorCount", "$requestCount"] }, 100] },
            2,
          ],
        },
        avgThreatScore: { $round: ["$avgThreatScore", 2] },
        endpointCount: { $size: "$endpoints" },
        lastRequest: 1,
        firstRequest: 1,
        durationHours: {
          $divide: [
            { $subtract: ["$lastRequest", "$firstRequest"] },
            1000 * 60 * 60,
          ],
        },
        _id: 0,
      },
    },
    { $sort: { requestCount: -1 } },
    { $limit: 50 },
  ]);
};

apiRequestSchema.statics.getStatistics = async function (timeRange = "24h") {
  const timeFilter = getTimeFilter(timeRange);

  const stats = await this.aggregate([
    { $match: timeFilter },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        blockedRequests: {
          $sum: { $cond: [{ $eq: ["$isBlocked", true] }, 1, 0] },
        },
        errorRequests: {
          $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] },
        },
        avgResponseTime: { $avg: "$responseTime" },
        maxResponseTime: { $max: "$responseTime" },
        uniqueIPs: { $addToSet: "$ipAddress" },
        uniqueEndpoints: { $addToSet: "$endpoint" },
      },
    },
    {
      $project: {
        totalRequests: 1,
        blockedRequests: 1,
        errorRequests: 1,
        errorRate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$errorRequests", "$totalRequests"] },
                100,
              ],
            },
            2,
          ],
        },
        blockRate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$blockedRequests", "$totalRequests"] },
                100,
              ],
            },
            2,
          ],
        },
        avgResponseTime: { $round: ["$avgResponseTime", 2] },
        maxResponseTime: 1,
        uniqueIPCount: { $size: "$uniqueIPs" },
        uniqueEndpointCount: { $size: "$uniqueEndpoints" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalRequests: 0,
      blockedRequests: 0,
      errorRequests: 0,
      errorRate: 0,
      blockRate: 0,
      avgResponseTime: 0,
      maxResponseTime: 0,
      uniqueIPCount: 0,
      uniqueEndpointCount: 0,
    }
  );
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
apiRequestSchema.plugin(mongoosePaginate);

const ApiRequest = mongoose.model("ApiRequest", apiRequestSchema);

module.exports = ApiRequest;
