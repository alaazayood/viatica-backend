const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

(async () => {
  try {
    await connectDB();
    console.log('Dropping index...');
    try {
        await mongoose.connection.collection('users').dropIndex('email_1');
        console.log('✅ Index email_1 dropped successfully!');
    } catch (e) {
        if (e.codeName === 'IndexNotFound') {
            console.log('ℹ️ Index email_1 not found (already dropped?)');
        } else {
            console.log('⚠️ Error dropping index:', e.message);
        }
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Script failed:', err);
    process.exit(1);
  }
})();
