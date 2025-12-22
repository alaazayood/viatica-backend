const Offer = require('../models/Offer');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllOffers = catchAsync(async (req, res, next) => {
  let query = {
    isActive: true,
    endDate: { $gte: new Date() }
  };

  // If request coming from dashboard (warehouse/admin), they might want to see their own offers regardless of expiry
  if (req.user && (req.user.role === 'warehouse' || req.user.role === 'admin')) {
    query = req.user.role === 'admin' ? {} : { warehouse: req.user.id };
  }

  const offers = await Offer.find(query).populate('drug warehouse');

  res.status(200).json({
    status: 'success',
    results: offers.length,
    data: { offers }
  });
});

exports.createOffer = catchAsync(async (req, res, next) => {
  const newOffer = await Offer.create({
    ...req.body,
    warehouse: req.user.id
  });
  res.status(201).json({
    status: 'success',
    data: { offer: newOffer }
  });
});

exports.deleteOffer = catchAsync(async (req, res, next) => {
  await Offer.findByIdAndDelete(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null
  });
});
