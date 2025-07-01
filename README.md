# MPesa Integration API

A complete Node.js/Express integration for Safaricom MPesa API with support for STK Push, C2B, B2C, transaction queries, and more.

## Features

- ✅ **STK Push (Lipa na M-Pesa Online)** - Initiate mobile payments
- ✅ **C2B (Customer to Business)** - Receive payments from customers
- ✅ **B2C (Business to Customer)** - Send money to customers
- ✅ **Transaction Status Queries** - Check payment status
- ✅ **Account Balance Queries** - Check business account balance
- ✅ **Transaction Reversals** - Reverse failed transactions
- ✅ **Callback Handling** - Process MPesa responses
- ✅ **Input Validation** - Comprehensive request validation
- ✅ **Error Handling** - Robust error management
- ✅ **Rate Limiting** - API rate limiting for security
- ✅ **Logging** - Detailed transaction logging
- ✅ **Retry Logic** - Automatic retry with exponential backoff

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MPesa API credentials from Safaricom
- Valid business shortcode and passkey

## Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd mpesa-integration
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your MPesa credentials:
   ```env
   # MPesa Configuration
   MPESA_CONSUMER_KEY=your_consumer_key_here
   MPESA_CONSUMER_SECRET=your_consumer_secret_here
   MPESA_PASSKEY=your_passkey_here
   MPESA_SHORTCODE=your_shortcode_here
   MPESA_INITIATOR_NAME=your_initiator_name
   MPESA_SECURITY_CREDENTIAL=your_security_credential
   
   # Environment (sandbox or production)
   MPESA_ENVIRONMENT=sandbox
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Base URL
```
http://localhost:3000/api/mpesa
```

### 1. STK Push (Lipa na M-Pesa Online)

**Endpoint:** `POST /stk-push`

**Description:** Initiate a payment request that prompts the customer to enter their M-Pesa PIN.

**Request Body:**
```json
{
  "phoneNumber": "254712345678",
  "amount": 100,
  "accountReference": "Payment123",
  "transactionDesc": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "CheckoutRequestID": "ws_CO_123456789",
    "MerchantRequestID": "12345-12345-12345",
    "ResponseCode": "0",
    "ResponseDescription": "Success. Request accepted for processing",
    "CustomerMessage": "Success. Request accepted for processing"
  },
  "transactionRef": "STK20231201123456ABC123",
  "message": "STK Push initiated successfully"
}
```

### 2. Query STK Push Status

**Endpoint:** `POST /stk-query`

**Description:** Check the status of an STK Push request.

**Request Body:**
```json
{
  "checkoutRequestID": "ws_CO_123456789",
  "timestamp": "20231201123456"
}
```

### 3. C2B URL Registration

**Endpoint:** `POST /c2b/register`

**Description:** Register callback URLs for C2B payments.

**Request Body:**
```json
{
  "confirmationURL": "https://your-domain.com/api/mpesa/callbacks/c2b",
  "validationURL": "https://your-domain.com/api/mpesa/callbacks/c2b"
}
```

### 4. C2B Payment Simulation

**Endpoint:** `POST /c2b/simulate`

**Description:** Simulate a C2B payment (for testing).

**Request Body:**
```json
{
  "phoneNumber": "254712345678",
  "amount": 100,
  "billReference": "BILL123"
}
```

### 5. B2C Payment

**Endpoint:** `POST /b2c`

**Description:** Send money from business to customer.

**Request Body:**
```json
{
  "phoneNumber": "254712345678",
  "amount": 100,
  "occasion": "Salary payment",
  "remarks": "Monthly salary"
}
```

### 6. Transaction Status Query

**Endpoint:** `POST /transaction-status`

**Description:** Check the status of a transaction.

**Request Body:**
```json
{
  "transactionID": "QK123456789",
  "occasion": "Status check",
  "remarks": "Checking payment status"
}
```

### 7. Account Balance Query

**Endpoint:** `POST /account-balance`

**Description:** Check business account balance.

**Request Body:**
```json
{
  "remarks": "Balance check"
}
```

### 8. Transaction Reversal

**Endpoint:** `POST /reverse`

**Description:** Reverse a transaction.

**Request Body:**
```json
{
  "transactionID": "QK123456789",
  "amount": 100,
  "remarks": "Transaction reversal",
  "occasion": "Reversal"
}
```

### 9. Callback Endpoints

#### STK Push Callback
**Endpoint:** `POST /callbacks/stk`

**Description:** Receives STK Push completion notifications.

#### C2B Callback
**Endpoint:** `POST /callbacks/c2b`

**Description:** Receives C2B payment notifications.

#### B2C Callback
**Endpoint:** `POST /callbacks/b2c`

**Description:** Receives B2C payment result notifications.

### 10. Health Check

**Endpoint:** `GET /health`

**Description:** Check API health status.

## Usage Examples

### Using cURL

#### STK Push
```bash
curl -X POST http://localhost:3000/api/mpesa/stk-push \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254712345678",
    "amount": 100,
    "accountReference": "Payment123",
    "transactionDesc": "Payment for services"
  }'
