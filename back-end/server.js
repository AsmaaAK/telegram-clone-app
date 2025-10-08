require('dotenv').config();
const app = require('./src/app');
const database = require('./config/database');
const { seedAll } = require('./utils/seedData');

const PORT = process.env.PORT || 4000;

// Start the server
const startServer = async () => {
  try {
    console.log('🚀 Starting Telegram Clone Server...\n');

    // Connect to database
    await database.connect();

    // Create indexes for better performance
    await database.createIndexes();

    // Seed database with sample data (only in development)
    if (process.env.NODE_ENV === 'development' && process.env.SEED_DB === 'true') {
      console.log('🌱 Seeding database with sample data...');
      await seedAll();
    }

    // Start the server
    const server = app.listen(PORT, () => {
      console.log('\n✨ ========================================');
      console.log('✅ Telegram Clone Server Started Successfully!');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log('🔗 WebSocket: ws://localhost:4000');
      console.log('✨ ========================================\n');

      // Display database connection info
      const dbStatus = database.getConnectionStatus();
      console.log('📊 Database Connection Info:');
      console.log(`   Host: ${dbStatus.host}:${dbStatus.port}`);
      console.log(`   Database: ${dbStatus.database}`);
      console.log(`   Status: ${dbStatus.isConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`   Models: ${dbStatus.models.length} models loaded\n`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received: Starting graceful shutdown...`);
      
      try {
        // Stop accepting new connections
        server.close(async () => {
          console.log('✅ HTTP server closed');
          
          // Close database connection
          await database.disconnect();
          console.log('✅ Database connection closed');
          
          console.log('👋 Graceful shutdown completed');
          process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
          console.error('❌ Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 10000);

      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Listen for termination signals
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
startServer();