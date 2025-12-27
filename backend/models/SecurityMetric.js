const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const securityMetricSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    metricType: {
      type: String,
      required: true,
      enum: [
        "traffic_volume",
        "error_rate",
        "response_time",
        "threat_score",
        "block_rate",
        "anomaly_count",
        "threat_actor_count",
        "endpoint_health",
        "security_score",
        "system_health",
      ],
      index: true,
    },
    timePeriod: {
      type: String,
      required: true,
      enum: ["realtime", "hourly", "daily", "weekly", "monthly"],
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
securityMetricSchema.index({ metricType: 1, timestamp: -1 });
securityMetricSchema.index({ timePeriod: 1, timestamp: -1 });
securityMetricSchema.index({ metricType: 1, timePeriod: 1, timestamp: -1 });

// Static methods
securityMetricSchema.statics.storeMetric = async function (
  metricType,
  timePeriod,
  value,
  metadata = {}
) {
  const metric = new this({
    metricType,
    timePeriod,
    timestamp: new Date(),
    value,
    metadata,
  });

  await metric.save();
  return metric;
};

securityMetricSchema.statics.getMetrics = async function (
  metricType,
  timePeriod,
  startTime,
  endTime
) {
  const query = {
    metricType,
    timePeriod,
    timestamp: { $gte: startTime, $lte: endTime },
  };

  return await this.find(query).sort({ timestamp: 1 }).lean();
};

securityMetricSchema.statics.getLatestMetric = async function (
  metricType,
  timePeriod
) {
  return await this.findOne({ metricType, timePeriod })
    .sort({ timestamp: -1 })
    .lean();
};

securityMetricSchema.statics.aggregateMetrics = async function (
  metricType,
  startTime,
  endTime,
  aggregation = "avg"
) {
  const aggregationStages = [
    {
      $match: {
        metricType,
        timestamp: { $gte: startTime, $lte: endTime },
      },
    },
  ];

  switch (aggregation) {
    case "avg":
      aggregationStages.push({
        $group: {
          _id: null,
          value: { $avg: "$value" },
        },
      });
      break;
    case "max":
      aggregationStages.push({
        $group: {
          _id: null,
          value: { $max: "$value" },
        },
      });
      break;
    case "min":
      aggregationStages.push({
        $group: {
          _id: null,
          value: { $min: "$value" },
        },
      });
      break;
    case "sum":
      aggregationStages.push({
        $group: {
          _id: null,
          value: { $sum: "$value" },
        },
      });
      break;
  }

  const result = await this.aggregate(aggregationStages);
  return result[0] ? result[0].value : 0;
};

securityMetricSchema.statics.getDashboardMetrics = async function () {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const metrics = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: twentyFourHoursAgo },
        timePeriod: "hourly",
      },
    },
    {
      $group: {
        _id: "$metricType",
        latest: { $last: "$$ROOT" },
        avg: { $avg: "$value" },
        max: { $max: "$value" },
        min: { $min: "$value" },
      },
    },
    {
      $project: {
        metricType: "$_id",
        latest: 1,
        avg: { $round: ["$avg", 2] },
        max: 1,
        min: 1,
        _id: 0,
      },
    },
  ]);

  const metricsMap = {};
  metrics.forEach((metric) => {
    metricsMap[metric.metricType] = metric;
  });

  return metricsMap;
};

securityMetricSchema.statics.cleanupOldMetrics = async function (
  retentionDays = 90
) {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate },
    timePeriod: { $in: ["hourly", "realtime"] },
  });

  return {
    deletedCount: result.deletedCount,
    cutoffDate,
    retentionDays,
  };
};

const SecurityMetric = mongoose.model("SecurityMetric", securityMetricSchema);

module.exports = SecurityMetric;
