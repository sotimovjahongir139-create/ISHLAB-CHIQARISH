const success = (res, data = null, message = 'Muvaffaqiyatli', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const created = (res, data = null, message = 'Yaratildi') => {
  return success(res, data, message, 201);
};

const paginated = (res, data, total, page, limit, extra = {}) => {
  return res.status(200).json({
    success: true,
    message: 'Muvaffaqiyatli',
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
    ...extra,
  });
};

const error = (res, message = 'Xatolik yuz berdi', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, created, paginated, error };
