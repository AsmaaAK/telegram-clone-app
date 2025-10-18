const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
console.log('[DEBUG] Loaded Mongo URI:', process.env.MONGO_URI || process.env.MONGODB_URI);

const app = require('./app');
const { setupSocket } = require('./socket');

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI ;

async function start() {
      try {
            await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB});
            // eslint-disable-next-line no-console
            console.log('[DB] Connected', mongoose.connection.name);
      } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[DB] Connection error', e.message);
            process.exit(1);
      }

      const server = http.createServer(app);
      const io = new Server(server, {
            cors: {
                  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
                  credentials: true,
            },
            transports: ['websocket', 'polling'],
      });

      setupSocket(io);
      app.set('io', io);

      server.listen(PORT, () => {
            // eslint-disable-next-line no-console
            console.log(`Server listening on http://localhost:${PORT}`);
      });
}

start().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to start server', err);
      process.exit(1);
});


