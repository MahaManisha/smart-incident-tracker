const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { startSLAChecker, startDailySummaryJob } = require('./jobs/slaChecker');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Incident Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/incidents', require('./routes/incident'));
app.use('/api/sla', require('./routes/sla'));
app.use('/api/teams', require('./routes/team'));
app.use('/api/users', require('./routes/user'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/postmortems', require('./routes/postmortem'));
app.use('/api/notifications', require('./routes/notification'));

// 404 handler - must be after all routes
app.use(notFound);

// Global error handler - must be last
app.use(errorHandler);

// Start cron jobs
startSLAChecker();
startDailySummaryJob();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
  console.log(`💚 MongoDB Connected`);
  console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});