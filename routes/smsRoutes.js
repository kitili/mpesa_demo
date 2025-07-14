const express = require('express');
const router = express.Router();
const smsService = require('../services/smsService');
const Joi = require('joi');

// Validation schemas
const sendSMSSchema = Joi.object({
    phoneNumber: Joi.string().pattern(/^\+254\d{9}$/).required(),
    message: Joi.string().min(1).max(160).required(),
    from: Joi.string().optional()
});

const bulkSMSSchema = Joi.object({
    phoneNumbers: Joi.array().items(Joi.string().pattern(/^\+254\d{9}$/)).min(1).max(100).required(),
    message: Joi.string().min(1).max(160).required(),
    from: Joi.string().optional()
});

const customNotificationSchema = Joi.object({
    phoneNumber: Joi.string().pattern(/^\+254\d{9}$/).required(),
    title: Joi.string().min(1).max(50).required(),
    message: Joi.string().min(1).max(110).required()
});

// Send single SMS
router.post('/send', async (req, res) => {
    try {
        const { error, value } = sendSMSSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }

        const { phoneNumber, message, from } = value;
        const result = await smsService.sendSMS(phoneNumber, message, { from });

        res.json({
            success: true,
            message: 'SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('SMS send error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send SMS',
            error: error.message
        });
    }
});

// Send bulk SMS
router.post('/bulk', async (req, res) => {
    try {
        const { error, value } = bulkSMSSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }

        const { phoneNumbers, message, from } = value;
        const result = await smsService.sendBulkSMS(phoneNumbers, message, { from });

        res.json({
            success: true,
            message: 'Bulk SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Bulk SMS error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send bulk SMS',
            error: error.message
        });
    }
});

// Send custom notification
router.post('/custom-notification', async (req, res) => {
    try {
        const { error, value } = customNotificationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }

        const { phoneNumber, title, message } = value;
        const result = await smsService.sendCustomNotification(phoneNumber, title, message);

        res.json({
            success: true,
            message: 'Custom notification sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Custom notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send custom notification',
            error: error.message
        });
    }
});

// MPesa-specific SMS endpoints
router.post('/payment-initiated', async (req, res) => {
    try {
        const { phoneNumber, amount, reference } = req.body;
        
        if (!phoneNumber || !amount || !reference) {
            return res.status(400).json({
                success: false,
                message: 'phoneNumber, amount, and reference are required'
            });
        }

        const result = await smsService.sendPaymentInitiated(phoneNumber, amount, reference);

        res.json({
            success: true,
            message: 'Payment initiated SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Payment initiated SMS error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send payment initiated SMS',
            error: error.message
        });
    }
});

router.post('/payment-success', async (req, res) => {
    try {
        const { phoneNumber, amount, reference, transactionId } = req.body;
        
        if (!phoneNumber || !amount || !reference || !transactionId) {
            return res.status(400).json({
                success: false,
                message: 'phoneNumber, amount, reference, and transactionId are required'
            });
        }

        const result = await smsService.sendPaymentSuccess(phoneNumber, amount, reference, transactionId);

        res.json({
            success: true,
            message: 'Payment success SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Payment success SMS error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send payment success SMS',
            error: error.message
        });
    }
});

router.post('/payment-failed', async (req, res) => {
    try {
        const { phoneNumber, amount, reference, reason } = req.body;
        
        if (!phoneNumber || !amount || !reference || !reason) {
            return res.status(400).json({
                success: false,
                message: 'phoneNumber, amount, reference, and reason are required'
            });
        }

        const result = await smsService.sendPaymentFailed(phoneNumber, amount, reference, reason);

        res.json({
            success: true,
            message: 'Payment failed SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Payment failed SMS error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send payment failed SMS',
            error: error.message
        });
    }
});

router.post('/stk-push-sent', async (req, res) => {
    try {
        const { phoneNumber, amount } = req.body;
        
        if (!phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'phoneNumber and amount are required'
            });
        }

        const result = await smsService.sendSTKPushSent(phoneNumber, amount);

        res.json({
            success: true,
            message: 'STK push notification SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('STK push SMS error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send STK push notification SMS',
            error: error.message
        });
    }
});

router.post('/welcome', async (req, res) => {
    try {
        const { phoneNumber, customerName } = req.body;
        
        if (!phoneNumber || !customerName) {
            return res.status(400).json({
                success: false,
                message: 'phoneNumber and customerName are required'
            });
        }

        const result = await smsService.sendWelcomeMessage(phoneNumber, customerName);

        res.json({
            success: true,
            message: 'Welcome SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Welcome SMS error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send welcome SMS',
            error: error.message
        });
    }
});

// Check SMS delivery status
router.get('/status/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { provider } = req.query;

        const result = await smsService.checkDeliveryStatus(messageId, provider);

        res.json({
            success: true,
            message: 'SMS status retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('SMS status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check SMS status',
            error: error.message
        });
    }
});

// Get SMS provider status
router.get('/provider-status', async (req, res) => {
    try {
        const status = smsService.getProviderStatus();

        res.json({
            success: true,
            message: 'SMS provider status retrieved successfully',
            data: status
        });
    } catch (error) {
        console.error('Provider status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get provider status',
            error: error.message
        });
    }
});

// Test SMS endpoint
router.post('/test', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'phoneNumber is required'
            });
        }

        const testMessage = 'TiaraConnect SMS test message. If you receive this, SMS integration is working correctly!';
        const result = await smsService.sendSMS(phoneNumber, testMessage);

        res.json({
            success: true,
            message: 'Test SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Test SMS error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test SMS',
            error: error.message
        });
    }
});

module.exports = router; 