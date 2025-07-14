const jwt = require('jsonwebtoken');
const User = require('../models/User');

class Auth {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Middleware to authenticate requests
  authenticate() {
    return async (req, res, next) => {
      try {
        const token = this.extractToken(req);
        
        if (!token) {
          return res.status(401).json({
            success: false,
            message: 'Access token required'
          });
        }

        const decoded = this.verifyToken(token);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        if (!user.isActive) {
          return res.status(401).json({
            success: false,
            message: 'Account is deactivated'
          });
        }

        req.user = user;
        next();
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    };
  }

  // Middleware to authorize roles
  authorize(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      next();
    };
  }

  // Extract token from request
  extractToken(req) {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return req.headers.authorization.substring(7);
    }
    
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }
    
    return null;
  }

  // Login user
  async login(email, password) {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      if (user.isLocked) {
        throw new Error('Account is locked. Please try again later.');
      }

      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        await user.incLoginAttempts();
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = this.generateToken(user);
      
      return {
        user: user.getProfile(),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Register user
  async register(userData) {
    try {
      const { email, phoneNumber } = userData;
      
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { phoneNumber }]
      });

      if (existingUser) {
        throw new Error('User with this email or phone number already exists');
      }

      const user = new User(userData);
      await user.save();

      const token = this.generateToken(user);
      
      return {
        user: user.getProfile(),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Refresh token
  async refreshToken(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const token = this.generateToken(user);
      
      return {
        user: user.getProfile(),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      user.password = newPassword;
      await user.save();

      return { message: 'Password changed successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new Error('User not found');
      }

      await user.generatePasswordResetToken();
      
      // Here you would typically send an email with the reset token
      // For now, we'll just return the token (in production, send via email)
      
      return {
        message: 'Password reset token generated',
        token: user.passwordResetToken // Remove this in production
      };
    } catch (error) {
      throw error;
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new Auth(); 