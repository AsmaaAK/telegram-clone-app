const mongoose = require('mongoose');

class Database {
  constructor() {
    this.isConnected = false;
    this.connection = null;
  }

  async connect() {
    try {
      // MongoDB connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        family: 4, // Use IPv4, skip trying IPv6
      };

      // Get MongoDB URI from environment or use default
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-clone';

      console.log('🔄 Connecting to MongoDB...');
      
      // Create connection
      this.connection = await mongoose.connect(MONGODB_URI, options);
      
      this.isConnected = true;
      
      console.log('✅ MongoDB Connected Successfully!');
      console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
      console.log(`🎯 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

      // Set up connection event handlers
      this.setupEventHandlers();

      return this.connection;

    } catch (error) {
      console.error('❌ MongoDB Connection Error:', error);
      this.isConnected = false;
      
      // Exit process with failure
      process.exit(1);
    }
  }

  setupEventHandlers() {
    // Connection events
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('reconnectFailed', () => {
      console.error('❌ Mongoose reconnect failed');
      this.isConnected = false;
    });

    // Process events
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGUSR2', this.gracefulShutdown.bind(this)); // For nodemon
  }

  async gracefulShutdown(signal) {
    console.log(`\n${signal} received: Closing MongoDB connection...`);
    
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed gracefully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during MongoDB connection closure:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.connection.close();
        this.isConnected = false;
        console.log('✅ MongoDB connection closed');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  // Check connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.db?.databaseName,
      models: Object.keys(mongoose.connection.models),
    };
  }

  // Get database stats
  async getDatabaseStats() {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      const stats = await mongoose.connection.db.stats();
      return {
        db: stats.db,
        collections: stats.collections,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        fileSize: stats.fileSize,
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }

  // Get collection stats
  async getCollectionStats(collectionName) {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      const stats = await mongoose.connection.db.collection(collectionName).stats();
      return stats;
    } catch (error) {
      console.error(`Error getting stats for collection ${collectionName}:`, error);
      return null;
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'disconnected',
          message: 'Database is not connected'
        };
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        ...this.getConnectionStatus()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database health check failed',
        error: error.message
      };
    }
  }

  // Create indexes for better performance
  async createIndexes() {
    try {
      console.log('🔄 Creating database indexes...');

      // User model indexes
      await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
      await mongoose.connection.db.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });
      await mongoose.connection.db.collection('users').createIndex({ 'settings.theme': 1 });
      await mongoose.connection.db.collection('users').createIndex({ status: 1 });
      await mongoose.connection.db.collection('users').createIndex({ lastSeen: -1 });

      // Conversation model indexes
      await mongoose.connection.db.collection('conversations').createIndex({ participants: 1 });
      await mongoose.connection.db.collection('conversations').createIndex({ type: 1 });
      await mongoose.connection.db.collection('conversations').createIndex({ lastMessageAt: -1 });
      await mongoose.connection.db.collection('conversations').createIndex({ 'unreadCounts': 1 });

      // Message model indexes
      await mongoose.connection.db.collection('messages').createIndex({ conversation: 1, createdAt: -1 });
      await mongoose.connection.db.collection('messages').createIndex({ sender: 1 });
      await mongoose.connection.db.collection('messages').createIndex({ receiver: 1 });
      await mongoose.connection.db.collection('messages').createIndex({ type: 1 });
      await mongoose.connection.db.collection('messages').createIndex({ 'readBy': 1 });

      // Group model indexes
      await mongoose.connection.db.collection('groups').createIndex({ 'members.user': 1 });
      await mongoose.connection.db.collection('groups').createIndex({ owner: 1 });
      await mongoose.connection.db.collection('groups').createIndex({ lastMessageAt: -1 });
      await mongoose.connection.db.collection('groups').createIndex({ name: 'text', description: 'text' });

      console.log('✅ Database indexes created successfully!');
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
    }
  }

  // Drop database (for testing/development)
  async dropDatabase() {
    try {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Cannot drop database in production environment');
      }

      console.log('⚠️ Dropping database...');
      await mongoose.connection.db.dropDatabase();
      console.log('✅ Database dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping database:', error);
      throw error;
    }
  }

  // Get all collections
  async getCollections() {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      return collections.map(collection => collection.name);
    } catch (error) {
      console.error('Error getting collections:', error);
      return [];
    }
  }

  // Backup database (basic implementation)
  async backupDatabase() {
    try {
      console.log('🔄 Creating database backup...');
      
      const collections = await this.getCollections();
      const backup = {};
      
      for (const collectionName of collections) {
        const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();
        backup[collectionName] = documents;
      }
      
      console.log('✅ Database backup created successfully');
      return backup;
    } catch (error) {
      console.error('❌ Error creating database backup:', error);
      throw error;
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;