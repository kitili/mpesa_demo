const express = require('express');
const Joi = require('joi');
const mpesaService = require('../services/mpesaService');
const { generateTimestamp } = require('../utils/mpesaUtils');

const router = express.Router();

// Validation schemas
const stkPushSchema = Joi.object({
  phoneNumber: Joi.string().required().min(10).max(15),
  amount: Joi.number().positive().max(70000).required(),
  accountReference: Joi.string().optional().max(12),
  transactionDesc: Joi.string().optional().max(13)
});

const stkQuerySchema = Joi.object({
  checkoutRequestID: Joi.string().required(),
  timestamp: Joi.string().optional()
});

const c2bSimulateSchema = Joi.object({
  phoneNumber: Joi.string().required().min(10).max(15),
  amount: Joi.number().positive().max(70000).required(),
  billReference: Joi.string().optional()
});

const b2cSchema = Joi.object({
  phoneNumber: Joi.string().required().min(10).max(15),
  amount: Joi.number().positive().max(70000).required(),
  occasion: Joi.string().optional().max(20),
  remarks: Joi.string().optional().max(100)
});

const transactionStatusSchema = Joi.object({
  transactionID: Joi.string().required(),
  occasion: Joi.string().optional().max(20),
  remarks: Joi.string().optional().max(100)
});

const reversalSchema = Joi.object({
  transactionID: Joi.string().required(),
  amount: Joi.number().positive().max(70000).required(),
  remarks: Joi.string().optional().max(100),
  occasion: Joi.string().optional().max(20)
});

const c2bRegisterSchema = Joi.object({
  confirmationURL: Joi.string().uri().required(),
  validationURL: Joi.string().uri().required()
});

// Middleware for validation
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        message: 'Validation failed'
      });
    }
    next();
  };
};

// STK Push (Lipa na M-Pesa Online)
router.post('/stk-push', validateRequest(stkPushSchema), async (req, res) => {
  try {
    const result = await mpesaService.initiateSTKPush(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('STK Push route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

// Query STK Push status
router.post('/stk-query', validateRequest(stkQuerySchema), async (req, res) => {
  try {
    const { checkoutRequestID, timestamp } = req.body;
    const queryTimestamp = timestamp || generateTimestamp();
    
    const result = await mpesaService.querySTKPush({
      checkoutRequestID,
      timestamp: queryTimestamp
    });
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('STK Query route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

// Register C2B URLs
router.post('/c2b/register', validateRequest(c2bRegisterSchema), async (req, res) => {
  try {
    const result = await mpesaService.registerC2BURLs(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('C2B Register route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

// Simulate C2B payment (for testing)
router.post('/c2b/simulate', validateRequest(c2bSimulateSchema), async (req, res) => {
  try {
    const result = await mpesaService.simulateC2B(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('C2B Simulate route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

// B2C payment (Business to Customer)
router.post('/b2c', validateRequest(b2cSchema), async (req, res) => {
  try {
    const result = await mpesaService.initiateB2C(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('B2C route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

// Query transaction status
router.post('/transaction-status', validateRequest(transactionStatusSchema), async (req, res) => {
  try {
    const result = await mpesaService.queryTransactionStatus(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Transaction Status route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

// Query account balance
router.post('/account-balance', async (req, res) => {
  try {
    const { remarks } = req.body;
    const result = await mpesaService.queryAccountBalance({ remarks });
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Account Balance route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

// Reverse transaction
router.post('/reverse', validateRequest(reversalSchema), async (req, res) => {
  try {
    const result = await mpesaService.reverseTransaction(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Reverse Transaction route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

// Callback endpoints for MPesa responses
router.post('/callbacks/stk', (req, res) => {
  try {
    console.log('STK Push Callback received:', JSON.stringify(req.body, null, 2));
    
    // Process the callback data
    const { Body } = req.body;
    if (Body && Body.stkCallback) {
      const { ResultCode, ResultDesc, CheckoutRequestID } = Body.stkCallback;
      
      // Handle different result codes
      switch (ResultCode) {
        case 0:
          console.log(`Payment successful for CheckoutRequestID: ${CheckoutRequestID}`);
          // Update your database, send confirmation email, etc.
          break;
        case 1:
          console.log(`Payment failed for CheckoutRequestID: ${CheckoutRequestID}`);
          break;
        default:
          console.log(`Payment ${ResultDesc} for CheckoutRequestID: ${CheckoutRequestID}`);
      }
    }
    
    res.status(200).json({ success: true, message: 'Callback processed' });
  } catch (error) {
    console.error('STK Callback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/callbacks/c2b', (req, res) => {
  try {
    console.log('C2B Callback received:', JSON.stringify(req.body, null, 2));
    
    // Process C2B callback
    const { TransID, TransAmount, MSISDN, BillReferenceNumber, BusinessShortCode } = req.body;
    
    console.log(`C2B Payment: ${TransAmount} from ${MSISDN} for ${BillReferenceNumber}`);
    
    // Update your database, process the payment, etc.
    
    res.status(200).json({ success: true, message: 'C2B callback processed' });
  } catch (error) {
    console.error('C2B Callback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/callbacks/b2c', (req, res) => {
  try {
    console.log('B2C Callback received:', JSON.stringify(req.body, null, 2));
    
    // Process B2C callback
    const { Result } = req.body;
    if (Result) {
      const { ResultCode, ResultDesc, TransactionID, ConversationID } = Result;
      
      console.log(`B2C Result: ${ResultDesc} for TransactionID: ${TransactionID}`);
      
      // Update your database, send notifications, etc.
    }
    
    res.status(200).json({ success: true, message: 'B2C callback processed' });
  } catch (error) {
    console.error('B2C Callback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MPesa API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.MPESA_ENVIRONMENT || 'sandbox'
  });
});

module.exports = router;