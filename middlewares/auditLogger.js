const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');

const SENSITIVE_KEYS = new Set(['password','token','authorization','license','licenseDoc','passwordResetToken','passwordResetExpires']);

module.exports = catchAsync(async (req, res, next) => {
  const body = {};
  if (req.body && typeof req.body === 'object') {
    for (const [k, v] of Object.entries(req.body)) {
      body[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[FILTERED]' : v;
    }
  }
  await AuditLog.log({
    method: req.method,
    path: req.originalUrl,
    user: req.user?._id,
    metadata: body,
    timestamp: new Date()
  });
  next();
});
