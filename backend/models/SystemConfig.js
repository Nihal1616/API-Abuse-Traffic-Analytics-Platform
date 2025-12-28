const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

const systemConfigSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    dataType: {
      type: String,
      enum: ["string", "number", "boolean", "array", "object"],
      default: "string",
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    updatedBy: {
      type: String,
      ref: "User",
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    validationRules: {
      min: Number,
      max: Number,
      pattern: String,
      options: [String],
    },
    version: {
      type: Number,
      default: 1,
    },
    previousValues: [
      {
        value: mongoose.Schema.Types.Mixed,
        changedAt: Date,
        changedBy: String,
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for unique category/key combination
systemConfigSchema.index({ category: 1, key: 1 }, { unique: true });

// Methods
systemConfigSchema.methods.updateValue = async function (
  newValue,
  updatedBy,
  reason = ""
) {
  // Store previous value
  this.previousValues.push({
    value: this.value,
    changedAt: new Date(),
    changedBy: this.updatedBy,
    reason: reason || "Updated",
  });

  // Update current value
  this.value = newValue;
  this.updatedBy = updatedBy;
  this.version += 1;

  await this.save();
  return this;
};

systemConfigSchema.methods.deactivate = async function () {
  this.isActive = false;
  await this.save();
  return this;
};

systemConfigSchema.methods.activate = async function () {
  this.isActive = true;
  await this.save();
  return this;
};

// Static methods
systemConfigSchema.statics.getConfig = async function (category, key) {
  const config = await this.findOne({ category, key, isActive: true });
  return config ? config.value : null;
};

systemConfigSchema.statics.setConfig = async function (
  category,
  key,
  value,
  dataType = "string",
  description = "",
  updatedBy = "system"
) {
  let config = await this.findOne({ category, key });

  if (config) {
    await config.updateValue(value, updatedBy, "Config updated");
  } else {
    config = new this({
      category,
      key,
      value,
      dataType,
      description,
      updatedBy,
    });
    await config.save();
  }

  return config;
};

systemConfigSchema.statics.getCategoryConfig = async function (category) {
  const configs = await this.find({ category, isActive: true });

  const result = {};
  configs.forEach((config) => {
    result[config.key] = config.value;
  });

  return result;
};

systemConfigSchema.statics.getAllConfig = async function () {
  const configs = await this.find({ isActive: true });

  const result = {};
  configs.forEach((config) => {
    if (!result[config.category]) {
      result[config.category] = {};
    }
    result[config.category][config.key] = {
      value: config.value,
      dataType: config.dataType,
      description: config.description,
      isPublic: config.isPublic,
      updatedAt: config.updatedAt,
      version: config.version,
    };
  });

  return result;
};

systemConfigSchema.statics.initializeDefaultConfig = async function () {
  const defaultConfigs = [
    // Security settings
    {
      category: "security",
      key: "rate_limiting_enabled",
      value: true,
      dataType: "boolean",
      description: "Enable rate limiting",
      isPublic: true,
    },
    {
      category: "security",
      key: "rate_limit_requests_per_minute",
      value: 100,
      dataType: "number",
      description: "Requests per minute per IP",
      isPublic: true,
      validationRules: { min: 1, max: 10000 },
    },
    {
      category: "security",
      key: "auto_block_threshold",
      value: 90,
      dataType: "number",
      description: "Auto-block threshold for threat score",
      isPublic: true,
      validationRules: { min: 0, max: 100 },
    },
    {
      category: "security",
      key: "anomaly_detection_enabled",
      value: true,
      dataType: "boolean",
      description: "Enable anomaly detection",
      isPublic: true,
    },

    // Monitoring settings
    {
      category: "monitoring",
      key: "check_interval",
      value: 60,
      dataType: "number",
      description: "Health check interval in seconds",
      isPublic: true,
      validationRules: { min: 10, max: 300 },
    },
    {
      category: "monitoring",
      key: "alert_threshold_critical",
      value: 90,
      dataType: "number",
      description: "Critical alert threshold",
      isPublic: true,
      validationRules: { min: 0, max: 100 },
    },
    {
      category: "monitoring",
      key: "alert_threshold_high",
      value: 70,
      dataType: "number",
      description: "High alert threshold",
      isPublic: true,
      validationRules: { min: 0, max: 100 },
    },

    // Notification settings
    {
      category: "notifications",
      key: "email_enabled",
      value: true,
      dataType: "boolean",
      description: "Enable email notifications",
      isPublic: true,
    },
    {
      category: "notifications",
      key: "email_recipients",
      value: ["admin@apishield.com"],
      dataType: "array",
      description: "Email recipients for alerts",
      isPublic: false,
    },
    {
      category: "notifications",
      key: "slack_enabled",
      value: false,
      dataType: "boolean",
      description: "Enable Slack notifications",
      isPublic: true,
    },

    // General settings
    {
      category: "general",
      key: "maintenance_mode",
      value: false,
      dataType: "boolean",
      description: "System maintenance mode",
      isPublic: true,
    },
    {
      category: "general",
      key: "data_retention_days",
      value: 90,
      dataType: "number",
      description: "Days to retain data",
      isPublic: true,
      validationRules: { min: 1, max: 365 },
    },
    {
      category: "general",
      key: "timezone",
      value: "UTC",
      dataType: "string",
      description: "System timezone",
      isPublic: true,
    },
  ];

  for (const config of defaultConfigs) {
    const existing = await this.findOne({
      category: config.category,
      key: config.key,
    });
    if (!existing) {
      await this.setConfig(
        config.category,
        config.key,
        config.value,
        config.dataType,
        config.description,
        "system"
      );
    }
  }

  logger.info("Default configuration initialized");
};

const SystemConfig = mongoose.model("SystemConfig", systemConfigSchema);

module.exports = SystemConfig;
