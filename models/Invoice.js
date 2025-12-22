const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ['unpaid','paid','cancelled'], default: 'unpaid' }
}, { timestamps: true });

invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
