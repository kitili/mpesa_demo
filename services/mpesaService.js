const axios = require('axios');
const config = require('../config/mpesa');
const mpesaAuth = require('../utils/mpesaAuth');
const smsService = require('./smsService');
const {
  generatePassword,
  generateTimestamp,
  generateTransactionReference,
  formatPhoneNumber,
  validateAmount,
  generateSecurityCredential,
  createHeaders,
  retryWithBackoff,
  logTransaction
} = require('../utils/mpesaUtils');

class MpesaService {
  /**
   * Initiate STK Push (Lipa na M-Pesa Online)
   * @param {Object} params - STK Push parameters
   * @param {string} params.phoneNumber - Customer phone number
   * @param {number} params.amount - Amount to charge
   * @param {string} params.accountReference - Account reference
   * @param {string} params.transactionDesc - Transaction description
   * @returns {Promise<Object>} STK Push response
   */
  async initiateSTKPush({ phoneNumber, amount, accountReference, transactionDesc }) {
    try {
      // Validate inputs
      validateAmount(amount);
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Generate required parameters
      const timestamp = generateTimestamp();
      const password = generatePassword(config.shortcode, config.passkey, timestamp);
      const transactionRef = generateTransactionReference('STK');
      
      const requestData = {
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: config.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: config.callbacks.stkPush,
        AccountReference: accountReference || 'Payment',
        TransactionDesc: transactionDesc || 'Payment'
      };
      
      const accessToken = await mpesaAuth.getAccessToken();
      const headers = createHeaders(accessToken);
      
      const response = await retryWithBackoff(async () => {
        return await axios.post(
          `${config.baseURL}${config.endpoints.stkPush}`,
          requestData,
          { headers, timeout: config.timeout }
        );
      });
      
      // Log the transaction
      logTransaction('STK_PUSH', requestData, response.data, 'INITIATED');
      
      // Send SMS notifications
      try {
        // Send payment initiated SMS
        await smsService.sendPaymentInitiated(formattedPhone, amount, transactionRef);
        
        // Send STK push notification
        await smsService.sendSTKPushSent(formattedPhone, amount);
        
        console.log('📱 SMS notifications sent successfully for STK Push');
      } catch (smsError) {
        console.warn('⚠️ SMS notification failed:', smsError.message);
        // Don't fail the main request if SMS fails
      }
      
      return {
        success: true,
        data: response.data,
        transactionRef,
        message: 'STK Push initiated successfully'
      };
      
    } catch (error) {
      console.error('STK Push error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to initiate STK Push'
      };
    }
  }

  /**
   * Query STK Push status
   * @param {Object} params - Query parameters
   * @param {string} params.checkoutRequestID - Checkout request ID from STK Push
   * @param {string} params.timestamp - Timestamp
   * @returns {Promise<Object>} Query response
   */
  async querySTKPush({ checkoutRequestID, timestamp }) {
    try {
      const requestData = {
        BusinessShortCode: config.shortcode,
        CheckoutRequestID: checkoutRequestID,
        Password: generatePassword(config.shortcode, config.passkey, timestamp),
        Timestamp: timestamp
      };
      
      const accessToken = await mpesaAuth.getAccessToken();
      const headers = createHeaders(accessToken);
      
      const response = await retryWithBackoff(async () => {
        return await axios.post(
          `${config.baseURL}${config.endpoints.stkPushQuery}`,
          requestData,
          { headers, timeout: config.timeout }
        );
      });
      
      logTransaction('STK_QUERY', requestData, response.data, 'QUERIED');
      
      return {
        success: true,
        data: response.data,
        message: 'STK Push query completed'
      };
      
    } catch (error) {
      console.error('STK Query error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to query STK Push status'
      };
    }
  }

