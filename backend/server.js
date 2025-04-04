const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(express.json());

// Import routes
const phishingRoutes = require('./api/routes/phishingRoutes');

// Use routes
app.use('/api/v1/phishing', phishingRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('PhishNet API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;