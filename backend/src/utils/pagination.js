const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const getSort = (query, allowedFields = [], defaultField = 'createdAt', defaultDir = 'desc') => {
  const field = allowedFields.includes(query.sortBy) ? query.sortBy : defaultField;
  const direction = query.sortDir === 'asc' ? 'asc' : defaultDir;
  return { [field]: direction };
};

module.exports = { getPagination, getSort };
