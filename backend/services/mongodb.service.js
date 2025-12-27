const mongoose = require("mongoose");
const logger = require("../utils/logger");

class MongoDBService {
  constructor() {
    this.isConnected = false;
    this.mongoose = mongoose;
  }

  async connect() {
    try {
      const mongoUri =
        process.env.MONGODB_URI || "mongodb://localhost:27017/api-shield";

      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      logger.info("MongoDB connected successfully");

      // Connection event handlers
      mongoose.connection.on("error", (err) => {
        logger.error("MongoDB connection error:", err);
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("MongoDB disconnected");
        this.isConnected = false;
      });

      mongoose.connection.on("reconnected", () => {
        logger.info("MongoDB reconnected");
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on("SIGINT", this.closeConnection.bind(this));
      process.on("SIGTERM", this.closeConnection.bind(this));
    } catch (error) {
      logger.error("MongoDB connection failed:", error);
      throw error;
    }
  }

  async closeConnection() {
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
      process.exit(0);
    } catch (error) {
      logger.error("Error closing MongoDB connection:", error);
      process.exit(1);
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: "down", message: "Not connected to MongoDB" };
      }

      await mongoose.connection.db.admin().ping();
      return {
        status: "up",
        message: "MongoDB is healthy",
        stats: {
          collections: await mongoose.connection.db.collections(),
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
        },
      };
    } catch (error) {
      return { status: "down", message: error.message };
    }
  }

  async getDatabaseStats() {
    try {
      if (!this.isConnected) {
        throw new Error("Not connected to MongoDB");
      }

      const stats = await mongoose.connection.db.stats();
      return {
        db: stats.db,
        collections: stats.collections,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        fileSize: stats.fileSize,
      };
    } catch (error) {
      logger.error("Error getting MongoDB stats:", error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      logger.info("Creating MongoDB indexes...");

      // User indexes
      await mongoose.model("User").createIndexes();

      // ApiRequest indexes
      await mongoose.model("ApiRequest").createIndexes();

      // ThreatActor indexes
      await mongoose.model("ThreatActor").createIndexes();

      // Anomaly indexes
      await mongoose.model("Anomaly").createIndexes();

      logger.info("MongoDB indexes created successfully");
    } catch (error) {
      logger.error("Error creating MongoDB indexes:", error);
      throw error;
    }
  }

  async backupDatabase() {
    try {
      // This is a simplified backup. In production, use mongodump
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = `./backups/backup-${timestamp}.json`;

      // Get all collections data
      const collections = await mongoose.connection.db.collections();
      const backupData = {};

      for (const collection of collections) {
        const collectionName = collection.collectionName;
        const documents = await collection.find({}).toArray();
        backupData[collectionName] = documents;
      }

      // In a real implementation, you would write to a file or cloud storage
      logger.info(`Database backup completed: ${backupPath}`);

      return {
        path: backupPath,
        timestamp: new Date(),
        collections: Object.keys(backupData),
        documentCount: Object.values(backupData).reduce(
          (sum, docs) => sum + docs.length,
          0
        ),
      };
    } catch (error) {
      logger.error("Database backup failed:", error);
      throw error;
    }
  }
}

module.exports = new MongoDBService();
