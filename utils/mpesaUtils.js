const crypto = require('crypto');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/mpesa');

/**
 * Generate MPesa API password
 * @param {string} shortcode - Business shortcode
 * @param {string} passkey - MPesa passkey
 * @param {string} timestamp - Timestamp in format YYYYMMDDHHmmss
 * @returns {string} Base64 encoded password
 */
function generatePassword(shortcode, passkey, timestamp) {
  const str = shortcode + passkey + timestamp;
  const buffer = Buffer.from(str, 'utf8');
  return buffer.toString('base64');
}

/**
 * Generate timestamp in MPesa format (YYYYMMDDHHmmss)
 * @returns {string} Formatted timestamp
 */
function generateTimestamp() {
  return moment().format('YYYYMMDDHHmmss');
}

/**
 * Generate unique transaction reference
 * @param {string} prefix - Optional prefix for the reference
 * @returns {string} Unique transaction reference
 */
function generateTransactionReference(prefix = 'TXN') {
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Format phone number to MPesa format (254XXXXXXXXX)
 * @param {string} phoneNumber - Phone number in any format
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('0')) {
    // Convert 07XXXXXXXX to 2547XXXXXXXX
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7')) {
    // Convert 7XXXXXXXX to 2547XXXXXXXX
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('+254')) {
    // Convert +2547XXXXXXXX to 2547XXXXXXXX
    cleaned = cleaned.substring(1);
  }
  
  // Validate the final format
  if (!cleaned.match(/^254[17]\d{8}$/)) {
    throw new Error('Invalid phone number format. Expected format: 07XXXXXXXX or +2547XXXXXXXX');
  }
  
  return cleaned;
}

/**
 * Validate amount (must be positive and not exceed limits)
 * @param {number} amount - Amount to validate
 * @param {number} minAmount - Minimum allowed amount (default: 1)
 * @param {number} maxAmount - Maximum allowed amount (default: 70000)
 * @returns {boolean} True if valid
 */
function validateAmount(amount, minAmount = 1, maxAmount = 70000) {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount < minAmount || numAmount > maxAmount) {
    throw new Error(`Amount must be between ${minAmount} and ${maxAmount}`);
  }
  
  return true;
}

/**
 * Generate security credential for B2C transactions
 * @param {string} initiatorPassword - Initiator password
 * @returns {string} Encrypted security credential
 */
function generateSecurityCredential(initiatorPassword) {
  // This is a simplified version. In production, you should use proper encryption
  // based on your specific requirements and the certificate provided by Safaricom
  const certificate = process.env.MPESA_CERTIFICATE || '';
  
  if (!certificate) {
    console.warn('MPESA_CERTIFICATE not found, using basic encryption');
    return Buffer.from(initiatorPassword).toString('base64');
  }
  
  // In a real implementation, you would use the certificate to encrypt the password
  // This is a placeholder for the actual encryption logic
  return Buffer.from(initiatorPassword).toString('base64');
}

/**
 * Create request headers for MPesa API calls
 * @param {string} accessToken - MPesa access token
 * @returns {Object} Headers object
 */
function createHeaders(accessToken) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  };
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Function result
 */
async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError;
}

/**
 * Log MPesa transaction details
 * @param {string} type - Transaction type (STK_PUSH, C2B, B2C, etc.)
 * @param {Object} requestData - Request data
 * @param {Object} responseData - Response data
 * @param {string} status - Transaction status
 */
function logTransaction(type, requestData, responseData, status = 'PENDING') {
  const logEntry = {
    id: uuidv4(),
    type,
    timestamp: new Date().toISOString(),
    status,
    request: requestData,
    response: responseData
  };
  
  console.log(`MPesa Transaction Log [${type}]:`, JSON.stringify(logEntry, null, 2));
  
  // In a real application, you would save this to a database
  return logEntry;
}

module.exports = {
  generatePassword,
  generateTimestamp,
  generateTransactionReference,
  formatPhoneNumber,
  validateAmount,
  generateSecurityCredential,
  createHeaders,
  retryWithBackoff,
  logTransaction
}; 