const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

(async () => {
  try {
    await connectDB();
    console.log('✅ Connected. Listing indexes for "users" collection...');
    
    const indexes = await mongoose.connection.collection('users').indexes();
    console.log('👉 Current Indexes:');
    console.dir(indexes, { depth: null });
    
    // Attempt to drop if it exists and is bad
    const emailIndex = indexes.find(i => i.key.email === 1);
    if (emailIndex) {
        console.log('⚠️ Found email index:', emailIndex);
        if (!emailIndex.sparse) {
            console.log('❌ Index is NOT sparse. Dropping it now...');
            await mongoose.connection.collection('users').dropIndex(emailIndex.name);
            console.log('✅ Dropped non-sparse email index.');
        } else {
            console.log('✅ Index IS sparse. It should be fine. (Unless multiple nulls existed before sparse was applied?)');
        }
    } else {
        console.log('ℹ️ No email index found.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Script failed:', err);
    process.exit(1);
  }
})();
