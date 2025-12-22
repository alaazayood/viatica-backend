const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.DATABASE_FULL_URL;
  if (!uri) {
    console.error('❌ DATABASE_FULL_URL is not set in environment variables.');
    process.exit(1);
  }
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
