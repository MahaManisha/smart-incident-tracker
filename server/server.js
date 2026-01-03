const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env vars FIRST
dotenv.config();

// Core imports
const connectDB = require("./config/database");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { startSLAChecker, startDailySummaryJob } = require("./jobs/slaChecker");

// Initialize app
const app = express();

// Connect DB before anything else
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

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Smart Incident Tracker API",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/incidents", require("./routes/incident"));
app.use("/api/sla", require("./routes/sla"));
app.use("/api/teams", require("./routes/team"));
app.use("/api/users", require("./routes/user"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/postmortems", require("./routes/postmortem"));
app.use("/api/notifications", require("./routes/notification"));

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start background jobs ONLY after server boots
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

// Unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});

// Uncaught exception
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});
