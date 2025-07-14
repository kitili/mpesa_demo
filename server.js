require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mpesaRoutes = require('./routes/mpesaRoutes');
const smsRoutes = require('./routes/smsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/sms', smsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MPesa Integration API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      demo: '/index.html',
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
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MPesa Integration API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Demo interface: http://localhost:${PORT}/index.html`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  
  // Log configuration status
  if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
    console.warn('⚠️  MPesa credentials not configured. Please set up your .env file.');
  } else {
    console.log('✅ MPesa credentials configured');
  }
});

module.exports = app; 