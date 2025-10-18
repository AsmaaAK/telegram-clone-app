#!/usr/bin/env node
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
dotenv.config();

const User = require('../src/models/User');

async function main() {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp';
      await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'whatsapp' });

      const users = [
            { name: 'Alice', username: 'alice', password: 'password123' },
            { name: 'Bob', username: 'bob', password: 'password123' },
      ];

      for (const u of users) {
            const exists = await User.findOne({ username: u.username });
            if (!exists) {
                  await User.create({ name: u.name, username: u.username, passwordHash: await bcrypt.hash(u.password, 10) });
            }
      }

      await mongoose.disconnect();
      // eslint-disable-next-line no-console
      console.log('Seed complete');
}

main().catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      process.exit(1);
});


