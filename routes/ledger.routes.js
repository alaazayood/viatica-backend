const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const catchAsync = require('../utils/catchAsync');
const Ledger = require('../models/Ledger');

// Protected routes
router.use(auth.protect);

// Get statement (for Pharmacist vs particular Warehouse OR for Admin/Warehouse to see Pharmacist)
router.get('/statement', catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === 'pharmacist') filter.pharmacist = req.user._id;
  if (req.user.role === 'warehouse')  filter.warehouse = req.user._id;
  
  // Allow filtering by specific pharmacist/warehouse via query
  if (req.query.pharmacist) filter.pharmacist = req.query.pharmacist;
  if (req.query.warehouse)  filter.warehouse = req.query.warehouse;

  const entries = await Ledger.find(filter)
    .sort('-transactionDate')
    .populate('warehouse pharmacist', 'name pharmacyName')
    .populate('order', 'status');

  res.status(200).json({ status: 'success', results: entries.length, data: { entries } });
}));

module.exports = router;
