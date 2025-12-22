const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'يجب إدخال عنوان العرض'],
    trim: true
  },
  subtitle: {
    type: String,
    required: [true, 'يجب إدخال تفاصيل العرض']
  },
  type: {
    type: String,
    enum: ['bonus', 'discount', 'general'],
    default: 'general'
  },
  drug: {
    type: mongoose.Schema.ObjectId,
    ref: 'Drug'
  },
  warehouse: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  imageUrl: String,
  color: {
    type: String,
    default: 'blue' // blue, purple, teal, orange
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'يجب تحديد تاريخ انتهاء العرض']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  bonusQuantity: {
    type: Number,
    min: 0
  },
  bonusBase: {
    type: Number,
    min: 0
  },
  freeDelivery: {
    type: Boolean,
    default: false
  },
  minOrderValue: {
    type: Number,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