  /**
   * Register C2B URLs
   * @param {Object} params - Registration parameters
   * @param {string} params.confirmationURL - Confirmation callback URL
   * @param {string} params.validationURL - Validation callback URL
   * @returns {Promise<Object>} Registration response
   */
  async registerC2BURLs({ confirmationURL, validationURL }) {
    try {
      const requestData = {
        ShortCode: config.shortcode,
        ResponseType: 'Completed',
        ConfirmationURL: confirmationURL,
        ValidationURL: validationURL
      };
      
      const accessToken = await mpesaAuth.getAccessToken();
      const headers = createHeaders(accessToken);
      
      const response = await retryWithBackoff(async () => {
        return await axios.post(
          `${config.baseURL}${config.endpoints.c2bRegister}`,
          requestData,
          { headers, timeout: config.timeout }
        );
      });
      
      logTransaction('C2B_REGISTER', requestData, response.data, 'REGISTERED');
      
      return {
        success: true,
        data: response.data,
        message: 'C2B URLs registered successfully'
      };
      
    } catch (error) {
      console.error('C2B Registration error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to register C2B URLs'
      };
    }
  }

  /**
   * Simulate C2B payment (for testing)
   * @param {Object} params - Simulation parameters
   * @param {string} params.phoneNumber - Customer phone number
   * @param {number} params.amount - Amount
   * @param {string} params.billReference - Bill reference
   * @returns {Promise<Object>} Simulation response
   */
  async simulateC2B({ phoneNumber, amount, billReference }) {
    try {
      validateAmount(amount);
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const requestData = {
        ShortCode: config.shortcode,
        CommandID: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        Msisdn: formattedPhone,
        BillReferenceNumber: billReference || generateTransactionReference('C2B')
      };
      
      const accessToken = await mpesaAuth.getAccessToken();
      const headers = createHeaders(accessToken);
      
      const response = await retryWithBackoff(async () => {
        return await axios.post(
          `${config.baseURL}${config.endpoints.c2bSimulate}`,
          requestData,
          { headers, timeout: config.timeout }
        );
      });
      
      logTransaction('C2B_SIMULATE', requestData, response.data, 'SIMULATED');
      
      return {
        success: true,
        data: response.data,
        message: 'C2B payment simulated successfully'
      };
      
    } catch (error) {
      console.error('C2B Simulation error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to simulate C2B payment'
      };
    }
  }

  /**
   * Initiate B2C payment (Business to Customer)
   * @param {Object} params - B2C parameters
   * @param {string} params.phoneNumber - Customer phone number
   * @param {number} params.amount - Amount to send
   * @param {string} params.occasion - Occasion/reason
   * @param {string} params.remarks - Remarks
   * @returns {Promise<Object>} B2C response
   */
  async initiateB2C({ phoneNumber, amount, occasion, remarks }) {
    try {
      validateAmount(amount);
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const requestData = {
        InitiatorName: config.initiatorName,
        SecurityCredential: generateSecurityCredential(config.securityCredential),
        CommandID: 'BusinessPayment',
        Amount: Math.round(amount),
        PartyA: config.shortcode,
        PartyB: formattedPhone,
        Remarks: remarks || 'B2C Payment',
        QueueTimeOutURL: config.callbacks.b2c,
        ResultURL: config.callbacks.b2c,
        Occasion: occasion || 'Payment'
      };
      
      const accessToken = await mpesaAuth.getAccessToken();
      const headers = createHeaders(accessToken);
      
      const response = await retryWithBackoff(async () => {
        return await axios.post(
          `${config.baseURL}${config.endpoints.b2c}`,
          requestData,
          { headers, timeout: config.timeout }
        );
      });
      
      logTransaction('B2C', requestData, response.data, 'INITIATED');
      
      return {
        success: true,
        data: response.data,
        message: 'B2C payment initiated successfully'
      };
      
    } catch (error) {
      console.error('B2C error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to initiate B2C payment'
      };
    }
  }

