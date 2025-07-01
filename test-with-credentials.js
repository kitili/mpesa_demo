#!/usr/bin/env node

/**
 * Quick Test Script for MPesa Integration
 * Run this after you get your credentials from Safaricom
 * 
 * Usage: node test-with-credentials.js
 */

const axios = require('axios');

// Configuration - Update these with your actual credentials
const TEST_CONFIG = {
  phoneNumber: '254712544598', // Your phone number
  amount: 1, // Test amount (1 KES)
  baseURL: 'http://localhost:3000/api/mpesa'
};

async function testMPesaIntegration() {
  console.log('🚀 Testing MPesa Integration...');
  console.log('📱 Phone Number:', TEST_CONFIG.phoneNumber);
  console.log('💵 Test Amount:', TEST_CONFIG.amount);
  console.log('📍 API Base:', TEST_CONFIG.baseURL);
  console.log('');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${TEST_CONFIG.baseURL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);
    console.log('');

    // Test 2: STK Push
    console.log('2️⃣ Testing STK Push...');
    const stkPushData = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      amount: TEST_CONFIG.amount,
      accountReference: 'TestPayment',
      transactionDesc: 'Test payment from script'
    };

    const stkResponse = await axios.post(`${TEST_CONFIG.baseURL}/stk-push`, stkPushData, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (stkResponse.data.success) {
      console.log('✅ STK Push Successful!');
      console.log('📋 CheckoutRequestID:', stkResponse.data.data.CheckoutRequestID);
      console.log('📋 MerchantRequestID:', stkResponse.data.data.MerchantRequestID);
      console.log('💡 Check your phone for the payment prompt!');
    } else {
      console.log('❌ STK Push Failed:', stkResponse.data.message);
    }
    console.log('');

    // Test 3: C2B Simulation
    console.log('3️⃣ Testing C2B Simulation...');
    const c2bData = {
      phoneNumber: TEST_CONFIG.phoneNumber,
      amount: TEST_CONFIG.amount,
      billReference: 'TESTBILL123'
    };

    const c2bResponse = await axios.post(`${TEST_CONFIG.baseURL}/c2b/simulate`, c2bData, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (c2bResponse.data.success) {
      console.log('✅ C2B Simulation Successful!');
      console.log('📋 Response:', c2bResponse.data.data.ResponseDescription);
    } else {
      console.log('❌ C2B Simulation Failed:', c2bResponse.data.message);
    }
    console.log('');

    // Test 4: Account Balance Query
    console.log('4️⃣ Testing Account Balance Query...');
    const balanceData = {
      remarks: 'Test balance check'
    };

    const balanceResponse = await axios.post(`${TEST_CONFIG.baseURL}/account-balance`, balanceData, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (balanceResponse.data.success) {
      console.log('✅ Account Balance Query Successful!');
      console.log('📋 Response:', balanceResponse.data.data.ResponseDescription);
    } else {
      console.log('❌ Account Balance Query Failed:', balanceResponse.data.message);
    }
    console.log('');

    console.log('🎉 All tests completed!');
    console.log('');
    console.log('📱 Next Steps:');
    console.log('   1. Check your phone for STK Push notification');
    console.log('   2. Enter your M-Pesa PIN to complete the payment');
    console.log('   3. Visit http://localhost:3000/index.html for the demo interface');
    console.log('   4. Check server logs for transaction details');

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    
    if (error.response) {
      console.log('📋 Error details:', error.response.data);
    }
    
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure your .env file has the correct credentials');
    console.log('   2. Ensure the server is running (npm start)');
    console.log('   3. Check that your credentials are approved by Safaricom');
    console.log('   4. Verify you\'re using sandbox credentials for testing');
  }
}

// Run the test
if (require.main === module) {
  testMPesaIntegration();
}

module.exports = { testMPesaIntegration }; 