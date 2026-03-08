const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables first
dotenv.config();

// Core imports
const connectDB = require("./config/database");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { startSLAChecker, startDailySummaryJob } = require("./jobs/slaChecker");
const { startEscalationEngine } = require("./services/escalationService");

// Route imports - (Restart Triggered)
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const incidentRoutes = require("./routes/incident");
const slaRoutes = require("./routes/sla");
const teamRoutes = require("./routes/team");
const analyticsRoutes = require("./routes/analytics");
const postmortemRoutes = require("./routes/postmortem");
const notificationRoutes = require("./routes/notification");
const escalationRoutes = require("./routes/escalation");
const onCallRoutes = require("./routes/onCall");
const incidentTemplateRoutes = require("./routes/incidentTemplate");
const serviceMappingRoutes = require("./routes/serviceMapping");

const { seedTemplates } = require("./services/templateSeeder");

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Dev-only request logger
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Smart Incident Tracker API",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // Make sure userRoutes points to './routes/user.js'
app.use("/api/incidents", incidentRoutes);
app.use("/api/sla", slaRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/postmortems", postmortemRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/escalation", escalationRoutes);
app.use("/api/oncall", onCallRoutes);
app.use("/api/incident-templates", incidentTemplateRoutes);
app.use("/api/mapping", serviceMappingRoutes);
app.use("/api/messages", require("./routes/messages"));
app.use("/api/documentation", require("./routes/documentation"));
app.use("/api/reporter/documents", require("./routes/reporterDocuments"));


// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start background jobs after server starts
const startBackgroundJobs = () => {
  startSLAChecker();
  startDailySummaryJob();
  startEscalationEngine();
};

// Start server
const { Server } = require("socket.io");

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log("=".repeat(50));

  startBackgroundJobs();
  seedTemplates();
});

// Initialize Socket.io
const socketUtil = require('./socket');
const io = socketUtil.init(server);

app.set('io', io); // Make io accessible in controllers if needed

io.on("connection", (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  // Join a team room
  socket.on("join_team", (teamId) => {
    socket.join(teamId);
    console.log(`User joined team room: ${teamId}`);
  });

  // Join user room (for personal notifications)
  socket.on("join_user_room", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined personal room`);
  });

  // Handle sending message
  socket.on("send_message", (messageData) => {
    // messageData: { teamId, sender, content, createdAt, ... }
    // Broadcast to everyone in the room INCLUDING sender (simplifies frontend state)
    io.to(messageData.team).emit("receive_message", messageData);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});



// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});
