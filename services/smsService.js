const twilio = require('twilio');
const AfricasTalking = require('africastalking');

class SMSService {
    constructor() {
        this.twilioClient = null;
        this.africasTalkingClient = null;
        this.provider = process.env.SMS_PROVIDER || 'africastalking'; // 'twilio' or 'africastalking'
        
        this.initializeProviders();
    }

    initializeProviders() {
        // Initialize Twilio
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        }

        // Initialize Africa's Talking
        if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME) {
            this.africasTalkingClient = AfricasTalking({
                apiKey: process.env.AFRICASTALKING_API_KEY,
                username: process.env.AFRICASTALKING_USERNAME
            });
        }
    }

    async sendSMS(to, message, options = {}) {
        try {
            console.log(`📱 Sending SMS to ${to}: ${message.substring(0, 50)}...`);

            if (this.provider === 'twilio' && this.twilioClient) {
                return await this.sendViaTwilio(to, message, options);
            } else if (this.provider === 'africastalking' && this.africasTalkingClient) {
                return await this.sendViaAfricasTalking(to, message, options);
            } else {
                throw new Error('No SMS provider configured');
            }
        } catch (error) {
            console.error('❌ SMS sending failed:', error.message);
            throw error;
        }
    }

    async sendViaTwilio(to, message, options = {}) {
        const from = options.from || process.env.TWILIO_PHONE_NUMBER;
        
        const result = await this.twilioClient.messages.create({
            body: message,
            from: from,
            to: to
        });

        console.log(`✅ Twilio SMS sent successfully. SID: ${result.sid}`);
        return {
            success: true,
            provider: 'twilio',
            messageId: result.sid,
            status: result.status
        };
    }

    async sendViaAfricasTalking(to, message, options = {}) {
        const from = options.from || process.env.AFRICASTALKING_SENDER_ID || 'TiaraConnect';
        
        const result = await this.africasTalkingClient.SMS.send({
            to: to,
            message: message,
            from: from
        });

        console.log(`✅ Africa's Talking SMS sent successfully. MessageId: ${result.SMSMessageData.Recipients[0].messageId}`);
        return {
            success: true,
            provider: 'africastalking',
            messageId: result.SMSMessageData.Recipients[0].messageId,
            status: result.SMSMessageData.Recipients[0].status
        };
    }

    // MPesa-specific SMS templates
    async sendPaymentInitiated(phoneNumber, amount, reference) {
        const message = `TiaraConnect: Payment of KES ${amount} initiated. Reference: ${reference}. You will receive an MPesa prompt shortly.`;
        return await this.sendSMS(phoneNumber, message);
    }

    async sendPaymentSuccess(phoneNumber, amount, reference, transactionId) {
        const message = `TiaraConnect: Payment of KES ${amount} successful! Reference: ${reference}, Transaction ID: ${transactionId}. Thank you for your business.`;
        return await this.sendSMS(phoneNumber, message);
    }

    async sendPaymentFailed(phoneNumber, amount, reference, reason) {
        const message = `TiaraConnect: Payment of KES ${amount} failed. Reference: ${reference}. Reason: ${reason}. Please try again or contact support.`;
        return await this.sendSMS(phoneNumber, message);
    }

    async sendPaymentPending(phoneNumber, amount, reference) {
        const message = `TiaraConnect: Payment of KES ${amount} is being processed. Reference: ${reference}. We'll notify you once completed.`;
        return await this.sendSMS(phoneNumber, message);
    }

    async sendSTKPushSent(phoneNumber, amount) {
        const message = `TiaraConnect: Please check your phone for MPesa prompt to pay KES ${amount}. Enter your PIN to complete payment.`;
        return await this.sendSMS(phoneNumber, message);
    }

    async sendTransactionQuery(phoneNumber, transactionId, status) {
        const message = `TiaraConnect: Transaction ${transactionId} status: ${status}. Contact support if you need assistance.`;
        return await this.sendSMS(phoneNumber, message);
    }

    async sendBalanceUpdate(phoneNumber, balance) {
        const message = `TiaraConnect: Your account balance is KES ${balance}. Thank you for using our services.`;
        return await this.sendSMS(phoneNumber, message);
    }

    async sendReversalNotification(phoneNumber, amount, originalTransactionId, reversalTransactionId) {
        const message = `TiaraConnect: Reversal of KES ${amount} processed. Original TX: ${originalTransactionId}, Reversal TX: ${reversalTransactionId}.`;
        return await this.sendSMS(phoneNumber, message);
    }

    async sendWelcomeMessage(phoneNumber, customerName) {
        const message = `Welcome to TiaraConnect, ${customerName}! Your account has been successfully registered. Enjoy our services.`;
        return await this.sendSMS(phoneNumber, message);
    }

    async sendCustomNotification(phoneNumber, title, message) {
        const fullMessage = `TiaraConnect: ${title}\n\n${message}`;
        return await this.sendSMS(phoneNumber, fullMessage);
    }

    // Bulk SMS functionality
    async sendBulkSMS(phoneNumbers, message, options = {}) {
        const results = [];
        
        for (const phoneNumber of phoneNumbers) {
            try {
                const result = await this.sendSMS(phoneNumber, message, options);
                results.push({ phoneNumber, success: true, result });
            } catch (error) {
                results.push({ phoneNumber, success: false, error: error.message });
            }
        }

        return {
            total: phoneNumbers.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }

    // SMS delivery status check
    async checkDeliveryStatus(messageId, provider = null) {
        const smsProvider = provider || this.provider;

        try {
            if (smsProvider === 'twilio' && this.twilioClient) {
                const message = await this.twilioClient.messages(messageId).fetch();
                return {
                    messageId,
                    status: message.status,
                    provider: 'twilio',
                    sentAt: message.dateCreated,
                    deliveredAt: message.dateSent
                };
            } else if (smsProvider === 'africastalking' && this.africasTalkingClient) {
                // Note: Africa's Talking doesn't provide direct delivery status check via SDK
                // You would need to implement webhook handling for delivery reports
                return {
                    messageId,
                    status: 'unknown',
                    provider: 'africastalking',
                    note: 'Delivery status requires webhook implementation'
                };
            }
        } catch (error) {
            console.error('Error checking SMS delivery status:', error);
            throw error;
        }
    }

    // Get SMS provider status
    getProviderStatus() {
        return {
            provider: this.provider,
            twilio: {
                configured: !!this.twilioClient,
                accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not configured'
            },
            africastalking: {
                configured: !!this.africasTalkingClient,
                username: process.env.AFRICASTALKING_USERNAME ? 'Configured' : 'Not configured'
            }
        };
    }
}

module.exports = new SMSService(); 