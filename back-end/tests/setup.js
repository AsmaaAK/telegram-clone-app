const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongod;

beforeAll(async () => {
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      process.env.JWT_SECRET = 'test_secret';
      await mongoose.connect(uri, { dbName: 'testdb' });
});

afterAll(async () => {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      if (mongod) await mongod.stop();
});

afterEach(async () => {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
            await collection.deleteMany({});
      }
});


