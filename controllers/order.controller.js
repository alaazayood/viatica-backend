const mongoose = require('mongoose');
const Order = require('../models/Order');
const Drug = require('../models/Drug');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const notificationController = require('../controllers/notification.controller');
const User = require('../models/User'); 
const PharmacistStock = require('../models/PharmacistStock');
const Ledger = require('../models/Ledger');

const buildScope = (user) => {
  const filter = {};
  if (user.role === 'pharmacist') filter.pharmacist = user._id;
  if (user.role === 'warehouse')  filter.warehouse  = user._id;
  if (user.role === 'driver')     filter.driver     = user._id;
  return filter;
};

exports.getAllOrders = catchAsync(async (req, res, next) => {
  const page  = Math.max(1, +req.query.page || 1);
  const limit = Math.min(100, +req.query.limit || 20);
  const skip  = (page - 1) * limit;
  const filter = buildScope(req.user);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip(skip).limit(limit)
      .select('pharmacist warehouse driver status createdAt drugs')
      .populate('pharmacist warehouse driver', 'name role')
      .lean(),
    Order.countDocuments(filter)
  ]);

  res.status(200).json({ status: 'success', page, limit, total, results: orders.length, data: { orders } });
});

exports.getOrderById = catchAsync(async (req, res, next) => {
  const filter = { _id: req.params.id, ...buildScope(req.user) };
  const order = await Order.findOne(filter)
    .populate('pharmacist warehouse driver', 'name role')
    .populate('drugs.drug');
  if (!order) return next(new AppError('لا يوجد طلب بهذا المعرف أو لا تملك صلاحية الوصول', 404));
  res.status(200).json({ status: 'success', data: { order } });
});

