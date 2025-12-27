const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "security", "viewer"],
      default: "viewer",
    },
    permissions: {
      type: [String],
      default: ["view"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    lastActivity: {
      type: Date,
    },
    preferences: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActivity: -1 });

// Virtual for formatted user
userSchema.virtual("formatted").get(function () {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    role: this.role,
    permissions: this.permissions,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

// Methods
userSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.updateLastActivity = async function () {
  this.lastActivity = new Date();
  await this.save();
};

userSchema.methods.deactivate = async function () {
  this.isActive = false;
  await this.save();
};

userSchema.methods.activate = async function () {
  this.isActive = true;
  await this.save();
};

// Static methods
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.createUser = async function (userData) {
  const { email, password, name, role, permissions } = userData;

  const existingUser = await this.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = new this({
    email: email.toLowerCase(),
    passwordHash,
    name,
    role: role || "viewer",
    permissions: permissions || ["view"],
  });

  await user.save();
  return user;
};

userSchema.statics.updateUser = async function (userId, updates) {
  const user = await this.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Don't allow updating email
  if (updates.email) {
    delete updates.email;
  }

  // Hash password if provided
  if (updates.password) {
    updates.passwordHash = await bcrypt.hash(updates.password, 12);
    delete updates.password;
  }

  Object.assign(user, updates);
  await user.save();
  return user;
};

userSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        role: "$_id",
        count: 1,
        active: 1,
        inactive: { $subtract: ["$count", "$active"] },
      },
    },
  ]);

  const total = await this.countDocuments();
  const active = await this.countDocuments({ isActive: true });

  return {
    total,
    active,
    inactive: total - active,
    byRole: stats,
  };
};

const User = mongoose.model("User", userSchema);

module.exports = User;
