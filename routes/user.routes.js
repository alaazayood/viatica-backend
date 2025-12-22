const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const notificationController = require('../controllers/notification.controller');

// Helper to notify admin
const notifyAdmin = async (title, message) => {
  const admins = await User.find({ role: 'admin' });
  for (const admin of admins) {
    await notificationController.createNotification(admin._id, title, message);
  }
};

// Update current user profile
router.patch('/updateMe', auth.protect, upload.single('licenseImage'), catchAsync(async (req, res, next) => {
  // 1) Filter allowed fields
  const { name, pharmacyName, lat, lng } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (pharmacyName) updateData.pharmacyName = pharmacyName;
  if (req.file) updateData.licenseImage = req.file.path; // Cloudinary URL

  if (lat && lng) {
    updateData.location = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
  }

  // 2) Update user
  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: { user }
  });

  // Notify Admin if license image was uploaded
  if (req.file) {
    notifyAdmin('طلب انضمام جديد', `قام صيدلاني جديد (${user.name}) برفع ترخيص الصيدلية وينتظر التفعيل.`);
  }
}));

router.get('/', auth.protect, auth.restrictTo('admin'), catchAsync(async (req, res) => {
  const { role } = req.query;
  const page  = Math.max(1, +req.query.page || 1);
  const limit = Math.min(100, +req.query.limit || 20);
  const skip  = (page - 1) * limit;

  const filter = {};
  if (role) filter.role = role;

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort('-createdAt').skip(skip).limit(limit).lean(),
    User.countDocuments(filter)
  ]);
  res.status(200).json({ status: 'success', page, limit, total, results: users.length, data: { users } });
}));

router.get('/:id', auth.protect, auth.restrictTo('admin'), catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new AppError('لا يوجد مستخدم', 404));
  res.status(200).json({ status: 'success', data: { user } });
}));

router.patch('/:id/status', auth.protect, auth.restrictTo('admin'), catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!['pending_review', 'verified', 'rejected', 'suspended'].includes(status)) {
    return next(new AppError('حالة غير صالحة', 400));
  }

  const user = await User.findByIdAndUpdate(req.params.id, { 
    status,
    isVerified: status === 'verified'
  }, {
    new: true,
    runValidators: true
  });

  if (!user) return next(new AppError('لا يوجد مستخدم', 404));

  res.status(200).json({
    status: 'success',
    data: { user }
  });

  // Notify User about verification/rejection
  try {
    if (status === 'verified') {
      await notificationController.createNotification(user._id, 'تم تفعيل حسابك', 'تم مراجعة بياناتك وتفعيل حسابك بنجاح. يمكنك الآن البدء بطلب الأدوية واستخدام كافة ميزات فارمجي.');
    } else if (status === 'rejected') {
      await notificationController.createNotification(user._id, 'فشل تفعيل الحساب', 'نعتذر، لم يتم قبول طلب تفعيل حسابك. يرجى التأكد من صحة البيانات المرفوعة والتواصل مع الإدارة.');
    }
  } catch (notifyErr) {
    console.error('Error sending user verification notification:', notifyErr);
  }
}));

router.delete('/:id', auth.protect, auth.restrictTo('admin'), catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('لا يوجد مستخدم', 404));
  res.status(204).json({ status: 'success', data: null });
}));

module.exports = router;
