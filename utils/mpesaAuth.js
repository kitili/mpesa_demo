const axios = require('axios');
const config = require('../config/mpesa');

class MpesaAuth {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Generate access token for MPesa API
   * @returns {Promise<string>} Access token
   */
  async generateAccessToken() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
      
      const response = await axios.get(`${config.baseURL}${config.endpoints.auth}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: config.timeout
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        // Set expiry to 1 hour from now (MPesa tokens typically last 1 hour)
        this.tokenExpiry = Date.now() + (60 * 60 * 1000);
        
        console.log('MPesa access token generated successfully');
        return this.accessToken;
      } else {
        throw new Error('Invalid response from MPesa auth endpoint');
      }
    } catch (error) {
      console.error('Error generating MPesa access token:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Get current access token (generate if needed)
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    return await this.generateAccessToken();
  }

  /**
   * Clear stored token (useful for testing or token refresh issues)
   */
  clearToken() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Check if current token is valid
   * @returns {boolean} True if token is valid
   */
  isTokenValid() {
    return this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
  }
}

module.exports = new MpesaAuth(); 