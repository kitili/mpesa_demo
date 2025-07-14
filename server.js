require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const mpesaRoutes = require('./routes/mpesaRoutes');
const smsRoutes = require('./routes/smsRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import database connection
const database = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
database.connect().catch(console.error);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-domain.com']
    : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    message: 'Rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/mpesa', limiter);
app.use('/api/auth', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();
    
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: dbHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server health check failed',
      error: error.message
    });
  }
});

// API routes
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TiaraConnect API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      demo: '/index.html',
      admin: '/admin-dashboard.html',
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        profile: '/api/auth/profile',
        changePassword: '/api/auth/change-password',
        forgotPassword: '/api/auth/forgot-password',
        resetPassword: '/api/auth/reset-password'
      },
      admin: {
        dashboard: '/api/admin/dashboard',
        users: '/api/admin/users',
        transactions: '/api/admin/transactions',
        stats: '/api/admin/stats',
        export: '/api/admin/export/transactions'
      },
      mpesa: {
        stkPush: '/api/mpesa/stk-push',
        stkQuery: '/api/mpesa/stk-query',
        c2bRegister: '/api/mpesa/c2b/register',
        c2bSimulate: '/api/mpesa/c2b/simulate',
        b2c: '/api/mpesa/b2c',
        transactionStatus: '/api/mpesa/transaction-status',
        accountBalance: '/api/mpesa/account-balance',
        reverse: '/api/mpesa/reverse',
        callbacks: {
          stk: '/api/mpesa/callbacks/stk',
          c2b: '/api/mpesa/callbacks/c2b',
          b2c: '/api/mpesa/callbacks/b2c'
        }
      },
      sms: {
        send: '/api/sms/send',
        bulk: '/api/sms/bulk',
        customNotification: '/api/sms/custom-notification',
        paymentInitiated: '/api/sms/payment-initiated',
        paymentSuccess: '/api/sms/payment-success',
        paymentFailed: '/api/sms/payment-failed',
        stkPushSent: '/api/sms/stk-push-sent',
        welcome: '/api/sms/welcome',
        test: '/api/sms/test',
        status: '/api/sms/status/:messageId',
        providerStatus: '/api/sms/provider-status'
      }
    },
    documentation: 'Check the README.md file for detailed API documentation'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    message: 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TiaraConnect API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Demo interface: http://localhost:${PORT}/index.html`);
  console.log(`👨‍💼 Admin dashboard: http://localhost:${PORT}/admin-dashboard.html`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  
  // Log configuration status
  if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
    console.warn('⚠️  MPesa credentials not configured. Please set up your .env file.');
  } else {
    console.log('✅ MPesa credentials configured');
  }
  
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MongoDB URI not configured. Using default local database.');
  } else {
    console.log('✅ MongoDB URI configured');
  }
  
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT secret not configured. Using default secret.');
  } else {
    console.log('✅ JWT secret configured');
  }
});

module.exports = app; 