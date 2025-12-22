const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const catchAsync = require('../utils/catchAsync');
const PharmacistStock = require('../models/PharmacistStock');
const AppError = require('../utils/appError');

// Protected routes
router.use(auth.protect);

// Get Pharmacist's own stock
router.get('/my-stock', auth.restrictTo('pharmacist'), catchAsync(async (req, res) => {
  const stock = await PharmacistStock.find({ pharmacist: req.user._id })
    .populate('drug', 'name genericName category manufacturer')
    .sort('drug.name');
    
  res.status(200).json({ status: 'success', results: stock.length, data: { stock } });
}));

// Manually update stock (e.g. sale or adjustment)
router.patch('/:id/adjust', auth.restrictTo('pharmacist'), catchAsync(async (req, res, next) => {
  const { quantity } = req.body; // New absolute quantity
  const stock = await PharmacistStock.findOneAndUpdate(
    { _id: req.params.id, pharmacist: req.user._id },
    { quantity },
    { new: true }
  );
  
  if (!stock) return next(new AppError('Item not found', 404));
  res.status(200).json({ status: 'success', data: { stock } });
}));

module.exports = router;
