require('dotenv').config();

const config = {
  // MPesa API Configuration
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE,
  initiatorName: process.env.MPESA_INITIATOR_NAME,
  securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
  
  // Environment
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  
  // API Base URLs
  baseURL: process.env.MPESA_ENVIRONMENT === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke',
  
  // API Endpoints
  endpoints: {
    // Authentication
    auth: '/oauth/v1/generate?grant_type=client_credentials',
    
    // STK Push (Lipa na M-Pesa Online)
    stkPush: '/mpesa/stkpush/v1/processrequest',
    stkPushQuery: '/mpesa/stkpushquery/v1/query',
    
    // C2B (Customer to Business)
    c2bRegister: '/mpesa/c2b/v1/registerurl',
    c2bSimulate: '/mpesa/c2b/v1/simulate',
    
    // B2C (Business to Customer)
    b2c: '/mpesa/b2c/v1/paymentrequest',
    
    // Transaction Status
    transactionStatus: '/mpesa/transactionstatus/v1/query',
    
    // Account Balance
    accountBalance: '/mpesa/accountbalance/v1/query',
    
    // Reversal
    reversal: '/mpesa/reversal/v1/request'
  },
  
  // Callback URLs (update these with your actual URLs)
  callbacks: {
    c2b: process.env.C2B_CALLBACK_URL || 'https://your-domain.com/api/mpesa/c2b-callback',
    b2c: process.env.B2C_CALLBACK_URL || 'https://your-domain.com/api/mpesa/b2c-callback',
    stkPush: process.env.STK_CALLBACK_URL || 'https://your-domain.com/api/mpesa/stk-callback'
  },
  
  // Timeout settings
  timeout: 30000, // 30 seconds
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000
};

module.exports = config; 