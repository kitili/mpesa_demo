const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction identification
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  checkoutRequestId: {
    type: String,
    index: true
  },
  merchantRequestId: {
    type: String
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'KES'
  },
  phoneNumber: {
    type: String,
    required: true
  },
  accountReference: {
    type: String,
    default: 'Payment'
  },
  transactionDesc: {
    type: String,
    default: 'Payment'
  },
  
  // Status and type
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT'],
    default: 'PENDING'
  },
  transactionType: {
    type: String,
    enum: ['STK_PUSH', 'C2B', 'B2C', 'REVERSAL', 'BALANCE_QUERY'],
    required: true
  },
  
  // MPesa response data
  mpesaResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  resultCode: {
    type: String
  },
  resultDesc: {
    type: String
  },
  
  // Business details
  businessShortCode: {
    type: String,
    required: true
  },
  partyA: {
    type: String
  },
  partyB: {
    type: String
  },
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // SMS notifications
  smsSent: {
    type: Boolean,
    default: false
  },
  smsSentAt: {
    type: Date
  },
  
  // Error handling
  errorMessage: {
    type: String
  },
  retryCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ phoneNumber: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ transactionType: 1, createdAt: -1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `KES ${this.amount.toLocaleString()}`;
});

// Virtual for transaction age
transactionSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to mark as successful
transactionSchema.methods.markSuccess = function(mpesaResponse) {
  this.status = 'SUCCESS';
  this.mpesaResponse = mpesaResponse;
  this.completedAt = new Date();
  this.resultCode = mpesaResponse?.ResultCode;
  this.resultDesc = mpesaResponse?.ResultDesc;
  return this.save();
};

// Method to mark as failed
transactionSchema.methods.markFailed = function(errorMessage) {
  this.status = 'FAILED';
  this.errorMessage = errorMessage;
  this.completedAt = new Date();
  return this.save();
};

// Static method to get transaction statistics
transactionSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const totalStats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
  
  return {
    byStatus: stats,
    totals: totalStats[0] || { totalTransactions: 0, totalAmount: 0, avgAmount: 0 }
  };
};

module.exports = mongoose.model('Transaction', transactionSchema); 