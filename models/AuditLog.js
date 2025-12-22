const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    enum: ['User', 'Drug', 'Order', 'Invoice']
  },
  entityId: mongoose.Schema.ObjectId,
  performedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: Object,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Middleware to log changes
auditLogSchema.statics.log = async function(data) {
  await this.create(data);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);