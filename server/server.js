const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables first
dotenv.config();

// Core imports
const connectDB = require("./config/database");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { startSLAChecker, startDailySummaryJob } = require("./jobs/slaChecker");

// Route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const incidentRoutes = require("./routes/incident");
const slaRoutes = require("./routes/sla");
const teamRoutes = require("./routes/team");
const analyticsRoutes = require("./routes/analytics");
const postmortemRoutes = require("./routes/postmortem");
const notificationRoutes = require("./routes/notification");

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start background jobs after server starts
const startBackgroundJobs = () => {
  startSLAChecker();
  startDailySummaryJob();
};

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log("=".repeat(50));

  startBackgroundJobs();
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
