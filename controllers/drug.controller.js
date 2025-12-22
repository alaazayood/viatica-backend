const Drug = require('../models/Drug');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const AIService = require('../services/ai.service');

exports.getAllDrugs = catchAsync(async (req, res, next) => {
  const { category, warehouse, expiresSoon, search } = req.query;
  
  let query = {};
  if (category) query.category = category;
  if (warehouse) query.warehouse = warehouse;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
      { activeIngredients: { $regex: search, $options: 'i' } }
    ];
  }
  if (expiresSoon === 'true') {
    query.expiryDate = { 
      $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  const drugs = await Drug.find(query).populate('warehouse');
  
  res.status(200).json({
    status: 'success',
    results: drugs.length,
    data: { drugs }
  });
});

exports.createDrug = catchAsync(async (req, res, next) => {
  const drug = await Drug.create({
    ...req.body,
    warehouse: req.user.id
  });

  await AIService.analyzeDrugData(drug);

  res.status(201).json({
    status: 'success',
    data: { drug }
  });
});

// الدوال الجديدة المضافة
exports.getDrugById = catchAsync(async (req, res, next) => {
  const drug = await Drug.findById(req.params.id).populate('warehouse');
  
  if (!drug) {
    return next(new AppError('No drug found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { drug }
  });
});

exports.updateDrug = catchAsync(async (req, res, next) => {
  const drug = await Drug.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!drug) {
    return next(new AppError('No drug found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { drug }
  });
});

exports.deleteDrug = catchAsync(async (req, res, next) => {
  const drug = await Drug.findByIdAndDelete(req.params.id);

  if (!drug) {
    return next(new AppError('No drug found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});