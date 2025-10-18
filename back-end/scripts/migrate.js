#!/usr/bin/env node
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp';
      await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'whatsapp' });
      // Place migration steps here
      // Example: ensure indexes
      try {
            await Promise.all(Object.values(mongoose.connection.models).map((m) => m.ensureIndexes?.()))
      } catch { }
      await mongoose.disconnect();
      // eslint-disable-next-line no-console
      console.log('Migration complete');
}

main().catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      process.exit(1);
});


