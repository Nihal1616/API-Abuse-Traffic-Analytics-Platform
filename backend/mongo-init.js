// MongoDB initialization script
db = db.getSiblingDB("apishield");

// Create application user
db.createUser({
  user: "apishield",
  pwd: "${MONGO_PASSWORD}",
  roles: [
    { role: "readWrite", db: "apishield" },
    { role: "dbAdmin", db: "apishield" },
  ],
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

db.apirequests.createIndex({ timestamp: -1 });
db.apirequests.createIndex({ ipAddress: 1, timestamp: -1 });
db.apirequests.createIndex({ endpoint: 1, timestamp: -1 });
db.apirequests.createIndex({ statusCode: 1 });
db.apirequests.createIndex({ isBlocked: 1 });

db.threatactors.createIndex({ ipAddress: 1 }, { unique: true });
db.threatactors.createIndex({ threatScore: -1 });
db.threatactors.createIndex({ status: 1 });
db.threatactors.createIndex({ lastSeen: -1 });

db.anomalies.createIndex({ timestamp: -1 });
db.anomalies.createIndex({ severity: 1, timestamp: -1 });
db.anomalies.createIndex({ status: 1 });

db.actionrecommendations.createIndex({ status: 1, priority: -1 });
db.actionrecommendations.createIndex({ confidence: -1 });

db.systemconfigs.createIndex({ category: 1, key: 1 }, { unique: true });

db.threatintels.createIndex({ type: 1, value: 1 }, { unique: true });
db.threatintels.createIndex({ risk: 1 });

db.auditlogs.createIndex({ createdAt: -1 });
db.auditlogs.createIndex({ userId: 1, createdAt: -1 });

console.log("MongoDB initialized successfully");
