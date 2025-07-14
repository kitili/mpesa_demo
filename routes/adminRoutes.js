const express = require('express');
const router = express.Router();
const auth = require('../utils/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { body, validationResult } = require('express-validator');

// Admin middleware - require admin role
const requireAdmin = auth.authorize('admin');

// Get dashboard statistics
router.get('/dashboard', auth.authenticate(), requireAdmin, async (req, res) => {
  try {
    // Get transaction statistics
    const transactionStats = await Transaction.getStats();
    
    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email phoneNumber');

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-password');

    // Calculate revenue
    const revenueStats = await Transaction.aggregate([
      {
        $match: { status: 'SUCCESS' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      success: true,
      data: {
        transactions: transactionStats,
        users: userStats,
        recentTransactions,
        recentUsers,
        revenue: revenueStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all users with pagination
router.get('/users', auth.authenticate(), requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';

    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user by ID
router.get('/users/:id', auth.authenticate(), requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's transactions
    const transactions = await Transaction.find({ phoneNumber: user.phoneNumber })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        user,
        transactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user
router.put('/users/:id', auth.authenticate(), requireAdmin, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phoneNumber').optional().matches(/^(\+254|0)[17]\d{8}$/),
  body('role').optional().isIn(['user', 'merchant', 'admin']),
  body('isActive').optional().isBoolean(),
  body('isVerified').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (user[key] !== undefined) {
        user[key] = req.body[key];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user.getProfile()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete user
router.delete('/users/:id', auth.authenticate(), requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all transactions with pagination
router.get('/transactions', auth.authenticate(), requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || '';
    const type = req.query.type || '';
    const phoneNumber = req.query.phoneNumber || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const query = {};
    
    if (status) query.status = status;
    if (type) query.transactionType = type;
    if (phoneNumber) query.phoneNumber = { $regex: phoneNumber, $options: 'i' };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get transaction by ID
router.get('/transactions/:id', auth.authenticate(), requireAdmin, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Retry failed transaction
router.post('/transactions/:id/retry', auth.authenticate(), requireAdmin, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'FAILED') {
      return res.status(400).json({
        success: false,
        message: 'Only failed transactions can be retried'
      });
    }

    // Reset transaction for retry
    transaction.status = 'PENDING';
    transaction.errorMessage = undefined;
    transaction.retryCount += 1;
    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction queued for retry',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get system statistics
router.get('/stats', auth.authenticate(), requireAdmin, async (req, res) => {
  try {
    const period = req.query.period || '30d'; // 7d, 30d, 90d, 1y
    
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Transaction statistics
    const transactionStats = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            type: '$transactionType'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Daily transaction trends
    const dailyTrends = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // User registration trends
    const userTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        transactionStats,
        dailyTrends,
        userTrends
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Export transactions
router.get('/export/transactions', auth.authenticate(), requireAdmin, async (req, res) => {
  try {
    const { format = 'json', startDate, endDate, status } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'csv') {
      const csv = transactions.map(t => 
        `${t.transactionId},${t.amount},${t.phoneNumber},${t.status},${t.transactionType},${t.createdAt}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      res.send(`Transaction ID,Amount,Phone Number,Status,Type,Created At\n${csv}`);
    } else {
      res.json({
        success: true,
        data: transactions
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 