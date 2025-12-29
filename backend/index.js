console.log("Starting backend...");

const http = require("http");
const socketIo = require("socket.io");
const app = require("./app");
const logger = require("./utils/logger");

const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: ["http://localhost:5173"], credentials: true },
});

app.set("io", io);

io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on("disconnect", () => logger.info(`Socket disconnected: ${socket.id}`));
});

console.log("About to start server...");

server.listen(4000, () => {
  logger.info("Backend running on port 4000");
});