```

#### B2C Payment
```bash
curl -X POST http://localhost:3000/api/mpesa/b2c \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254712345678",
    "amount": 100,
    "occasion": "Salary payment",
    "remarks": "Monthly salary"
  }'
```

### Using JavaScript/Fetch

```javascript
// STK Push
const stkPushResponse = await fetch('http://localhost:3000/api/mpesa/stk-push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber: '254712345678',
    amount: 100,
    accountReference: 'Payment123',
    transactionDesc: 'Payment for services'
  })
});

const stkPushResult = await stkPushResponse.json();
console.log(stkPushResult);
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MPESA_CONSUMER_KEY` | MPesa API consumer key | Yes | - |
| `MPESA_CONSUMER_SECRET` | MPesa API consumer secret | Yes | - |
| `MPESA_PASSKEY` | MPesa passkey | Yes | - |
| `MPESA_SHORTCODE` | Business shortcode | Yes | - |
| `MPESA_INITIATOR_NAME` | Initiator name for B2C | Yes | - |
| `MPESA_SECURITY_CREDENTIAL` | Security credential | Yes | - |
| `MPESA_ENVIRONMENT` | Environment (sandbox/production) | No | sandbox |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Node environment | No | development |

### Callback URLs

Update the callback URLs in `config/mpesa.js` to match your domain:

```javascript
callbacks: {
  c2b: 'https://your-domain.com/api/mpesa/c2b-callback',
  b2c: 'https://your-domain.com/api/mpesa/b2c-callback',
  stkPush: 'https://your-domain.com/api/mpesa/stk-callback'
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly message"
}
```

Common error codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication issues)
- `500` - Internal Server Error

## Testing

### Sandbox Testing

1. Use sandbox credentials from Safaricom
2. Test with sandbox phone numbers (e.g., 254708374149)
3. Use small amounts for testing

### Production Testing

1. Ensure all credentials are production-ready
2. Test with real phone numbers
3. Start with small amounts
4. Monitor logs for any issues

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Rate Limiting**: API is rate-limited to prevent abuse
3. **Input Validation**: All inputs are validated before processing
4. **HTTPS**: Use HTTPS in production
5. **CORS**: Configure CORS properly for your domain
6. **Logging**: Sensitive data is not logged

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check your consumer key and secret
   - Ensure credentials are correct for the environment

2. **Invalid Phone Number**
   - Use format: 254712345678 (no spaces or special characters)
   - Ensure the number is registered for M-Pesa

3. **Amount Validation**
   - Amount must be between 1 and 70,000
   - Use whole numbers (no decimals)

4. **Callback Issues**
   - Ensure callback URLs are publicly accessible
   - Check that URLs are HTTPS in production

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review MPesa API documentation
3. Contact Safaricom support for API issues

## Changelog

### v1.0.0
- Initial release
- Complete MPesa API integration
- STK Push, C2B, B2C support
- Transaction queries and reversals
- Comprehensive error handling and validation # mpesa_demo
