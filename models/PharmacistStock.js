const mongoose = require('mongoose');

const pharmacistStockSchema = new mongoose.Schema({
  pharmacist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String
  },
  threshold: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true
});

// Create a compound index for pharmacist and drug to prevent duplicates
pharmacistStockSchema.index({ pharmacist: 1, drug: 1 }, { unique: true });

const PharmacistStock = mongoose.model('PharmacistStock', pharmacistStockSchema);
module.exports = PharmacistStock;
