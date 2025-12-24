const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); // Import bcrypt directly to manually hash password if needed

// Load env vars
dotenv.config({ path: './.env' }); // Assuming we run from backend root

// Define minimal User Schema inline to avoid module issues
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: { type: String, select: false },
  role: { type: String, enum: ['admin', 'pharmacist', 'warehouse', 'driver'], default: 'pharmacist' },
  phone: { type: String, unique: true },
  isVerified: { type: Boolean, default: false },
  status: { type: String, default: 'pending_review' }
});

// Add method to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

const createAdmin = async () => {
  try {
    const uri = process.env.DATABASE_FULL_URL;
    if (!uri) throw new Error('DATABASE_FULL_URL missing');

    console.log('⏳ Connecting to DB...');
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected!');

    const email = 'final_admin@viatica.com';
    await User.deleteOne({ email }); // Ensure clean slate

    console.log('⏳ Creating admin user...');
    await User.create({
      name: 'Final Admin',
      email: email,
      password: 'password123',
      role: 'admin',
      phone: '0988776655',
      isVerified: true,
      status: 'verified'
    });

    console.log('🎉 Admin created successfully!');
    console.log('📧 Email: final_admin@viatica.com');
    console.log('🔑 Password: password123');
    process.exit();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

createAdmin();
