const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.get('/me', authController.protect, authController.getMe);
router.patch('/updateMyPassword', authController.protect, authController.updatePassword);

// Admin only route to verify pharmacist
router.patch('/verify-pharmacist/:id', authController.protect, authController.restrictTo('admin'), authController.verifyPharmacist);

module.exports = router;
