// middlewares/error.js

const AppError = require('../utils/appError');

const errorHandler = (err, req, res, next) => {
  console.error('ERROR 💥', err);

  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';

  res.status(statusCode).json({
    status,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
