const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();
console.log('Stripe Secret Key:', process.env.STRIPE_SECRET_KEY);

const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Create a log directory if it doesn't exist
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Configure winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: path.join(logDirectory, 'combined.log') }),
    new winston.transports.File({ filename: path.join(logDirectory, 'error.log'), level: 'error' }),
  ],
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const { pool } = require('./config/database');
const { initDb } = require('./utils/dbInit');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow multiple origins for local development
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:8081',
    ];

    // Allow requests with no origin (like mobile apps or curl requests) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all origins in development for now
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Request logging
app.use(morgan('combined', { stream: logger.stream }));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);

// Payment routes
const { createPaymentIntent } = require('./controllers/paymentController');
const paymentRouter = express.Router();
paymentRouter.post('/create-intent', createPaymentIntent);
app.use('/api/payments', paymentRouter);

// Delivery routes
const { validateAddress, validatePlace, calculateFee, getDeliveryConfig } = require('./controllers/deliveryController');
const deliveryRouter = express.Router();
deliveryRouter.post('/validate-address', validateAddress);
deliveryRouter.post('/validate-place', validatePlace);
deliveryRouter.post('/calculate-fee', calculateFee);
deliveryRouter.get('/config', getDeliveryConfig);
app.use('/api/delivery', deliveryRouter);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Server error:', { error: err.message, stack: err.stack });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  // Start server
  const server = app.listen(PORT, async () => {
    try {
      await initDb();
    } catch (error) {
      logger.error('Failed to initialize database:', error);
    }

    logger.info(`Server started on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║                                                      ║
  ║  🌮 Base2 Taco Restaurant Backend                   ║
  ║                                                      ║
  ║  Server running on: http://localhost:${PORT}         ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}                          ║
  ║                                                      ║
  ║  Auth Routes:                                        ║
  ║  - POST   /api/auth/register                        ║
  ║  - POST   /api/auth/login                           ║
  ║  - GET    /api/auth/me                              ║
  ║                                                      ║
  ║  Menu Routes (Public):                               ║
  ║  - GET    /api/menu                                 ║
  ║  - GET    /api/menu/items                           ║
  ║                                                      ║
  ║  Order Routes:                                       ║
  ║  - POST   /api/orders (Public)                      ║
  ║  - GET    /api/orders/list/active (Kitchen)         ║
  ║  - PATCH  /api/orders/:id/status (Kitchen)          ║
  ║  - GET    /api/orders (Admin)                       ║
  ║                                                      ║
  ║  - GET    /api/health                               ║
  ║                                                      ║
  ╚══════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      pool.end(() => {
        logger.info('Database pool closed');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    server.close(() => {
      pool.end(() => {
        logger.info('Database pool closed');
        process.exit(0);
      });
    });
  });
}

module.exports = app;
module.exports = app;
