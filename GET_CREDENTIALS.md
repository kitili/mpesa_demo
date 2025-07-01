# 🔑 How to Get Your MPesa Credentials - Step by Step

## 📱 **For: Mourine Kitili (0712544598)**

### **Step 1: Register with Safaricom Developer Portal**

1. **Visit:** https://developer.safaricom.co.ke/
2. **Click:** "Register" or "Sign Up"
3. **Fill in your details:**
   - **Name:** Mourine Kitili
   - **Email:** [your email address]
   - **Phone:** 0712544598
   - **Password:** [create a strong password]

### **Step 2: Apply for Sandbox Access**

1. **After registration, look for:**
   - "Sandbox Environment"
   - "Test Credentials"
   - "Developer Access"

2. **Request sandbox access** (this is free and doesn't require business verification)

3. **Wait for approval** (usually takes 1-2 business days)

### **Step 3: Get Your Credentials**

Once approved, you'll receive:

```
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_PASSKEY=your_passkey_here
MPESA_SHORTCODE=your_shortcode_here
MPESA_INITIATOR_NAME=your_initiator_name
MPESA_SECURITY_CREDENTIAL=your_security_credential
```

### **Step 4: Update Your .env File**

1. **Open your .env file:**
   ```bash
   nano .env
   ```

2. **Replace the placeholder values with your actual credentials**

3. **Save the file**

### **Step 5: Test Your Integration**

```bash
# Restart your server
npm start

# Test with your phone number
curl -X POST http://localhost:3000/api/mpesa/stk-push \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254712544598",
    "amount": 1,
    "accountReference": "TestPayment",
    "transactionDesc": "Test payment"
  }'
```

## 🆘 **Need Help?**

### **If Registration Takes Too Long:**
- Contact Safaricom Developer Support
- Email: developer@safaricom.co.ke
- Phone: +254 711 000 000

### **If You Get Stuck:**
- Check the official documentation: https://developer.safaricom.co.ke/docs
- Look for "Getting Started" guides
- Join Safaricom Developer Community

## 🎯 **What You'll Be Able to Do After Getting Credentials:**

✅ **STK Push** - Send payment requests to your phone (254712544598)  
✅ **C2B Simulation** - Test customer payments  
✅ **B2C Payments** - Send money from business to customers  
✅ **Transaction Queries** - Check payment status  
✅ **Account Balance** - Check business account balance  

## 📞 **Quick Reference**

- **Your Phone:** 0712544598 (formatted as 254712544598)
- **Test Amount:** 1 KES (minimum for testing)
- **Environment:** Sandbox (for testing)
- **Server:** Running on http://localhost:3000

---

**Good luck! Your MPesa integration is ready - you just need the credentials! 🚀** 