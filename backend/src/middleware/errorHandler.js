const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server xatosi';

  // Prisma errors
  if (err.code === 'P2002') {
    statusCode = 409;
    message = `Bu ${err.meta?.target?.join(', ')} allaqachon mavjud`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Yozuv topilmadi';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Bog\'liq yozuv topilmadi';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Yaroqsiz token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token muddati tugagan';
  }

  if (statusCode === 500) {
    logger.error('Unhandled error:', { message: err.message, stack: err.stack, path: req.path });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
