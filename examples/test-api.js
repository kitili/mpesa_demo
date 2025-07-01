const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/mpesa';
const TEST_PHONE = '254712544598'; // User's phone number
const TEST_AMOUNT = 1; // Small amount for testing

// Helper function to make API calls
async function makeRequest(endpoint, data = null) {
  try {
    const config = {
      method: data ? 'POST' : 'GET',
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    console.log(`\n🔄 Making ${config.method} request to ${endpoint}`);
    console.log('📤 Request data:', data ? JSON.stringify(data, null, 2) : 'N/A');

    const response = await axios(config);
    
    console.log('✅ Response received:');
    console.log('📥 Status:', response.status);
    console.log('📥 Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('📥 Status:', error.response?.status || 'N/A');
    console.log('📥 Error:', error.response?.data || error.message);
    return null;
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  return await makeRequest('/health');
}

async function testSTKPush() {
  console.log('\n💳 Testing STK Push...');
  const data = {
    phoneNumber: TEST_PHONE,
    amount: TEST_AMOUNT,
    accountReference: 'TestPayment',
    transactionDesc: 'Test payment'
  };
  return await makeRequest('/stk-push', data);
}

async function testSTKQuery() {
  console.log('\n🔍 Testing STK Query...');
  const data = {
    checkoutRequestID: 'ws_CO_123456789', // This would be from a real STK Push response
    timestamp: '20231201123456'
  };
  return await makeRequest('/stk-query', data);
}

async function testC2BRegister() {
  console.log('\n📝 Testing C2B URL Registration...');
  const data = {
    confirmationURL: 'https://your-domain.com/api/mpesa/callbacks/c2b',
    validationURL: 'https://your-domain.com/api/mpesa/callbacks/c2b'
  };
  return await makeRequest('/c2b/register', data);
}

async function testC2BSimulate() {
  console.log('\n💰 Testing C2B Simulation...');
  const data = {
    phoneNumber: TEST_PHONE,
    amount: TEST_AMOUNT,
    billReference: 'TESTBILL123'
  };
  return await makeRequest('/c2b/simulate', data);
}

async function testB2C() {
  console.log('\n💸 Testing B2C Payment...');
  const data = {
    phoneNumber: TEST_PHONE,
    amount: TEST_AMOUNT,
    occasion: 'Test payment',
    remarks: 'Testing B2C functionality'
  };
  return await makeRequest('/b2c', data);
}

async function testTransactionStatus() {
  console.log('\n📊 Testing Transaction Status Query...');
  const data = {
    transactionID: 'QK123456789', // This would be from a real transaction
    occasion: 'Test query',
    remarks: 'Testing transaction status'
  };
  return await makeRequest('/transaction-status', data);
}

async function testAccountBalance() {
  console.log('\n💰 Testing Account Balance Query...');
  const data = {
    remarks: 'Test balance check'
  };
  return await makeRequest('/account-balance', data);
}

async function testReverseTransaction() {
  console.log('\n🔄 Testing Transaction Reversal...');
  const data = {
    transactionID: 'QK123456789', // This would be from a real transaction
    amount: TEST_AMOUNT,
    remarks: 'Test reversal',
    occasion: 'Testing reversal'
  };
  return await makeRequest('/reverse', data);
}

// Validation tests
async function testValidationErrors() {
  console.log('\n⚠️ Testing Validation Errors...');
  
  // Test invalid phone number
  console.log('\n📱 Testing invalid phone number...');
  await makeRequest('/stk-push', {
    phoneNumber: 'invalid',
    amount: TEST_AMOUNT
  });
  
  // Test invalid amount
  console.log('\n💵 Testing invalid amount...');
  await makeRequest('/stk-push', {
    phoneNumber: TEST_PHONE,
    amount: -1
  });
  
  // Test missing required fields
  console.log('\n❌ Testing missing required fields...');
  await makeRequest('/stk-push', {
    phoneNumber: TEST_PHONE
  });
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting MPesa API Tests...');
  console.log('📍 Base URL:', BASE_URL);
  console.log('📱 Test Phone:', TEST_PHONE);
  console.log('💵 Test Amount:', TEST_AMOUNT);
  
  const results = {
    healthCheck: await testHealthCheck(),
    stkPush: await testSTKPush(),
    stkQuery: await testSTKQuery(),
    c2bRegister: await testC2BRegister(),
    c2bSimulate: await testC2BSimulate(),
    b2c: await testB2C(),
    transactionStatus: await testTransactionStatus(),
    accountBalance: await testAccountBalance(),
    reverseTransaction: await testReverseTransaction()
  };
  
  // Test validation errors
  await testValidationErrors();
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log('================');
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result && result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  console.log('\n🎉 Tests completed!');
  console.log('\n💡 Note: Some tests may fail if MPesa credentials are not configured.');
  console.log('📖 Check the README.md for setup instructions.');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  makeRequest,
  testHealthCheck,
  testSTKPush,
  testSTKQuery,
  testC2BRegister,
  testC2BSimulate,
  testB2C,
  testTransactionStatus,
  testAccountBalance,
  testReverseTransaction,
  testValidationErrors,
  runTests
}; 