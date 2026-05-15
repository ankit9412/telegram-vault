const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      // Local dev fallback: persistent in-memory MongoDB
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const path = require('path');
      const fs = require('fs');

      const dataDir = path.join(__dirname, '..', '.mongo-data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

      // Remove stale lock files left by ungraceful shutdowns
      ['mongod.lock', 'WiredTiger.lock'].forEach(lockFile => {
        const lockPath = path.join(dataDir, lockFile);
        if (fs.existsSync(lockPath)) {
          fs.unlinkSync(lockPath);
          console.log(`Removed stale lock file: ${lockFile}`);
        }
      });

      console.log('No MONGODB_URI provided, starting persistent local MongoDB...');
      const mongoServer = await MongoMemoryServer.create({
        instance: { dbPath: dataDir, storageEngine: 'wiredTiger' },
      });
      uri = mongoServer.getUri();
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
