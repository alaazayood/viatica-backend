const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.generateInvoice = catchAsync(async (req, res, next) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId).populate('drugs.drug');
  if (!order) return next(new AppError('لا يوجد طلب بهذا المعرف', 404));
  const total = order.drugs.reduce((sum, d) => sum + (d.price * d.quantity), 0);
  const invoice = await Invoice.create({ order: order._id, total, status: 'unpaid' });
  res.status(201).json({ status: 'success', data: { invoice } });
});

exports.getAllInvoices = catchAsync(async (req, res, next) => {
  const page  = Math.max(1, +req.query.page || 1);
  const limit = Math.min(100, +req.query.limit || 20);
  const skip  = (page - 1) * limit;
  const filter = {};
  if (req.user.role === 'pharmacist') filter.pharmacist = req.user._id;
  if (req.user.role === 'warehouse')  filter.warehouse  = req.user._id;
  const [invoices, total] = await Promise.all([
    Invoice.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
    Invoice.countDocuments(filter)
  ]);
  res.status(200).json({ status: 'success', page, limit, total, results: invoices.length, data: { invoices } });
});

exports.getInvoiceById = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id).populate({ path: 'order', populate: [{ path: 'pharmacist warehouse driver', select: 'name role' }, { path: 'drugs.drug' }] });
  if (!invoice) return next(new AppError('لا يوجد فاتورة بهذا المعرف', 404));
  res.status(200).json({ status: 'success', data: { invoice } });
});
