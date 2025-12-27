const app = require("./app");
const http = require("http");
const socketIo = require("socket.io");
const logger = require("./utils/logger");
require("dotenv").config();


const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Socket.io for real-time updates
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:8080",
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Attach io to app for use in routes
app.set("io", io);

// Real-time security events
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on("subscribe", (channel) => {
    socket.join(channel);
    logger.info(`Client ${socket.id} subscribed to ${channel}`);
  });

  socket.on("unsubscribe", (channel) => {
    socket.leave(channel);
  });

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Global error handler
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

server.listen(PORT, () => {
  logger.info(`API Shield Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = server;
