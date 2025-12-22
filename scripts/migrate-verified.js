require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.DATABASE_FULL_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    const res = await User.updateMany({ verified: { $exists: true } }, [
      { $set: { isVerified: { $ifNull: ['$verified', false] } } },
      { $unset: 'verified' }
    ]);
    console.log('Migration result:', res);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
