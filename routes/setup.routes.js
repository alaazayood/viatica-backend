const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/create-admin', async (req, res) => {
  try {
    // 1. Delete existing admin
    await User.deleteOne({ email: 'admin@viatica.com' });

    // 2. Create new admin (hooks will handle hashing automatically)
    const user = await User.create({
      name: 'Admin Owner',
      email: 'admin@viatica.com',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'admin',
      phone: '0912345600',
      isVerified: true,
      status: 'verified'
    });

    res.status(200).json({
      status: 'success',
      message: 'Admin user created successfully',
      data: {
        email: user.email,
        password: 'admin123'
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack
    });
  }
});

module.exports = router;
