const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server xatosi';

  // Prisma errors
  if (err.code === 'P2002') {
    statusCode = 409;
    const field = err.meta?.target?.[0] || 'maydon';
    message = `Bu ${field} allaqachon mavjud`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = err.meta?.cause || 'Yozuv topilmadi';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Bog\'liq yozuv topilmadi — ID noto\'g\'ri yoki mavjud emas';
  } else if (err.code === 'P2011') {
    statusCode = 400;
    message = `Majburiy maydon bo\'sh qoldirilgan: ${err.meta?.constraint || ''}`;
  } else if (err.code === 'P2014') {
    statusCode = 400;
    message = 'Bog\'liq yozuvlar mavjud — avval ularni o\'chiring';
  } else if (err.code === 'P2021') {
    statusCode = 500;
    message = 'Jadval topilmadi — migratsiya bajarilmagan bo\'lishi mumkin';
  } else if (err.code === 'P2022') {
    statusCode = 500;
    message = `Ustun topilmadi: ${err.meta?.column || ''} — migratsiya bajarilmagan bo\'lishi mumkin`;
  } else if (err.code && err.code.startsWith('P')) {
    statusCode = 400;
    message = `Ma\'lumotlar bazasi xatosi (${err.code})`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Yaroqsiz token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token muddati tugagan';
  }

  // SyntaxError (malformed JSON body)
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'So\'rov formati noto\'g\'ri (JSON xatosi)';
  }

  logger.error(`[${statusCode}] ${req.method} ${req.path}`, {
    message: err.message,
    code: err.code,
    ...(statusCode >= 500 && { stack: err.stack }),
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, prismaCode: err.code }),
  });
};

module.exports = errorHandler;
