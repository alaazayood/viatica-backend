const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/User');
const Order = require('../models/Order');
const Drug = require('../models/Drug');

exports.getDashboardStats = catchAsync(async (req, res, next) => {
  // 1) General Counts
  const totalUsers = await User.countDocuments();
  const totalOrders = await Order.countDocuments();
  const recentOrders = await Order.find().sort('-createdAt').limit(10);

  // 2) Real Sales Calculation (Last 30 days, status: delivered)
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const deliveredOrders = await Order.find({
    status: 'delivered',
    createdAt: { $gt: monthAgo }
  });

  let totalSales = 0;
  deliveredOrders.forEach(order => {
    order.drugs.forEach(item => {
      totalSales += (item.price * item.quantity);
    });
  });

  // 3) Low Stock Count
  const lowStock = await Drug.countDocuments({ quantity: { $lt: 10 } });

  const stats = {
    totalUsers,
    totalOrders,
    recentOrders,
    totalSales,
    lowStock
  };

  res.status(200).json({
    status: 'success',
    data: stats
  });
});