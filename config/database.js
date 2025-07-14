const mongoose = require('mongoose');

class Database {
  constructor() {
    this.isConnected = false;
    this.connection = null;
  }

  async connect() {
    try {
      if (this.isConnected) {
        console.log('✅ Database already connected');
        return;
      }

      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tiaraconnect';
      
      console.log('🔌 Connecting to MongoDB...');
      
      this.connection = await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0
      });

      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log('✅ Database disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting database:', error.message);
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return this.isConnected;
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Database not connected' };
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();
      
      return { 
        status: 'healthy', 
        message: 'Database connection is healthy',
        collections: Object.keys(mongoose.connection.collections)
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: error.message 
      };
    }
  }
}

module.exports = new Database(); 