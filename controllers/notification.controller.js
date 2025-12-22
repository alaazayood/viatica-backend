const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort('-createdAt')
    .limit(50);

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: { notifications }
  });
});

exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError('لا يوجد إشعار بهذا المعرف', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { notification }
  });
});

exports.markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'تم تحديد جميع الإشعارات كمقروءة'
  });
});

// Utility to create notification (not an export for route)
exports.createNotification = async (userId, title, message) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};
