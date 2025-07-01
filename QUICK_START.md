# 🚀 MPesa Integration - Quick Start Guide

## What You Get

A complete Node.js/Express MPesa integration with:

- ✅ **STK Push** - Mobile payments with PIN prompt
- ✅ **C2B** - Customer to Business payments
- ✅ **B2C** - Business to Customer payments
- ✅ **Transaction Queries** - Check payment status
- ✅ **Account Balance** - Check business balance
- ✅ **Transaction Reversals** - Reverse failed transactions
- ✅ **Beautiful Demo Interface** - Test all endpoints visually
- ✅ **Comprehensive API** - RESTful endpoints with validation
- ✅ **Production Ready** - Security, logging, error handling

## 🏃‍♂️ Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp env.example .env
```

Edit `.env` with your MPesa credentials:
```env
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_PASSKEY=your_passkey_here
MPESA_SHORTCODE=your_shortcode_here
MPESA_INITIATOR_NAME=your_initiator_name
MPESA_SECURITY_CREDENTIAL=your_security_credential
MPESA_ENVIRONMENT=sandbox
```

### 3. Start the Server
```bash
npm start
```

### 4. Test the Integration
- **API Documentation**: http://localhost:3000/
- **Demo Interface**: http://localhost:3000/index.html
- **Health Check**: http://localhost:3000/health

## 📱 Test with Demo Interface

1. Open http://localhost:3000/index.html
2. Use the tabbed interface to test different endpoints
3. Try STK Push, C2B, B2C, and queries
4. See real-time responses and error handling

## 🔧 API Endpoints

### STK Push (Mobile Payment)
```bash
curl -X POST http://localhost:3000/api/mpesa/stk-push \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254708374149",
    "amount": 1,
    "accountReference": "TestPayment",
    "transactionDesc": "Test payment"
  }'
```

### C2B Simulation
```bash
curl -X POST http://localhost:3000/api/mpesa/c2b/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254708374149",
    "amount": 1,
    "billReference": "TESTBILL123"
  }'
```

### B2C Payment
```bash
curl -X POST http://localhost:3000/api/mpesa/b2c \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254708374149",
    "amount": 1,
    "occasion": "Test payment",
    "remarks": "Testing B2C"
  }'
```

## 🧪 Testing

### Sandbox Testing
- Use sandbox credentials from Safaricom
- Test phone: `254708374149`
- Small amounts: 1-10 KES
- Environment: `sandbox`

### Production Testing
- Use production credentials
- Real phone numbers
- Start with small amounts
- Environment: `production`

## 📁 Project Structure

```
mpesa-integration/
├── config/
│   └── mpesa.js          # MPesa configuration
├── utils/
│   ├── mpesaAuth.js      # Authentication utilities
│   └── mpesaUtils.js     # Helper functions
├── services/
│   └── mpesaService.js   # Core MPesa service
├── routes/
│   └── mpesaRoutes.js    # API routes
├── public/
│   └── index.html        # Demo interface
├── examples/
│   └── test-api.js       # Test script
├── server.js             # Main server
├── package.json          # Dependencies
├── README.md             # Full documentation
└── QUICK_START.md        # This file
```

## 🔑 Required MPesa Credentials

Get these from Safaricom Developer Portal:

1. **Consumer Key** - API access key
2. **Consumer Secret** - API secret
3. **Passkey** - STK Push encryption key
4. **Shortcode** - Business shortcode
5. **Initiator Name** - B2C initiator
6. **Security Credential** - Encrypted password

## 🚨 Important Notes

- **Environment**: Start with `sandbox` for testing
- **Phone Numbers**: Use format `254712345678`
- **Amounts**: 1-70,000 KES, whole numbers only
- **Callbacks**: Update URLs in `config/mpesa.js`
- **Security**: Never commit `.env` files

## 🆘 Troubleshooting

### Common Issues

1. **"Credentials not configured"**
   - Check your `.env` file
   - Ensure all required fields are set

2. **"Invalid phone number"**
   - Use format: `254712345678`
   - No spaces or special characters

3. **"Amount validation failed"**
   - Amount must be 1-70,000
   - Use whole numbers only

4. **"Authentication failed"**
   - Check consumer key/secret
   - Verify environment (sandbox/production)

### Debug Mode
```bash
NODE_ENV=development npm start
```

## 📞 Support

- **Documentation**: README.md
- **API Reference**: http://localhost:3000/
- **Demo**: http://localhost:3000/index.html
- **Tests**: `node examples/test-api.js`

## 🎯 Next Steps

1. **Configure Production**: Update environment variables
2. **Customize Callbacks**: Update callback URLs
3. **Add Database**: Store transaction logs
4. **Deploy**: Use PM2, Docker, or cloud platform
5. **Monitor**: Add logging and monitoring

---

**Happy Coding! 🚀**

Your MPesa integration is ready to use. Check the full README.md for detailed documentation and advanced features. 