  /**
   * Query transaction status
   * @param {Object} params - Query parameters
   * @param {string} params.transactionID - Transaction ID
   * @param {string} params.occasion - Occasion
   * @param {string} params.remarks - Remarks
   * @returns {Promise<Object>} Query response
   */
  async queryTransactionStatus({ transactionID, occasion, remarks }) {
    try {
      const requestData = {
        Initiator: config.initiatorName,
        SecurityCredential: generateSecurityCredential(config.securityCredential),
        CommandID: 'TransactionStatusQuery',
        TransactionID: transactionID,
        PartyA: config.shortcode,
        IdentifierType: '4',
        ResultURL: config.callbacks.b2c,
        QueueTimeOutURL: config.callbacks.b2c,
        Remarks: remarks || 'Transaction Status Query',
        Occasion: occasion || 'Query'
      };
      
      const accessToken = await mpesaAuth.getAccessToken();
      const headers = createHeaders(accessToken);
      
      const response = await retryWithBackoff(async () => {
        return await axios.post(
          `${config.baseURL}${config.endpoints.transactionStatus}`,
          requestData,
          { headers, timeout: config.timeout }
        );
      });
      
      logTransaction('TRANSACTION_STATUS', requestData, response.data, 'QUERIED');
      
      return {
        success: true,
        data: response.data,
        message: 'Transaction status queried successfully'
      };
      
    } catch (error) {
      console.error('Transaction Status Query error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to query transaction status'
      };
    }
  }

  /**
   * Query account balance
   * @param {Object} params - Query parameters
   * @param {string} params.remarks - Remarks
   * @returns {Promise<Object>} Query response
   */
  async queryAccountBalance({ remarks }) {
    try {
      const requestData = {
        Initiator: config.initiatorName,
        SecurityCredential: generateSecurityCredential(config.securityCredential),
        CommandID: 'AccountBalance',
        PartyA: config.shortcode,
        IdentifierType: '4',
        ResultURL: config.callbacks.b2c,
        QueueTimeOutURL: config.callbacks.b2c,
        Remarks: remarks || 'Account Balance Query'
      };
      
      const accessToken = await mpesaAuth.getAccessToken();
      const headers = createHeaders(accessToken);
      
      const response = await retryWithBackoff(async () => {
        return await axios.post(
          `${config.baseURL}${config.endpoints.accountBalance}`,
          requestData,
          { headers, timeout: config.timeout }
        );
      });
      
      logTransaction('ACCOUNT_BALANCE', requestData, response.data, 'QUERIED');
      
      return {
        success: true,
        data: response.data,
        message: 'Account balance queried successfully'
      };
      
    } catch (error) {
      console.error('Account Balance Query error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to query account balance'
      };
    }
  }

  /**
   * Reverse transaction
   * @param {Object} params - Reversal parameters
   * @param {string} params.transactionID - Transaction ID to reverse
   * @param {number} params.amount - Amount to reverse
   * @param {string} params.remarks - Remarks
   * @param {string} params.occasion - Occasion
   * @returns {Promise<Object>} Reversal response
   */
  async reverseTransaction({ transactionID, amount, remarks, occasion }) {
    try {
      validateAmount(amount);
      
      const requestData = {
        Initiator: config.initiatorName,
        SecurityCredential: generateSecurityCredential(config.securityCredential),
        CommandID: 'TransactionReversal',
        TransactionID: transactionID,
        Amount: Math.round(amount),
        ReceiverParty: config.shortcode,
        RecieverIdentifierType: '4',
        ResultURL: config.callbacks.b2c,
        QueueTimeOutURL: config.callbacks.b2c,
        Remarks: remarks || 'Transaction Reversal',
        Occasion: occasion || 'Reversal'
      };
      
      const accessToken = await mpesaAuth.getAccessToken();
      const headers = createHeaders(accessToken);
      
      const response = await retryWithBackoff(async () => {
        return await axios.post(
          `${config.baseURL}${config.endpoints.reversal}`,
          requestData,
          { headers, timeout: config.timeout }
        );
      });
      
      logTransaction('REVERSAL', requestData, response.data, 'INITIATED');
      
      return {
        success: true,
        data: response.data,
        message: 'Transaction reversal initiated successfully'
      };
      
    } catch (error) {
      console.error('Transaction Reversal error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to reverse transaction'
      };
    }
  }
}

module.exports = new MpesaService(); 