const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Set mongoose options to avoid deprecation warnings
    mongoose.set('strictQuery', false);
    
    // Use the MongoDB URI from environment variables, with a fallback to local MongoDB for development
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/wildguard_dev',
      {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      }
    );

    console.log(`MongoDB Connected: ${conn.connection.host}✅`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    
    // Don't exit in case of connection error - allow server to run with connection retry
    console.log('Server started but database connection failed. Some features may not work properly.');
  }
};

module.exports = connectDB;