exports.createOrder = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'pharmacist') return next(new AppError('الصيدلي فقط يمكنه إنشاء الطلب', 403));
  const { warehouse, drugs, deliveryAddress } = req.body;

  // 1. Fetch Active Offers for this Warehouse
  const Offer = require('../models/Offer');
  const activeOffers = await Offer.find({
    warehouse,
    isActive: true,
    endDate: { $gte: new Date() }
  });

  const finalDrugsList = [];
  let totalOrderValue = 0;

  // 2. Process items and apply business logic
  for (const item of drugs) {
    const drugDoc = await Drug.findById(item.drug);
    if (!drugDoc) throw new AppError('أحد الأدوية المطلوبة غير موجود', 400);

    // Find matching offer for this drug
    const offer = activeOffers.find(o => o.drug && String(o.drug) === String(item.drug));
    
    let unitPrice = drugDoc.price;
    let bonusItems = 0;

    if (offer) {
      // Apply % Discount
      if (offer.type === 'discount' && offer.discountPercentage) {
        unitPrice = unitPrice * (1 - offer.discountPercentage / 100);
      }
      
      // Calculate Bonus (10 + 2)
      if (offer.type === 'bonus' && offer.bonusBase && offer.bonusQuantity) {
        bonusItems = Math.floor(item.quantity / offer.bonusBase) * offer.bonusQuantity;
      }
    }

    const totalQuantityToDeduct = item.quantity + bonusItems;

    // Check & Deduct Stock
    const updated = await Drug.findOneAndUpdate(
      { _id: item.drug, warehouse, quantity: { $gte: totalQuantityToDeduct } },
      { $inc: { quantity: -totalQuantityToDeduct } },
      { new: true }
    );
    if (!updated) throw new AppError(`كمية غير كافية للدواء ${drugDoc.name}`, 400);

    // Add main item
    finalDrugsList.push({
      drug: item.drug,
      quantity: item.quantity,
      price: unitPrice,
      appliedOffer: offer ? offer._id : undefined
    });

    // Add bonus item if applicable
    if (bonusItems > 0) {
      finalDrugsList.push({
        drug: item.drug,
        quantity: bonusItems,
        price: 0,
        isBonus: true,
        appliedOffer: offer ? offer._id : undefined
      });
    }

    totalOrderValue += (unitPrice * item.quantity);
  }

  // 3. Check for Free Delivery Offers
  let isFreeDelivery = false;
  const deliveryOffer = activeOffers.find(o => o.freeDelivery && totalOrderValue >= o.minOrderValue);
  if (deliveryOffer) {
    isFreeDelivery = true;
  }

  const order = await Order.create({
    pharmacist: req.user._id,
    warehouse,
    drugs: finalDrugsList,
    deliveryAddress,
    isFreeDelivery,
    deliveryFee: isFreeDelivery ? 0 : 5000 // Default delivery fee if not free
  });

  res.status(201).json({ 
    status: 'success', 
    message: 'تم إنشاء الطلب وتطبيق العروض المتاحة تلقائياً', 
    data: { order } 
  });

  // Notify Admin
  try {
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await notificationController.createNotification(
        admin._id, 
        'طلب شراء جديد', 
        `قام الصيدلاني ${req.user.name} بإنشاء طلب شراء جديد بقيمة إجمالية.`
      );
    }
  } catch (err) {
    console.error('Notification error:', err);
  }
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('لا يوجد طلب بهذا المعرف', 404));
  // Authorization
  if (req.user.role === 'warehouse' || req.user.role === 'admin') {
    // allowed to update most statuses
  } else if (req.user.role === 'driver') {
    const driverAllowed = ['out_for_delivery','delivered'];
    if (!driverAllowed.includes(status)) return next(new AppError('السائق لا يملك صلاحية لتحديث هذه الحالة', 403));
    if (String(order.driver) !== String(req.user._id)) return next(new AppError('طلب غير مسند لهذا السائق', 403));
  } else {
    return next(new AppError('ليست لديك صلاحية لتحديث الطلب', 403));
  }

  // Validation: Cannot move to 'assigned' or 'out_for_delivery' without a driver
  if ((status === 'assigned' || status === 'out_for_delivery') && !order.driver) {
     return next(new AppError('لا يمكن تغيير الحالة قبل تعيين سائق للطلب', 400));
  }

  order.status = status;
  await order.save();

  // 1. Notify Pharmacist about status change
  try {
    let title = 'تحديث حالة الطلب';
    let message = `حالة طلبك رقم #${order._id.toString().slice(-6)} أصبحت الآن: ${status}`;
    
    if (status === 'confirmed') message = `تم تأكيد طلبك رقم #${order._id.toString().slice(-6)}. جاري التجهيز.`;
    if (status === 'out_for_delivery') message = `طلبك رقم #${order._id.toString().slice(-6)} في الطريق إليك الآن.`;
    if (status === 'delivered') message = `تم تسليم طلبك رقم #${order._id.toString().slice(-6)} بنجاح. شكراً لتعاملك معنا!`;
    if (status === 'cancelled') message = `تم إلغاء طلبك رقم #${order._id.toString().slice(-6)}. يرجى التواصل مع الإدارة.`;

    await notificationController.createNotification(order.pharmacist, title, message);
  } catch (notifyErr) {
    console.error('Error sending status notification:', notifyErr);
  }

  // Unified Order Closure Logic (Inventory + Ledger)
  if (status === 'delivered') {
    try {
      // 1. Sync Inventory (PharmacistStock)
      for (const item of order.drugs) {
        await PharmacistStock.findOneAndUpdate(
          { pharmacist: order.pharmacist, drug: item.drug },
          { 
            $inc: { quantity: item.quantity },
            // Batch/Expiry info would ideally come from the warehouse delivery system
            // For now we use placeholder or last known
          },
          { upsert: true, new: true }
        );
      }

      // 2. Sync Ledger (Financial Debt)
      // Calculate total order value (Price * Quantity for all items)
      const totalAmount = order.drugs.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      await Ledger.create({
        pharmacist: order.pharmacist,
        warehouse: order.warehouse,
        order: order._id,
        type: 'debt',
        amount: totalAmount,
        description: `فاتورة طلب رقم #${order._id.toString().slice(-6)}`
      });

      console.log(`Order ${order._id} closed: Inventory & Ledger updated.`);
    } catch (syncError) {
      console.error('Error in Order Closure Sync:', syncError);
      // In a production app, we might want to log this to a separate error queue for retry
    }
  }

  res.status(200).json({ status: 'success', data: { order } });
});

exports.assignDriver = catchAsync(async (req, res, next) => {
  if (!['warehouse','admin'].includes(req.user.role)) return next(new AppError('غير مصرح', 403));
  const { driverId } = req.body;
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, warehouse: req.user.role === 'warehouse' ? req.user._id : { $exists: true } },
    { driver: driverId, status: 'assigned' },
    { new: true }
  ).populate('driver', 'name role');
  if (!order) return next(new AppError('لا يوجد طلب أو لا تملك صلاحية', 404));
  res.status(200).json({ status: 'success', data: { order } });
});
